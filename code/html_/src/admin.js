import * as websocket from './websocket'
import * as util from './util'
import * as main from './main'

var FreeSize = 0;


function askSaveSettings(ask) {
    if (main.Settings.counters.changed > 0) {
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
        websocket.sendAction("reconnect");
    });
}

function askAndCallReboot() {
    askAndCall([askSaveSettings, askReboot], () => {
        websocket.sendAction("reboot");
    });
}

function askAndCallAction(event) {
    askAndCall([(ask) => ask(`Confirm the action: "${event.target.textContent}"`)], () => {
        websocket.sendAction(event.target.name);
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
            websocket.sendAction("restore", data);
            console.log(data);
        } catch (e) {
            util.notifyError(null, null, 0, 0, e);
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
        }
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
        websocket.sendAction("factory_reset");
    }
}


function process(data) {
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


function init(){
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

export { process, init }
