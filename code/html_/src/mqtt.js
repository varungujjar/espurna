import * as util from './util';


function mqttEnabled(){
    if($("input[name='mqttEnabled']").is(':checked')){
        $(".mqtt-enable").show(); 
    }else{
        $(".mqtt-enable").hide();  
    }
}


function process(data) {
    Object.keys(data).forEach((key) => {
        let value = data[key];
        if("mqttStatus" === key){
            $(`span[data-key='${key}']`).html(value ? "Connected" : "Disconnected");
            util.cardStatus(key, value ? 'success': '');
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

function init(){
    $("input[name='mqttEnabled']").on('change', mqttEnabled);
}

export { process, init}