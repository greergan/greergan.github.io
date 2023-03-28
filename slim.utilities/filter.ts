import * as slim from "./slim_modules.ts";
import * as filter from "http://192.168.122.59/slim.filter/index.ts";
export async function filter(model:Array<slim.types.iKeyValueAny>, filter:filter.SlimFilter):Promise<Array<slim.types.iKeyValueAny>> {
    let new_model:slim.types.iKeyValueAny = [];
    switch(filter.predicate.toLowerCase()) {
        case 'equal':
            return model.filter((member:slim.types.iKeyValueAny, index:number) => {
                let value:string|number|boolean = "";
                switch(typeof member[filter.property]) {
                    case 'boolean':
                    case 'number':
                        value = JSON.parse(filter.value.toLowerCase());
                        break;
                    case 'string':
                        value = filter.value;
                        break;
                }
                if(member[filter.property] == value) {
                    filter.new_model_index.push(index);
                    return member;
                }
            }).sort((a, b) => a.first_name.toLowerCase() > b.first_name.toLowerCase() ? 1 : -1);
            break;
        case 'not_equal':
            new_model = model.filter((member:slim.types.iKeyValueAny, index:number) => {
                let value:string|number|boolean = "";
                switch(typeof member[filter.property]) {
                    case 'boolean':
                    case 'number':
                        value = JSON.parse(filter.value.toLowerCase());
                        break;
                    case 'string':
                        value = filter.value;
                        break;
                }
                if(member[filter.property] != value) {
                    filter.new_model_index.push(index);
                    return member;
                }
            });
            break;
        case 'greater_than':
            new_model = model.filter((member:slim.types.iKeyValueAny, index:number) => {
                if(member[filter.property] > filter.value) {
                    filter.new_model_index.push(index);
                    return member;
                }
            });
            break;
        case 'greater_than_equal':
            new_model = model.filter((member:slim.types.iKeyValueAny, index:number) => {
                if(member[filter.property] >= filter.value) {
                    filter.new_model_index.push(index);
                    return member;
                }
            });
            break;
        case 'less_than':
            new_model = model.filter((member:slim.types.iKeyValueAny, index:number) => {
                if(member[filter.property] < filter.value) {
                    filter.new_model_index.push(index);
                    return member;
                }
            });
            break;
        case 'less_than_equal':
            new_model = model.filter((member:slim.types.iKeyValueAny, index:number) => {
                if(member[filter.property] <= filter.value) {
                    filter.new_model_index.push(index);
                    return member;
                }
            });
            break;
/* 			case 'and':
            (filter.left != undefined) ? do_handler(model, filter.left) : [];
            (filter.right != undefined) ? do_handler(model, filter.right) : [];
            if(filter.left?.new_model_index != undefined && filter.right?.new_model_index != undefined) {
                filter.left.new_model_index = filter.left?.new_model_index.sort();
                filter.right.new_model_index = filter.right?.new_model_index.sort();
                if(filter.left?.new_model_index == filter.right?.new_model_index) {
                    for(let index of filter.left?.new_model_index) {
                        new_model.push(model[index]);
                    }
                }
            }
            else {
                console.error({message: "one or both handlers are undefined"}, filter.left, filter.right)
            }
        case 'or':
            (filter.left != undefined) ? do_handler(model, filter.left) : [];
            (filter.right != undefined) ? do_handler(model, filter.right) : [];
            if(filter.left?.new_model_index != undefined && filter.right?.new_model_index != undefined) {
                filter.new_model_index = [...new Set([...filter.left?.new_model_index,...filter.right?.new_model_index])].sort();
                for(let index of filter.new_model_index) {
                    new_model.push(model[index]);
                }
            }
            else {
                console.error({message: "one or both handlers are undefined"}, filter.left, filter.right)
            }
            break; */
        default:
            console.warn({message:"filter.handler", value:"not supported"}, filter.handler);
            break;
    }
    console.trace();
    return new_model;
}