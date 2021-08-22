/*

WEBSOCKET MODULE

Copyright (C) 2016-2019 by Xose Pérez <xose dot perez at gmail dot com>

*/

#include "ws.h"

#if WEB_SUPPORT

#include <vector>

#include "system.h"
#include "ntp.h"
#include "utils.h"
#include "web.h"
#include "wifi.h"
#include "ws_internal.h"

#include "libs/WebSocketIncommingBuffer.h"

// -----------------------------------------------------------------------------
// Periodic updates
// -----------------------------------------------------------------------------

namespace {

uint32_t _ws_last_update = 0;

void _wsResetUpdateTimer() {
    _ws_last_update = millis() + WS_UPDATE_INTERVAL;
}

void _wsUpdate(JsonObject& root) {
    root["heap"] = systemFreeHeap();
    root["uptime"] = systemUptime();
    root["rssi"] = WiFi.RSSI();
    root["loadaverage"] = systemLoadAverage();
    if (ADC_MODE_VALUE == ADC_VCC) {
        root["vcc"] = ESP.getVcc();
    } else {
        root["vcc"] = "N/A (TOUT) ";
    }
#if NTP_SUPPORT
    // XXX: arduinojson default config stores:
    // - double as float
    // - int64_t as int32_t
    // Simply send the string...
    if (ntpSynced()) {
        auto info = ntpInfo();

        constexpr size_t TimeSize { sizeof(time_t) };
        const char* const fmt = (TimeSize == 8) ? "%lld" : "%ld";
        char buffer[TimeSize * 4];
        sprintf(buffer, fmt, info.now);
        root["now"] = String(buffer);

        root["nowString"] = info.utc;
        root["nowLocalString"] = info.local.length()
            ? info.local
            : info.utc;
    }
#endif
}

void _wsDoUpdate(const bool connected) {
    if (!connected) return;
    if (millis() - _ws_last_update > WS_UPDATE_INTERVAL) {
        _ws_last_update = millis();
        wsSend(_wsUpdate);
    }
}

} // namespace

// -----------------------------------------------------------------------------
// WS callbacks
// -----------------------------------------------------------------------------

namespace {

AsyncWebSocket _ws("/ws");
std::queue<WsPostponedCallbacks> _ws_queue;
ws_callbacks_t _ws_callbacks;

} // namespace

void wsPost(uint32_t client_id, ws_on_send_callback_f&& cb) {
    _ws_queue.emplace(client_id, std::move(cb));
}

void wsPost(ws_on_send_callback_f&& cb) {
    wsPost(0, std::move(cb));
}

void wsPost(uint32_t client_id, const ws_on_send_callback_f& cb) {
    _ws_queue.emplace(client_id, cb);
}

void wsPost(const ws_on_send_callback_f& cb) {
    wsPost(0, cb);
}

namespace {

template <typename T>
void _wsPostCallbacks(uint32_t client_id, T&& cbs, WsPostponedCallbacks::Mode mode) {
    _ws_queue.emplace(client_id, std::forward<T>(cbs), mode);
}

} // namespace

void wsPostAll(uint32_t client_id, ws_on_send_callback_list_t&& cbs) {
    _wsPostCallbacks(client_id, std::move(cbs), WsPostponedCallbacks::Mode::All);
}

void wsPostAll(ws_on_send_callback_list_t&& cbs) {
    wsPostAll(0, std::move(cbs));
}

void wsPostAll(uint32_t client_id, const ws_on_send_callback_list_t& cbs) {
    _wsPostCallbacks(client_id, cbs, WsPostponedCallbacks::Mode::All);
}

void wsPostAll(const ws_on_send_callback_list_t& cbs) {
    wsPostAll(0, cbs);
}

void wsPostSequence(uint32_t client_id, ws_on_send_callback_list_t&& cbs) {
    _wsPostCallbacks(client_id, std::move(cbs), WsPostponedCallbacks::Mode::Sequence);
}

void wsPostSequence(ws_on_send_callback_list_t&& cbs) {
    wsPostSequence(0, std::move(cbs));
}

