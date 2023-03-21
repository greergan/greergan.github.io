import * as slim from "./slim_modules.ts";

export function copy_ofSync(source:slim.types.iKeyValueAny, options?:slim.types.iKeyValueAny) : slim.types.iKeyValueAny {
	return comingleSync([{}, source], options);
}

export function comingleSync(input_sources:slim.types.iKeyValueAny[], options?:slim.types.iKeyValueAny): slim.types.iKeyValueAny {
	if(input_sources.length < 2) {
		throw new Error("comingle requires an array of 2 or more slim.types.iKeyValueAny objects");
	}
	const sources:slim.types.iKeyValueAny[] = JSON.parse(JSON.stringify(input_sources));
	const merged_objects:slim.types.iKeyValueAny = sources.shift() || {};
	for(const key in merged_objects) {
		if(typeof options == 'object') {
			if(Array.isArray(options['skip']) && options['skip'].includes(key)) {
				delete merged_objects[key];
			}
			if(Array.isArray(options['excludes']) && options['excludes'].includes(typeof key)) {
				delete merged_objects[key];
			}
		}
	}
	for(let source of sources) {
		for(const key in source) {
			if(typeof source[key] == 'string' || typeof source[key] == 'number' || typeof source[key] == 'boolean') {
				let continue_comingle = true;
				if(typeof options == 'object') {
					if(Array.isArray(options['skip']) && options['skip'].includes(key)) {
						continue_comingle = false;
					}
				}
				if(continue_comingle) {
					merged_objects[key] = source[key];
				}
			}
			else if(Array.isArray(source[key])) {
				if(typeof merged_objects[key] == 'undefined') {
					merged_objects[key] = source[key];
				}
				else if(Array.isArray(merged_objects[key])) {
					for(const member of source[key]) {
						let lvalue_exists:boolean = false;
						for(const index in merged_objects[key]) {
							if(merged_objects[key][index] == member) {
								lvalue_exists = true;
								merged_objects[key][index] == member;
							}
						}
						if(!lvalue_exists) {
							merged_objects[key].push(member);
						}
					}
				}
			}
			else if(typeof source[key] == 'object') {
				let continue_comingle = true;
				if(typeof options == 'object') {
					if((Array.isArray(options['skip']) && options['skip'].includes(key)) || (Array.isArray(options['excludes']) && options['excludes'].includes('object'))) {
						continue_comingle = false;
					}
					else if(Number.isInteger(options['depth'])) {
						if(options['depth'] == 1) {
							merged_objects[key] = "[object]";
							continue_comingle = false;
						}
						else {
							if(options['depth'] > 0) {
								--options['depth'];
							}
						}
					}
				}
				if(continue_comingle) {
					if(typeof merged_objects[key] == 'undefined') {
						merged_objects[key] = {};
					}
					merged_objects[key] = comingleSync([merged_objects[key], source[key]], options);
				}
			}
		}
	}
	return merged_objects;
}
export async function get_node_value(model:slim.types.iKeyValueAny, property:string): Promise<string | slim.types.iKeyValueAny | undefined> {
	const node_array:Array<any> = property.trim().split('.');
	let node_value:any = undefined;
	let next_property_string:string = "";
	for await (const node of node_array) {
		next_property_string = property.substring(property.indexOf('.') + 1);
		node_value = model[`${node}`];
 		if(typeof node_value === 'object') {
			if(next_property_string.length == 0) {
				break;
			}
			else {
				node_value = await get_node_value(model[`${node}`], next_property_string);
			}
		}
		if(property.endsWith(next_property_string)) {
			break;
		}
	}
	return node_value;
}
export function get_value<Type, Key extends keyof Type>(obj: Type, key: Key) {
    return obj[key];
}