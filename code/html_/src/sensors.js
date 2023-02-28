
import * as util from './util';
import * as main from './main';

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
        const line = util.loadTemplate("magnitude-units");
        line.querySelector("label").textContent =
            `${Magnitudes.types[magnitude.type]} #${magnitude.index_global}`;

        const select = line.querySelector("select");
        select.setAttribute("name", magnitudeTypedKey(magnitude, "Units"));

        const options = [];
        supported.forEach(([id, name]) => {
            options.push({id, name});
        });

        initSelect(select, options);
        main.setSelectValue(select, magnitude.units);
        
        main.initOrignalValuesNode(line);
        util.mergeTemplate(document.getElementById("magnitude-units"), line);
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
    const info = util.loadTemplate("magnitude-card");
    const schemaName = {
        'tmp': Magnitudes.types[magnitude.type],
        'hum': Magnitudes.types[magnitude.type],
        'press': Magnitudes.types[magnitude.type],
        'co2': 'CO<span class="card-details-title-sub">2</span>',
        'pm1dot5': 'PM<span class="card-details-title-sub">2.5</span>',
        'pm10': 'PM<span class="card-details-title-sub">10</span>',
        'lux': Magnitudes.types[magnitude.type],
        'analog': 'TVOC',
    }
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
    showUnit.textContent = Magnitudes.units.names[magnitude.units]
    
    util.mergeTemplate(container, info);
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

function process(data) {
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

export { process }