void wsPostSequence(uint32_t client_id, const ws_on_send_callback_list_t& cbs) {
    _wsPostCallbacks(client_id, cbs, WsPostponedCallbacks::Mode::Sequence);
}

void wsPostSequence(const ws_on_send_callback_list_t& cbs) {
    wsPostSequence(0, cbs);
}

// -----------------------------------------------------------------------------

ws_callbacks_t& ws_callbacks_t::onVisible(ws_callbacks_t::on_send_f cb) {
    on_visible.push_back(cb);
    return *this;
}

ws_callbacks_t& ws_callbacks_t::onConnected(ws_callbacks_t::on_send_f cb) {
    on_connected.push_back(cb);
    return *this;
}

ws_callbacks_t& ws_callbacks_t::onData(ws_callbacks_t::on_send_f cb) {
    on_data.push_back(cb);
    return *this;
}

ws_callbacks_t& ws_callbacks_t::onAction(ws_callbacks_t::on_action_f cb) {
    on_action.push_back(cb);
    return *this;
}

ws_callbacks_t& ws_callbacks_t::onKeyCheck(ws_callbacks_t::on_keycheck_f cb) {
    on_keycheck.push_back(cb);
    return *this;
}

// -----------------------------------------------------------------------------
// WS authentication
// -----------------------------------------------------------------------------

namespace {

constexpr size_t WsMaxClients { WS_MAX_CLIENTS };

WsTicket _ws_tickets[WsMaxClients];

void _onAuth(AsyncWebServerRequest* request) {
    webLog(request);
    if (!webAuthenticate(request)) {
        return request->requestAuthentication();
    }

    IPAddress ip = request->client()->remoteIP();
    unsigned long now = millis();

    size_t index;
    for (index = 0; index < WsMaxClients; ++index) {
        if (_ws_tickets[index].ip == ip) break;
        if (_ws_tickets[index].timestamp == 0) break;
        if (now - _ws_tickets[index].timestamp > WS_TIMEOUT) break;
    }
    if (index == WS_MAX_CLIENTS) {
        request->send(429);
    } else {
        _ws_tickets[index].ip = ip;
        _ws_tickets[index].timestamp = now;
        request->send(200, "text/plain", "OK");
    }

}

void _wsAuthUpdate(AsyncWebSocketClient* client) {
    IPAddress ip = client->remoteIP();
    for (auto& ticket : _ws_tickets) {
        if (ticket.ip == ip) {
            ticket.timestamp = millis();
            break;
        }
    }
}

bool _wsAuth(AsyncWebSocketClient* client) {
    IPAddress ip = client->remoteIP();
    unsigned long now = millis();

    for (auto& ticket : _ws_tickets) {
        if (ticket.ip == ip) {
            if (now - ticket.timestamp < WS_TIMEOUT) {
                return true;
            }
            return false;
        }
    }

    return false;
}

} // namespace

// -----------------------------------------------------------------------------
// Debug
// -----------------------------------------------------------------------------


#if DEBUG_WEB_SUPPORT

namespace {

constexpr size_t WsDebugMessagesMax = 8;
WsDebug _ws_debug(WsDebugMessagesMax);

} // namespace

void WsDebug::send(bool connected) {
    if (!connected && _flush) {
        clear();
        return;
    }

    if (!_flush) return;
    // ref: http://arduinojson.org/v5/assistant/
    // {"weblog": {"msg":[...],"pre":[...]}}
    DynamicJsonBuffer jsonBuffer(2*JSON_ARRAY_SIZE(_messages.size()) + JSON_OBJECT_SIZE(1) + JSON_OBJECT_SIZE(2));

    JsonObject& root = jsonBuffer.createObject();
    JsonObject& weblog = root.createNestedObject("weblog");

    JsonArray& msg_array = weblog.createNestedArray("msg");
    JsonArray& pre_array = weblog.createNestedArray("pre");

    for (auto& msg : _messages) {
        pre_array.add(msg.first.c_str());
        msg_array.add(msg.second.c_str());
    }

    wsSend(root);
    clear();
}

