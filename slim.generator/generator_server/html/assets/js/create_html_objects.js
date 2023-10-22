const create_html_object = async (type, properties) => {
    const html_object = document.createElement(type);
    if(properties) {
        if(properties.hasOwnProperty('append_objects')) {
            if(Array.isArray(properties.append_objects)) {
                for(const child of properties.append_objects) {
                    html_object.appendChild(child);
                }
            }
            else {
                throw new Error('html.create_object.append_objects expects an array');
            }
        }
        if(properties.hasOwnProperty('classes')) {
            for(const class_name of properties.classes) {
                if(class_name.length > 0)
                    html_object.classList.add(class_name);
            }
        }
        if(properties.hasOwnProperty('data-parent')) {
            html_object.dataset.parent = properties['data-parent'];
        }
        if(properties.hasOwnProperty('data-text')) {
            html_object.dataset.text = properties['data-text'];
        }
        if('node_type' in properties) {
            if(properties.node_type === 'text') {
                html_object.dataset.node_type = 'text';
            }
        }
        if(properties.hasOwnProperty('href')) {
            html_object.setAttribute('href', properties.href);
        }
        if(properties.hasOwnProperty('id')) {
            html_object.setAttribute('id', properties.id);
        }
        if(properties.hasOwnProperty('innerHTML')) {
            html_object.innerHTML = properties.innerHTML;
        }
        if(properties.hasOwnProperty('style')) {
            html_object.setAttribute('style', properties.style);
        }
        if(properties.hasOwnProperty('target')) {
            html_object.setAttribute('target', properties.target);
        }
        if(properties.hasOwnProperty('text')) {
            html_object.textContent = properties.text;
        }
    }
    return html_object;
}
const create_empty = async() => {
    return document.createDocumentFragment('');
}
const create_a = async(properties) => {
    return await create_html_object('a', properties);
}
const create_details = async(properties) => {
    return await create_html_object('details', properties);
}
const create_div = async(properties) => {
    return await create_html_object('div', properties);
}
const create_li = async(properties) => {
    return await create_html_object('li', properties);
}
const create_summary = async(properties) => {
    return await create_html_object('summary', properties);
}
const create_span = async(properties) => {
    return await create_html_object('span', properties);
}
const create_table = async(properties) => {
    return await create_html_object('table', properties);
}
const create_td = async(properties) => {
    return await create_html_object('td', properties);
}
const create_th = async(properties) => {
    return await create_html_object('th', properties);
}
const create_tr = async(properties) => {
    return await create_html_object('tr', properties);
}
const create_ul = async(properties) => {
    return await create_html_object('ul', properties);
}
export const html = {
    create_empty:create_empty,
    create_a:create_a,
    create_details:create_details,
    create_div:create_div,
    create_li:create_li,
    create_summary:create_summary,
    create_span:create_span,
    create_table:create_table,
    create_td:create_td,
    create_th:create_th,
    creat_tr:create_tr,
    create_ul:create_ul
}