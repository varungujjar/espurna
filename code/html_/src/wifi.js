import * as util from './util';
import * as websocket from './websocket';
import * as main from './main';

var countNetwork = 0;


function delNetwork() {
    var parent = $(this).parents(".template-network");
    $(parent).remove();
    ++main.Settings.counters.changed
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
    })
    $(line).find(".label-network-name").html('Network Name '+ ++countNetwork);
    $(line).find(".button-del-network").on("click", delNetwork);
    $(line).find(".button-more-network").on("click", moreNetwork);
    $(line).find(".wifi-button-update").on("click", main.formSubmit);
    line.appendTo("#networks");
    main.initOrignalValuesNode(line);
    main.initFormChanges();
}


function wifiScanResult(values) {
    $('.button-wifi-scan').removeClass('loading');
    $('.button-wifi-scan').prop('disabled',false);
    for (let button of document.querySelectorAll(".button-wifi-scan")) {
        button.disabled = false;
    }
    const container = document.getElementById("scanResult");
    const info = util.loadTemplate("wifi-card");

    const showName = info.querySelector(".card-details-title");
    const getTitle = values[4];
    showName.innerHTML = getTitle;
    
    const showLock = info.querySelector(".icon-lock");
    if(values[1]=='OPEN'){
        $(showLock).hide();
    }else{
        $(showLock).show();
    }
    util.mergeTemplate(container, info);
}


function wifiScan(event) {
    event.preventDefault();
    $('#scanResult').html('');
    $('.button-wifi-scan').addClass('loading');
    $('.button-wifi-scan').prop('disabled',true);
    websocket.sendAction("scan");
}


function process(data) {
    if ("network" in data) {
        $("div[data-key='network']").html(data.network == "" ? "WIFI" : data.network);

        $("span[data-key='deviceip']").html(data.deviceip == "(IP unset)" ? "Not Connected" : data.deviceip);
        if (data.network == ""){
            util.cardStatus("wifiStatus", 'alert');
        }else{
            util.cardStatus("wifiStatus", 'success');
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
                wifiNetworkAdd(util.fromSchema(entries, value.schema), false);
            });
            return;
        }

        if ("scanResult" === key) {
            wifiScanResult(value);
            return;
        }
    });

}

function init(){
    $('.button-wifi-scan').on('click', wifiScan);
    $('.button-add-network').on('click', wifiNetworkAdd);
}


export { init, process }