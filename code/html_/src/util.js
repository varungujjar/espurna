

function mergeTemplate(target, template) {
    for (let child of Array.from(template.children)) {
        target.appendChild(child);
    }
}


function loadTemplate(name) {
    let template = document.getElementById(`template-${name}`);
    return document.importNode(template.content, true);
}


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

export { mergeTemplate, loadTemplate, cardStatus, fromSchema, notifyError }