bool wsDebugSend(const char* prefix, const char* message) {
    if ((wifiConnected() || wifiApStations()) && wsConnected()) {
        _ws_debug.add(prefix, message);
        return true;
    }

    return false;
}

#endif

// -----------------------------------------------------------------------------
// Store indexed key (key0, key1, etc.) from array
// -----------------------------------------------------------------------------

namespace {

// Check the existing setting before saving it
// TODO: this should know of the default values, somehow?
bool _wsStore(const String& key, const String& value) {
    if (!hasSetting(key) || value != getSetting(key)) {
        return setSetting(key, value);
    }

    return false;
}

bool _wsStore(const String& prefix, JsonArray& values) {
    bool changed { false };

    size_t index { 0 };
    for (auto& element : values) {
        const auto value = element.as<String>();
        const auto key = SettingsKey {prefix, index};

        auto kv = settings::internal::get(key.value());
        if (!kv || (value != kv.ref())) {
            setSetting(key, value);
            changed = true;
        }
        ++index;
    }

    // Remove every key with index greater than the array size
    // TODO: should this be delegated to the modules, since they know better how much entities they could store?
    constexpr size_t SettingsMaxListCount { SETTINGS_MAX_LIST_COUNT };
    for (auto next_index = index; next_index < SettingsMaxListCount; ++next_index) {
        if (!delSetting({prefix, next_index})) {
            break;
        }
        changed = true;
    }

    return changed;
}

// TODO: generate "accepted" keys in the initial phase of the connection?
// TODO: is value ever used... by anything?
bool _wsCheckKey(const char* key, JsonVariant& value) {
    for (auto& callback : _ws_callbacks.on_keycheck) {
        if (callback(key, value)) {
            return true;
        }
    }
    return false;
}

bool _wsProcessAdminPass(JsonVariant& value) {
    auto current = getAdminPass();
    if (value.is<String>()) {
        auto string = value.as<String>();
        if (!current.equalsConstantTime(string)) {
            setSetting("adminPass", string);
            return true;
        }
    } else if (value.is<JsonArray&>()) {
        JsonArray& values = value.as<JsonArray&>();
        if (values.size() == 2) {
            auto lhs = values[0].as<String>();
            auto rhs = values[1].as<String>();
            if ((lhs == rhs) && (!current.equalsConstantTime(lhs))) {
                setSetting("adminPass", lhs);
                return true;
            }
        }
    }

    return false;
}

void _wsPostParse(uint32_t client_id, bool save, bool reload) {
    if (save) {
        saveSettings();
        espurnaReload();

        wsPost(client_id, [save, reload](JsonObject& root) {
            if (reload) {
                root["action"] = F("reload");
            } else if (save) {
                root["saved"] = true;
            }
            root["message"] = F("Changes saved");
        });

        return;
    }

    wsPost(client_id, [](JsonObject& root) {
        root["message"] = F("No changes detected");
    });
}

void _wsParse(AsyncWebSocketClient *client, uint8_t * payload, size_t length) {

    //DEBUG_MSG_P(PSTR("[WEBSOCKET] Parsing: %s\n"), length ? (char*) payload : "");

    // Get client ID
    uint32_t client_id = client->id();

    // Check early for empty object / nothing
    if ((length == 0) || (length == 1)) {
        return;
    }

    if ((length == 3) && (strcmp((char*) payload, "{}") == 0)) {
        return;
    }

    // Parse JSON input
    // TODO: json buffer should be pretty efficient with the non-const payload,
    // most of the space is taken by the object key references
    DynamicJsonBuffer jsonBuffer(512);
    JsonObject& root = jsonBuffer.parseObject((char *) payload);
    if (!root.success()) {
        DEBUG_MSG_P(PSTR("[WEBSOCKET] JSON parsing error\n"));
        wsSend_P(client_id, PSTR("{\"message\": \"Cannot parse the data!\"}"));
        return;
    }

    // Check actions -----------------------------------------------------------

    const char* action = root["action"];
    if (action) {
        if (strcmp(action, "ping") == 0) {
            wsSend_P(client_id, PSTR("{\"pong\": 1}"));
            _wsAuthUpdate(client);
            return;
        }

        if (strcmp(action, "reboot") == 0) {
            deferredReset(100, CustomResetReason::Web);
            return;
        }

        if (strcmp(action, "reconnect") == 0) {
            static Ticker timer;
            timer.once_ms_scheduled(100, []() {
                wifiDisconnect();
                yield();
            });
            return;
        }

        if (strcmp(action, "factory_reset") == 0) {
            factoryReset();
            return;
        }

        JsonObject& data = root["data"];
        if (data.success()) {
            if (strcmp(action, "restore") == 0) {
                if (settingsRestoreJson(data)) {
                    wsSend_P(client_id, PSTR("{\"message\": \"Changes saved, you should be able to reboot now.\"}"));
                } else {
                    wsSend_P(client_id, PSTR("{\"message\": \"Could not restore the configuration, see the debug log for more information.\"}"));
                }
                return;
            }

            for (auto& callback : _ws_callbacks.on_action) {
                callback(client_id, action, data);
            }
        }
    };

    // Check configuration -----------------------------------------------------

    JsonObject& config = root["config"];
    if (config.success()) {

        DEBUG_MSG_P(PSTR("[WEBSOCKET] Parsing configuration data\n"));

        bool save = false;
        bool reload = false;

        for (auto& kv : config) {
            bool changed = false;

            String key = kv.key;
            JsonVariant& value = kv.value;

            if (key == "adminPass") {
                if (_wsProcessAdminPass(value)) {
                    save = true;
                    reload = true;
                    continue;
                }
            } else if (key == "webPort") {
                if (value.as<int>() == 0) {
                    continue;
                } else if (value.as<int>() > static_cast<int>(std::numeric_limits<uint16_t>::max())) {
                    continue;
                }
            }
#if NTP_SUPPORT
            else if (key == "ntpTZ") {
                _wsResetUpdateTimer();
            }
#endif

            if (!_wsCheckKey(key.c_str(), value)) {
                delSetting(key);
                continue;
            }

            // Store values
            if (value.is<JsonArray&>()) {
                if (_wsStore(key, value.as<JsonArray&>())) changed = true;
            } else {
                if (_wsStore(key, value.as<String>())) changed = true;
            }

            // Update flags if value has changed
            if (changed) {
                save = true;
            }
        }

        _wsPostParse(client_id, save, reload);
    }
}

bool _wsOnKeyCheck(const char * key, JsonVariant& value) {
    if (strncmp(key, "ws", 2) == 0) return true;
    if (strncmp(key, "admin", 5) == 0) return true;
    if (strncmp(key, "hostname", 8) == 0) return true;
    if (strncmp(key, "desc", 4) == 0) return true;
    if (strncmp(key, "webPort", 7) == 0) return true;
    return false;
}

void _wsOnConnected(JsonObject& root) {
    root["webMode"] = WEB_MODE_NORMAL;

    root["app_name"] = getAppName();
    root["app_version"] = getVersion();
    root["app_build"] = buildTime();
    root["device"] = getDevice();
    root["manufacturer"] = getManufacturer();
    root["chipid"] = getChipId().c_str();
    root["mac"] = getFullChipId().c_str();
    root["bssid"] = WiFi.BSSIDstr();
    root["channel"] = WiFi.channel();
    root["hostname"] = getSetting("hostname", getIdentifier());
    root["desc"] = getSetting("desc");
    root["network"] = wifiStaSsid();
    root["deviceip"] = wifiStaIp().toString();
    root["sketch_size"] = ESP.getSketchSize();
    root["free_size"] = ESP.getFreeSketchSpace();
    root["sdk"] = ESP.getSdkVersion();
    root["core"] = getCoreVersion();

    root["webPort"] = getSetting("webPort", WEB_PORT);
    root["wsAuth"] = getSetting("wsAuth", 1 == WS_AUTHENTICATION);
}

void _wsConnected(uint32_t client_id) {

    const bool changePassword = (USE_PASSWORD && WEB_FORCE_PASS_CHANGE)
        ? getAdminPass().equals(ADMIN_PASS)
        : false;

    if (changePassword) {
        StaticJsonBuffer<JSON_OBJECT_SIZE(1)> jsonBuffer;
        JsonObject& root = jsonBuffer.createObject();
        root["webMode"] = WEB_MODE_PASSWORD;
        wsSend(client_id, root);
        return;
    }

    wsPostAll(client_id, _ws_callbacks.on_visible);
    wsPostSequence(client_id, _ws_callbacks.on_connected);
    wsPostSequence(client_id, _ws_callbacks.on_data);

}

void _wsEvent(AsyncWebSocket * server, AsyncWebSocketClient * client, AwsEventType type, void * arg, uint8_t *data, size_t len){

    if (type == WS_EVT_CONNECT) {

        client->_tempObject = nullptr;
        String ip = client->remoteIP().toString();

#ifndef NOWSAUTH
        if (!_wsAuth(client)) {
            wsSend_P(client->id(), PSTR("{\"action\": \"reload\", \"message\": \"Session expired.\"}"));
            DEBUG_MSG_P(PSTR("[WEBSOCKET] #%u session expired for %s\n"), client->id(), ip.c_str());
            client->close();
            return;
        }
#endif

        DEBUG_MSG_P(PSTR("[WEBSOCKET] #%u connected, ip: %s, url: %s\n"), client->id(), ip.c_str(), server->url());
        _wsConnected(client->id());
        _wsResetUpdateTimer();
        client->_tempObject = new WebSocketIncommingBuffer(_wsParse, true);

    } else if(type == WS_EVT_DISCONNECT) {
        DEBUG_MSG_P(PSTR("[WEBSOCKET] #%u disconnected\n"), client->id());
        if (client->_tempObject) {
            delete (WebSocketIncommingBuffer *) client->_tempObject;
            client->_tempObject = nullptr;
        }
        wifiApCheck();

    } else if(type == WS_EVT_ERROR) {
        DEBUG_MSG_P(PSTR("[WEBSOCKET] #%u error(%u): %s\n"), client->id(), *((uint16_t*)arg), (char*)data);

    } else if(type == WS_EVT_PONG) {
        DEBUG_MSG_P(PSTR("[WEBSOCKET] #%u pong(%u): %s\n"), client->id(), len, len ? (char*) data : "");

    } else if(type == WS_EVT_DATA) {
        //DEBUG_MSG_P(PSTR("[WEBSOCKET] #%u data(%u): %s\n"), client->id(), len, len ? (char*) data : "");
        if (!client->_tempObject) return;
        WebSocketIncommingBuffer *buffer = (WebSocketIncommingBuffer *)client->_tempObject;
        AwsFrameInfo * info = (AwsFrameInfo*)arg;
        buffer->data_event(client, info, data, len);

    }

}

void _wsHandlePostponedCallbacks(bool connected) {
    // TODO: make this generic loop method to queue important ws messages?
    //       or, if something uses ticker / async ctx to send messages,
    //       it needs a retry mechanism built into the callback object
    if (!connected && !_ws_queue.empty()) {
        _ws_queue.pop();
        return;
    }

    if (_ws_queue.empty()) return;
    auto& callbacks = _ws_queue.front();

    // avoid stalling forever when can't send anything
    constexpr decltype(ESP.getCycleCount()) WsQueueTimeoutClockCycles = microsecondsToClockCycles(10 * 1000 * 1000); // 10s
    if (ESP.getCycleCount() - callbacks.timestamp > WsQueueTimeoutClockCycles) {
        _ws_queue.pop();
        return;
    }

    // client_id == 0 means we need to send the message to every client
    if (callbacks.client_id) {
        AsyncWebSocketClient* ws_client = _ws.client(callbacks.client_id);

        // ...but, we need to check if client is still connected
        if (!ws_client) {
            _ws_queue.pop();
            return;
        }

        // wait until we can send the next batch of messages
        // XXX: enforce that callbacks send only one message per iteration
        if (ws_client->queueIsFull()) {
            return;
        }
    }

    // XXX: block allocation will try to create *2 next time,
    // likely failing and causing wsSend to reference empty objects
    // XXX: arduinojson6 will not do this, but we may need to use per-callback buffers
    constexpr size_t WsQueueJsonBufferSize = 3192;
    DynamicJsonBuffer jsonBuffer(WsQueueJsonBufferSize);
    JsonObject& root = jsonBuffer.createObject();

    callbacks.send(root);
    if (callbacks.client_id) {
        wsSend(callbacks.client_id, root);
    } else {
        wsSend(root);
    }
    yield();

    if (callbacks.done()) {
        _ws_queue.pop();
    }
}

void _wsLoop() {
    const bool connected = wsConnected();
    _wsDoUpdate(connected);
    _wsHandlePostponedCallbacks(connected);
    #if DEBUG_WEB_SUPPORT
        _ws_debug.send(connected);
    #endif
}

} // namespace

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

