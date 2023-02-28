import * as websocket from './websocket';
import * as wifi from './wifi';
import * as admin from './admin';
import * as mqtt from './mqtt';



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
            websocket.sendAction("reboot");
        }
    } else if (Settings.counters.reconnect > 0) {
        response = window.confirm("You have to reconnect to the WiFi for the changes to take effect, do you want to do it now?");
        if (response) {
            websocket.sendAction("reconnect");
        }
    } else if (Settings.counters.reload > 0) {
        response = window.confirm("You have to reload the page to see the latest changes, do you want to do it now?");
        if (response) {
            websocket.pageReloadIn(0);
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
    websocket.send(JSON.stringify({config: data}));
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
        if(value === true){ value = 1; }else if(value===false){ value = 0}else{ value = value}
        $(`[name='${key}']`).attr('data-original',value);
    })
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
        }else{
            $(this).attr('data-changed',false);
            --Settings.counters.changed;
            if(getDataAction!==undefined){
                --Settings.counters[getDataAction];
            }
            
        }
    })
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
            })
            // }           
      }, 500);
    }else{
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
};


function initMenu() {
    $('.sidebar-button').on('click', function() {
      $('.content').toggleClass('isOpen');
    });
    $('.nav li a').on('click', function() {
      $('.content').removeClass('isOpen');
    });
  };


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
    websocket.init();
    wifi.init();
    admin.init();
    mqtt.init();
    initMenu();
    initPanel();
    initFormChanges();
    initsubmitForms();
});

export { initOrignalValues, setSelectValue, initOrignalValuesNode, initFormChanges, Settings, process, formSubmit }

