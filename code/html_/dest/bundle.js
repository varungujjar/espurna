(function (exports) {
    'use strict';

    function mergeTemplate(target, template) {
        for (let child of Array.from(template.children)) {
            target.appendChild(child);
        }
    }


    function loadTemplate(name) {
        let template = document.getElementById(`template-${name}`);
        return document.importNode(template.content, true);
    }


    function fromSchema$1(source, schema) {
        if (schema.length !== source.length) {
            throw `Schema mismatch! Expected length ${schema.length} vs. ${source.length}`;
        }
        var target = {};
        schema.forEach((key, index) => {
            target[key] = source[index];
        });
        return target;
    }


    function cardStatus(classname,type){
        var classKey = "."+classname;
        $(classKey).removeClass('card-yellow');
        $(classKey).removeClass('card-red');
        $(classKey).removeClass('card-green');
        if(type=='success'){
            $(classKey).addClass('card-green');
        }else if(type=='warning'){
            $(classKey).addClass('card-yellow');
        }else if(type=='alert'){
            $(classKey).addClass('card-red');
        }
    }

    function notifyError(message, source, lineno, colno, error) {
        let container = document.getElementById("error-notification");
        if (container.childElementCount > 0) {
            return;
        }
        container.style.display = "inherit";
        container.style.whiteSpace = "pre-wrap";

        let notification = document.createElement("div");
        notification.classList.add("pure-u-1");
        notification.classList.add("pure-u-lg-1");
        if (error) {
            notification.textContent += error.stack;
        } else {
            notification.textContent += message;
        }
        notification.textContent += "\n\nFor more info see the Developer Tools console.";
        container.appendChild(notification);

        return false;
    }

    var Magnitudes = {
        properties: {},
        errors: {},
        types: {},
        units: {
            names: {},
            supported: {}
        },
        typePrefix: {},
        prefixType: {}
    };


    function fromSchema(source, schema) {
        if (schema.length !== source.length) {
            throw `Schema mismatch! Expected length ${schema.length} vs. ${source.length}`;
        }
        var target = {};
        schema.forEach((key, index) => {
            target[key] = source[index];
        });
        return target;
    }

    function magnitudeTypedKey(magnitude, name) {
        const prefix = Magnitudes.typePrefix[magnitude.type];
        const index = magnitude.index_global;
        return `${prefix}${name}${index}`;
    }

    function initSelect(select, values) {
        for (let value of values) {
            let option = document.createElement("option");
            option.setAttribute("value", value.id);
            option.textContent = value.name;
            select.appendChild(option);
        }
    }



    function createMagnitudeUnitSelector(id, magnitude) {
        // but, no need for the element when there's no choice
        const supported = Magnitudes.units.supported[id];
        if ((supported !== undefined) && (supported.length > 1)) {
            const line = loadTemplate("magnitude-units");
            line.querySelector("label").textContent =
                `${Magnitudes.types[magnitude.type]} #${magnitude.index_global}`;

            const select = line.querySelector("select");
            select.setAttribute("name", magnitudeTypedKey(magnitude, "Units"));

            const options = [];
            supported.forEach(([id, name]) => {
                options.push({id, name});
            });

            initSelect(select, options);
            setSelectValue(select, magnitude.units);
            
            initOrignalValuesNode(line);
            mergeTemplate(document.getElementById("magnitude-units"), line);
        }
    }


    function initMagnitudes(data) {
        data.types.values.forEach((cfg) => {
            const info = fromSchema(cfg, data.types.schema);
            Magnitudes.types[info.type] = info.name;
            Magnitudes.typePrefix[info.type] = info.prefix;
            Magnitudes.prefixType[info.prefix] = info.type;
        });

        data.errors.values.forEach((cfg) => {
            const error = fromSchema(cfg, data.errors.schema);
            Magnitudes.errors[error.type] = error.name;
        });

        data.units.values.forEach((cfg, id) => {
            const values = fromSchema(cfg, data.units.schema);
            values.supported.forEach(([type, name]) => {
                Magnitudes.units.names[type] = name;
            });

            Magnitudes.units.supported[id] = values.supported;
        });
    }


    function initMagnitudesList(data, callbacks) {
        data.values.forEach((cfg, id) => {
            const magnitude = fromSchema(cfg, data.schema);
            const prettyName = Magnitudes.types[magnitude.type]
                .concat(" #").concat(parseInt(magnitude.index_global, 10));

            const result = {
                name: prettyName,
                units: magnitude.units,
                type: magnitude.type,
                index_global: magnitude.index_global,
                description: magnitude.description
            };

            Magnitudes.properties[id] = result;
            callbacks.forEach((callback) => {
                callback(id, result);
            });
        });
    }


    function createMagnitudeInfo(id, magnitude) {
        const container = document.getElementById("magnitudes");
        const info = loadTemplate("magnitude-card");
        const schemaName = {
            'tmp': Magnitudes.types[magnitude.type],
            'hum': Magnitudes.types[magnitude.type],
            'press': Magnitudes.types[magnitude.type],
            'co2': 'CO<span class="card-details-title-sub">2</span>',
            'pm1dot5': 'PM<span class="card-details-title-sub">2.5</span>',
            'pm10': 'PM<span class="card-details-title-sub">10</span>',
            'lux': Magnitudes.types[magnitude.type],
            'analog': 'TVOC',
        };
        const addCardIndex = info.querySelector(".card");
        addCardIndex.setAttribute("class", "card card-"+id);

        const addIcon = info.querySelector(".icon");
        const getType = Magnitudes.typePrefix[magnitude.type];
        addIcon.setAttribute("class", "icon icon-"+getType);

        const addIndex = info.querySelector(".card-details-value");
        addIndex.setAttribute("class", "card-details-value card-details-value-"+id);

        const showName = info.querySelector(".card-details-title");
        const getPrefix = schemaName[Magnitudes.typePrefix[magnitude.type]];
        showName.innerHTML = getPrefix;

        const showUnit = info.querySelector(".card-details-unit");
        showUnit.textContent = Magnitudes.units.names[magnitude.units];
        
        mergeTemplate(container, info);
    }


    function updateMagnitudes(data) {
        data.values.forEach((cfg, id) => {
            if (!Magnitudes.properties[id]) {
                return;
            }
            const magnitude = fromSchema(cfg, data.schema);
            const input = document.querySelector(`.card-details-value-${id}`);
            var thisValue = (0 !== magnitude.error)
                ? Magnitudes.errors[magnitude.error]
                : (("nan" === magnitude.value)
                    ? ""
                    : magnitude.value);

            input.textContent = parseFloat(thisValue).toFixed(2).replace(/\.0+$/,'');         
        });
    }

    function process$6(data) {
        Object.keys(data).forEach((key) => {
            let value = data[key];

            if("snsRead" === key){
                $(`select[name='${key}']`).val(value.toString()).change();
            }

            if("snsReport" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("snsRealTime" === key){
                $(`input[name='${key}']`).prop('checked', value);
            }

            if ("magnitudes-init" === key) {
                initMagnitudes(value);
                return;
            }

            if ("magnitudes-module" === key) {
                initModuleMagnitudes(value);
                return;
            }

            if ("magnitudes-list" === key) {
                initMagnitudesList(value, [createMagnitudeUnitSelector, createMagnitudeInfo]);
                return;
            }

            if ("magnitudes" === key) {
                updateMagnitudes(value);
                return;
            }
        });

    }

    var Now = 0;

    function keepTime() {
        if (0 === Now) {
            return;
        }
        let text = (new Date(Now * 1000))
            .toISOString().substring(0, 19)
            .replace("T", " ");
        $("div[data-key='now']").html(text);
        ++Now;
    }

    function process$5(data) {
        Object.keys(data).forEach((key) => {
            let value = data[key];
            if("ntpStatus" === key){
                $(`span[data-key='${key}']`).html(value ? "Time Synced" : "Time not Synced");
                cardStatus(key, value ? 'success': 'warning');
            }

            if ("now" === key) {
                Now = parseInt(value, 10);
                return;
            }

            if("nowString" === key){
                $(`input[name='${key}']`).val(value);
            }
            if("nowLocalString" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("ntpServer" === key){
                $(`input[name='${key}']`).val(value);
            }
            if("ntpTZ" === key){
                $(`input[name='${key}']`).val(value);
            }
        });

    }

    var countNetwork = 0;


    function delNetwork() {
        var parent = $(this).parents(".template-network");
        $(parent).remove();
        ++Settings.counters.changed;
    }


    function moreNetwork() {
        var parent = $(this).parents(".template-network");
        $(".template-network-more", parent).toggle();
        $(".template-network-more", parent).is(":visible") ? $(parent).addClass('template-network-selected') : $(parent).removeClass('template-network-selected');
    }


    function wifiNetworkAdd(cfg, showMore) {
        if (cfg === undefined) {
            cfg = {};
        }
        var template = $("#template-network").html();
        var line = $(template).clone();

        var numNetworks = $("#networks > div").length;
        if (numNetworks >= 5) {
            alert("Max number of networks reached");
            return null;
        }
        Object.keys(cfg).forEach((key) => {
            let value = cfg[key];
            $(line).find(`input[name='${key}']`).val(value);
        });
        $(line).find(".label-network-name").html('Network Name '+ ++countNetwork);
        $(line).find(".button-del-network").on("click", delNetwork);
        $(line).find(".button-more-network").on("click", moreNetwork);
        $(line).find(".wifi-button-update").on("click", formSubmit);
        line.appendTo("#networks");
        initOrignalValuesNode(line);
        initFormChanges();
    }


    function wifiScanResult(values) {
        $('.button-wifi-scan').removeClass('loading');
        $('.button-wifi-scan').prop('disabled',false);
        for (let button of document.querySelectorAll(".button-wifi-scan")) {
            button.disabled = false;
        }
        const container = document.getElementById("scanResult");
        const info = loadTemplate("wifi-card");

        const showName = info.querySelector(".card-details-title");
        const getTitle = values[4];
        showName.innerHTML = getTitle;
        
        const showLock = info.querySelector(".icon-lock");
        if(values[1]=='OPEN'){
            $(showLock).hide();
        }else {
            $(showLock).show();
        }
        mergeTemplate(container, info);
    }


    function wifiScan(event) {
        event.preventDefault();
        $('#scanResult').html('');
        $('.button-wifi-scan').addClass('loading');
        $('.button-wifi-scan').prop('disabled',true);
        sendAction("scan");
    }


    function process$4(data) {
        if ("network" in data) {
            $("div[data-key='network']").html(data.network == "" ? "WIFI" : data.network);

            $("span[data-key='deviceip']").html(data.deviceip == "(IP unset)" ? "Not Connected" : data.deviceip);
            if (data.network == ""){
                cardStatus("wifiStatus", 'alert');
            }else {
                cardStatus("wifiStatus", 'success');
            }
        }

        Object.keys(data).forEach((key) => {
            let value = data[key];

            if("wifiApSsid" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("wifiApPass" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("wifiScan" === key){
                $(`input[name='${key}']`).prop('checked', value);
            }

            if("wifiScanRssi" === key){
                $(`input[name='${key}']`).val(value);
            }

            if ("wifiConfig" === key) {
                let container = document.getElementById("networks");
                container.dataset["settingsMax"] = value.max;
                value.networks.forEach((entries) => {
                    wifiNetworkAdd(fromSchema$1(entries, value.schema));
                });
                return;
            }

            if ("scanResult" === key) {
                wifiScanResult(value);
                return;
            }
        });

    }

    function init$3(){
        $('.button-wifi-scan').on('click', wifiScan);
        $('.button-add-network').on('click', wifiNetworkAdd);
    }

    function mqttEnabled(){
        if($("input[name='mqttEnabled']").is(':checked')){
            $(".mqtt-enable").show(); 
        }else {
            $(".mqtt-enable").hide();  
        }
    }


    function process$3(data) {
        Object.keys(data).forEach((key) => {
            let value = data[key];
            if("mqttStatus" === key){
                $(`span[data-key='${key}']`).html(value ? "Connected" : "Disconnected");
                cardStatus(key, value ? 'success': '');
            }

            if("mqttEnabled" === key){
                $(`input[name='${key}']`).prop('checked', value);
                mqttEnabled();
            }

            if("mqttServer" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("mqttPort" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("mqttUser" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("mqttPassword" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("mqttClientID" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("mqttQoS" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("mqttKeep" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("mqttRetain" === key){
                $(`input[name='${key}']`).prop('checked', value);
            }

            if("mqttTopic" === key){
                $(`input[name='${key}']`).val(value);
            }

            if("mqttUseJson" === key){
                $(`input[name='${key}']`).prop('checked', value);
            }

        });

    }

    function init$2(){
        $("input[name='mqttEnabled']").on('change', mqttEnabled);
    }

    function process$2(data) {
        Object.keys(data).forEach((key) => {
            data[key];
            if ("app_version" in data) {
                $("h3[data-key='app_version']").html("Firmware version "+data.app_version);
            }
        });

    }

    var FreeSize = 0;


    function askSaveSettings(ask) {
        if (Settings.counters.changed > 0) {
            return ask("There are pending changes to the settings, continue the operation without saving?");
        }
        return true;
    }

    function askDisconnect(ask) {
        return ask("Are you sure you want to disconnect from the current WiFi network?");
    }

    function askReboot(ask) {
        return ask("Are you sure you want to reboot the device?");
    }

    function askAndCall(questions, callback) {
        for (let question of questions) {
            if (!question(window.confirm)) {
                return;
            }
        }
        callback();
    }

    function askAndCallReconnect() {
        askAndCall([askSaveSettings, askDisconnect], () => {
            sendAction("reconnect");
        });
    }

    function askAndCallReboot() {
        askAndCall([askSaveSettings, askReboot], () => {
            sendAction("reboot");
        });
    }


    function checkFirmware(file, callback) {
        const reader = new FileReader();
        reader.onloadend = function(event) {
            if (FileReader.DONE === event.target.readyState) {
                const magic = event.target.result.charCodeAt(0);
                if ((0x1F === magic) && (0x8B === event.target.result.charCodeAt(1))) {
                    callback(true);
                    return;
                }

                if (0xE9 !== magic) {
                    alert("Binary image does not start with a magic byte");
                    callback(false);
                    return;
                }

                const flash_mode = event.target.result.charCodeAt(2);
                if (0x03 !== flash_mode) {
                    const modes = ['QIO', 'QOUT', 'DIO', 'DOUT'];
                    callback(window.confirm(`Binary image is using ${modes[flash_mode]} flash mode! Make sure that the device supports it before proceeding.`));
                } else {
                    callback(true);
                }
            }
        };

        const blob = file.slice(0, 3);
        reader.readAsBinaryString(blob);
    }

    function handleFirmwareUpgrade(event) {
        event.preventDefault();

        let upgrade = document.querySelector("input[name='upgrade']");
        let file = upgrade.files[0];
        if (typeof file === "undefined") {
            alert("First you have to select a file from your computer.");
            return;
        }

        if (file.size > FreeSize) {
            alert("Image it too large to fit in the available space for OTA. Consider doing a two-step update.");
            return;
        }

        checkFirmware(file, (ok) => {
            if (!ok) {
                return;
            }

            var data = new FormData();
            data.append("upgrade", file, file.name);

            var xhr = new XMLHttpRequest();

            var msg_ok = "Firmware image uploaded, board rebooting. This page will be refreshed in 5 seconds.";
            var msg_err = "There was an error trying to upload the new image, please try again: ";

            var network_error = function(e) {
                alert(msg_err + " xhr request " + e.type);
            };
            xhr.addEventListener("error", network_error, false);
            xhr.addEventListener("abort", network_error, false);

            let progress = document.getElementById("upgrade-progress");
            xhr.addEventListener("load", () => {
                progress.style.display = "none";
                if ("OK" === xhr.responseText) {
                    alert(msg_ok);
                } else {
                    alert(msg_err + xhr.status.toString() + " " + xhr.statusText + ", " + xhr.responseText);
                }
            }, false);

            xhr.upload.addEventListener("progress", (event) => {
                progress.style.display = "inherit";
                if (event.lengthComputable) {
                    progress.value = event.loaded;
                    progress.max = event.total;
                }
            }, false);

            xhr.open("POST", Urls.upgrade.href);
            xhr.send(data);
        });
    }


    function handleSettingsFile(event) {
        event.preventDefault();

        const inputFiles = event.target.files;
        if (typeof inputFiles === "undefined" || inputFiles.length === 0) {
            return false;
        }

        const inputFile = inputFiles[0];
        event.target.value = "";

        if (!window.confirm("Previous settings will be overwritten. Are you sure you want to restore from this file?")) {
            return false;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                var data = JSON.parse(event.target.result);
                sendAction("restore", data);
                console.log(data);
            } catch (e) {
                notifyError(null, null, 0, 0, e);
            }
        };
        reader.readAsText(inputFile);
    }


    function randomString(length, args) {
        if (typeof args === "undefined") {
            args = {
                lowercase: true,
                uppercase: true,
                numbers: true,
                special: true
            };
        }
        var mask = "";
        if (args.lowercase) { mask += "abcdefghijklmnopqrstuvwxyz"; }
        if (args.uppercase) { mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; }
        if (args.numbers || args.hex) { mask += "0123456789"; }
        if (args.hex) { mask += "ABCDEF"; }
        if (args.special) { mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\"; }
        var source = new Uint32Array(length);
        var result = new Array(length);
        window.crypto.getRandomValues(source).forEach((value, i) => {
            result[i] = mask[value % mask.length];
        });
        return result.join("");
    }


    function generateApiKey() {
        $(`input[name='apiKey']`).val(randomString(16, {hex: true}));
    }


    function resetToFactoryDefaults(event) {
        event.preventDefault();
        let response = window.confirm("Are you sure you want to erase all settings from the device?");
        if (response) {
            sendAction("factory_reset");
        }
    }


    function process$1(data) {
        Object.keys(data).forEach((key) => {
            let value = data[key];
            if ("webPort" in data) {
                $(`input[name='${key}']`).val(value);
            }
            if ("apiKey" in data) {
                $(`input[name='${key}']`).val(value);
            }
            if ("free_size" in data) {
                $(`span[data-key='${key}']`).html(value);
            }
            if("wsAuth" === key){
                $(`input[name='${key}']`).prop('checked', value);
            }
            if("apiEnabled" === key){
                $(`input[name='${key}']`).prop('checked', value);
            }
            if("apiRestFul" === key){
                $(`input[name='${key}']`).prop('checked', value);
            }
            if("btnRepDel" === key){
                $(`input[name='${key}']`).val(value);
            }
            if("desc" === key){
                $(`input[name='${key}']`).val(value);
            }
        });

    }


    function init$1(){
        $('.button-apikey').on('click', generateApiKey);
        $('.button-settings-factory').on('click', resetToFactoryDefaults);
        $('.button-upgrade').on('click', handleFirmwareUpgrade);
        $('.button-settings-reboot').on('click', askAndCallReboot);
        $('.button-settings-reconnect').on('click', askAndCallReconnect);
        $('#uploader').on('change', handleSettingsFile);

        $('.button-settings-restore').on('click', function(){
            $("#uploader").trigger('click');
        });

        $('.button-upgrade-browse').on('click', function(){
            $( "input[name='upgrade']" ).trigger( "click" );
        });

        $('input[name=upgrade]').on('change', function(event){
            $( "input[name='filename']" ).val(event.target.files[0].name);
        });
    }

    var Urls$1 = null;
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
        process$6(data);
        process$5(data);
        process$4(data);
        process$3(data);
        process$2(data);
        process$1(data);
        process(data);
        initOrignalValues(data);
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
        Urls$1 = new UrlsBase(url);
        setInterval(() => keepTime(), 1000);
        fetch(Urls$1.auth.href, {
            'method': 'GET',
            'cors': true,
            'credentials': 'same-origin'
        }).then((response) => {
            if (response.status === 200) {
                if (Websock) {
                    Websock.close();
                }
                Websock = new WebSocket(Urls$1.ws.href);
                Websock.onmessage = onWebSocketMessage;
                Websock.onclose = onWebSocketClose;
                Websock.onopen = onWebSocketOpen;
                document.getElementById("downloader").href = Urls$1.config.href;
                return;
            }
            // Nothing to do, reload page and retry on errors
            notifyError(`${Urls$1.ws.href} responded with status code ${response.status}, reloading the page`, null, 0, 0, null);
            pageReloadIn(5000);
        }).catch((error) => {
            notifyError(null, null, 0, 0, error);
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

    class SettingsBase {
        constructor() {
            this.counters = {};
            this.resetCounters();
            this.saved = false;
        }
        resetCounters() {
            this.counters.changed = 0;
            this.counters.reboot = 0;
            this.counters.reconnect = 0;
            this.counters.reload = 0;
        }
    }
    var Settings = new SettingsBase();


    function afterSaved() {
        var response;
        if (Settings.counters.reboot > 0) {
            response = window.confirm("You have to reboot the board for the changes to take effect, do you want to do it now?");
            if (response) {
                sendAction("reboot");
            }
        } else if (Settings.counters.reconnect > 0) {
            response = window.confirm("You have to reconnect to the WiFi for the changes to take effect, do you want to do it now?");
            if (response) {
                sendAction("reconnect");
            }
        } else if (Settings.counters.reload > 0) {
            response = window.confirm("You have to reload the page to see the latest changes, do you want to do it now?");
            if (response) {
                pageReloadIn(0);
            }
        }
        Settings.resetCounters();
    }


    function waitForSaved(){
        console.log(Settings.saved);
        if (!Settings.saved) {
            setTimeout(waitForSaved, 1000);
        } else {
            afterSaved();
        }
    }


    function sendConfig(data) {
        send(JSON.stringify({config: data}));
    }


    function getInputValue(element) {
        if ($(element).attr("type") === "checkbox") {
            return $(element).prop("checked") ? 1 : 0;
        } else if ($(element).attr("type") === "radio") {
            if (!$(element).prop("checked")) {
                return null;
            }
        }
        return $(element).val();
    }

    function getData(form) {
        var group = ['ssid','pass','ip','gw','mask', 'dns'];
        var data = {};
        $("input,select", form).each(function() {
            var name = $(this).attr("name");
            var value = getInputValue(this);
            if (null !== value) {
                if (name in data) {
                    if (!Array.isArray(data[name])) {
                        data[name] = [data[name]];
                    }
                    data[name].push(value);
                }else {
                    group.includes(name) ? data[name] = [value] : data[name] = value;                
                }
            }
        });
        return data;
    }


    function initOrignalValues(data){
        Object.keys(data).forEach((key) => {
            let value = data[key];
            if(value === true){ value = 1; }else if(value===false){ value = 0;}else { value = value;}
            $(`[name='${key}']`).attr('data-original',value);
        });
    }


    function bitsetToSelectedValues(bitset) {
        let values = [];
        for (let index = 0; index < 31; ++index) {
            if (bitset & (1 << index)) {
                values.push(index.toString());
            }
        }

        return values;
    }


    function setSelectValue(select, value) {
        let values = select.multiple
            ? bitsetToSelectedValues(value)
            : [value.toString()];

        Array.from(select.options)
            .filter((option) => values.includes(option.value))
            .forEach((option) => {
                option.selected = true;
            });
    }

    function initOrignalValuesNode(node){
         $('input,select', node).each(function(){
            var value = $(this).val();
            switch($(this).attr('type')){
                case "text":
                case "password":
                case "number":
                    value = value;
                    break;
            }
            $(this).attr('data-original',value);
        });
    }


    function initFormChanges(){
        $('input,select').on('change',function(){
            let getOriginalVal = $(this).attr('data-original');
            let getChangedVal =$(this).val();
            let getDataAction = $(this).attr('data-action');
            if(getOriginalVal!==getChangedVal){
                $(this).attr('data-changed',true);
                ++Settings.counters.changed;
                if(getDataAction!==undefined){
                    ++Settings.counters[getDataAction];
                }
            }else {
                $(this).attr('data-changed',false);
                --Settings.counters.changed;
                if(getDataAction!==undefined){
                    --Settings.counters[getDataAction];
                }
                
            }
        });
    }

    function formSubmit(){
        if(Settings.counters.changed>0){
            $(this).addClass('loading');
            $(this).prop('disabled',true);
            setTimeout(function (){
                let forms = document.getElementsByClassName("form-settings");
                // if (validateForms(forms)) {
                console.log(getData(forms));
                sendConfig(getData(forms));
                Settings.counters.changed = 0;
                waitForSaved();
                $('.button-update, .wifi-button-update').each(function(){
                    $(this).removeClass('loading');
                    $(this).prop('disabled',false);
                });
                // }           
          }, 500);
        }else {
            alert("No changes detected");
        }
        return false; 
    }


    function initsubmitForms() {
        $('.button-update').on('click', formSubmit);
    }


    function initPanel() {
        $('.menu-link').on('click', function(){
            $(".panel").hide();
            $('.menu-link').removeClass('active');
            $(this).addClass('active');
            $("#" + $(this).attr("data")).show();
        }); 
    }

    function initMenu() {
        $('.sidebar-button').on('click', function() {
          $('.content').toggleClass('isOpen');
        });
        $('.nav li a').on('click', function() {
          $('.content').removeClass('isOpen');
        });
      }

    function process(data) {
        Object.keys(data).forEach((key) => {
            let value = data[key];
            if ("saved" === key) {
                Settings.saved = value;
                return;
            }

            if ("message" === key) {
                window.alert(value);
                return;
            }  
        });
    }


    $(document).ready(function() {
        init();
        init$3();
        init$1();
        init$2();
        initMenu();
        initPanel();
        initFormChanges();
        initsubmitForms();
    });

    exports.Settings = Settings;
    exports.formSubmit = formSubmit;
    exports.initFormChanges = initFormChanges;
    exports.initOrignalValues = initOrignalValues;
    exports.initOrignalValuesNode = initOrignalValuesNode;
    exports.process = process;
    exports.setSelectValue = setSelectValue;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