bool wsConnected() {
    return (_ws.count() > 0);
}

bool wsConnected(uint32_t client_id) {
    return _ws.hasClient(client_id);
}

void wsPayloadModule(JsonObject& root, const char* const name) {
    const char* const key { "modulesVisible" };
    JsonArray& modules = root.containsKey(key)
        ? root[key]
        : root.createNestedArray(key);
    modules.add(name);
}

ws_callbacks_t& wsRegister() {
    return _ws_callbacks;
}

void wsSend(JsonObject& root) {
    // Note: 'measurement' tries to serialize json contents byte-by-byte,
    //       which is somewhat costly, but likely unavoidable for us.
    size_t len = root.measureLength();
    AsyncWebSocketMessageBuffer* buffer = _ws.makeBuffer(len);

    if (buffer) {
        root.printTo(reinterpret_cast<char*>(buffer->get()), len + 1);
        _ws.textAll(buffer);
    }
}

void wsSend(uint32_t client_id, JsonObject& root) {
    AsyncWebSocketClient* client = _ws.client(client_id);
    if (client == nullptr) return;

    size_t len = root.measureLength();
    AsyncWebSocketMessageBuffer* buffer = _ws.makeBuffer(len);

    if (buffer) {
        root.printTo(reinterpret_cast<char*>(buffer->get()), len + 1);
        client->text(buffer);
    }
}

