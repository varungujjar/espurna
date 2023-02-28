
function process(data) {
    Object.keys(data).forEach((key) => {
        let value = data[key];
        if ("app_version" in data) {
            $("h3[data-key='app_version']").html("Firmware version "+data.app_version);
        }
    });

}

export { process }
