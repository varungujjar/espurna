import * as util from './util';

var Ago = 0;
var Now = 0;

function keepTime() {
    // $("span[data-key='ago']").html(Ago);
    ++Ago;
    if (0 === Now) {
        return;
    }
    let text = (new Date(Now * 1000))
        .toISOString().substring(0, 19)
        .replace("T", " ");
    $("div[data-key='now']").html(text);
    ++Now;
}

function process(data) {
    Object.keys(data).forEach((key) => {
        let value = data[key];
        if("ntpStatus" === key){
            $(`span[data-key='${key}']`).html(value ? "Time Synced" : "Time not Synced");
            util.cardStatus(key, value ? 'success': 'warning');
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

export { process, keepTime }
