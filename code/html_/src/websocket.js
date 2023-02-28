import * as sensors from './sensors';
import * as ntp from './ntp';
import * as wifi from './wifi';
import * as mqtt from './mqtt';
import * as board from './board';
import * as admin from './admin';
import * as main from './main';
import * as util from './util';

var Urls = null;
var WebsockPingPong = null;
var Websock = { send: function () { }, close: function () { } };


class UrlsBase {
    constructor(root) {
        this.root = root;
        const paths = ["ws", "upgrade", "config", "auth"];
        paths.forEach((path) => {
            this[path] = new URL(path, root);
            this[path].protocol = root.protocol;
        });

        if (this.root.protocol === "https:") {
            this.ws.protocol = "wss:";
        } else {
            this.ws.protocol = "ws:";
        }
    }
}


function pageReloadIn(milliseconds) {
    setTimeout(() => {
        window.location.reload();
    }, parseInt(milliseconds, 10));
}


function send(payload) {
    Websock.send(payload);
}


function sendAction(action, data) {
    if (data === undefined) {
        data = {};
    }
    send(JSON.stringify({ action, data }));
}

function processSocketData(data) {
    // console.log(data);
    sensors.process(data);
    ntp.process(data);
    wifi.process(data);
    mqtt.process(data);
    board.process(data);
    admin.process(data);
    main.process(data);
    main.initOrignalValues(data);
}


function onWebSocketMessage(event) {
    let data = {};
    try {
        data = JSON.parse(event.data
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t"));
    } catch (e) {
        // notifyError(null, null, 0, 0, e);
    }
    processSocketData(data);
}


function webSocketPing() {
    sendAction("ping");
}


function onWebSocketOpen() {
    WebsockPingPong = setInterval(webSocketPing, 5000);
}


function onWebSocketClose() {
    clearInterval(WebsockPingPong);
    if (window.confirm("Connection lost with the device, click OK to refresh the page")) {
        window.location.reload();
    }
}


function connectToURL(url) {
    Urls = new UrlsBase(url);
    setInterval(() => ntp.keepTime(), 1000);
    fetch(Urls.auth.href, {
        'method': 'GET',
        'cors': true,
        'credentials': 'same-origin'
    }).then((response) => {
        if (response.status === 200) {
            if (Websock) {
                Websock.close();
            }
            Websock = new WebSocket(Urls.ws.href);
            Websock.onmessage = onWebSocketMessage;
            Websock.onclose = onWebSocketClose;
            Websock.onopen = onWebSocketOpen;
            document.getElementById("downloader").href = Urls.config.href;
            return;
        }
        // Nothing to do, reload page and retry on errors
        util.notifyError(`${Urls.ws.href} responded with status code ${response.status}, reloading the page`, null, 0, 0, null);
        pageReloadIn(5000);
    }).catch((error) => {
        util.notifyError(null, null, 0, 0, error);
        pageReloadIn(5000);
    });
}


function init() {

     // don't autoconnect when opening from filesystem
     if (window.location.protocol === "file:") {
        processData({webMode: 0});
        return;
    }

    const search = new URLSearchParams(window.location.search),
        host = search.get("host");
        // host = "http://192.168.1.103";
    if (host !== null) {
        if (!host.startsWith("http:") && !host.startsWith("https:")) {
            host = "http://" + host;
        }
        connectToURL(new URL(host));
    } else {
        connectToURL(new URL(window.location));
    }
}

export { init, sendAction, send, pageReloadIn };