void wsSend(ws_on_send_callback_f callback) {
    if (_ws.count() > 0) {
        DynamicJsonBuffer jsonBuffer(512);
        JsonObject& root = jsonBuffer.createObject();
        callback(root);

        wsSend(root);
    }
}

void wsSend(const char * payload) {
    if (_ws.count() > 0) {
        _ws.textAll(payload);
    }
}

void wsSend_P(const char* payload) {
    if (_ws.count() > 0) {
        char buffer[strlen_P(payload)];
        strcpy_P(buffer, payload);
        _ws.textAll(buffer);
    }
}

void wsSend(uint32_t client_id, ws_on_send_callback_f callback) {
    AsyncWebSocketClient* client = _ws.client(client_id);
    if (client == nullptr) return;

    DynamicJsonBuffer jsonBuffer(512);
    JsonObject& root = jsonBuffer.createObject();
    callback(root);
    wsSend(client_id, root);
}

void wsSend(uint32_t client_id, const char * payload) {
    _ws.text(client_id, payload);
}

void wsSend_P(uint32_t client_id, const char* payload) {
    char buffer[strlen_P(payload)];
    strcpy_P(buffer, payload);
    _ws.text(client_id, buffer);
}

void wsSetup() {

    _ws.onEvent(_wsEvent);
    webServer().addHandler(&_ws);

    // CORS
    const String webDomain = getSetting("webDomain", WEB_REMOTE_DOMAIN);
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", webDomain);
    if (!webDomain.equals("*")) {
        DefaultHeaders::Instance().addHeader("Access-Control-Allow-Credentials", "true");
    }

    webServer().on("/auth", HTTP_GET, _onAuth);

    wsRegister()
        .onConnected(_wsOnConnected)
        .onKeyCheck(_wsOnKeyCheck);

    espurnaRegisterLoop(_wsLoop);
}

#endif // WEB_SUPPORT
