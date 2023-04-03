import * as slim from "./slim_modules.ts";


export function array_contains(a:slim.types.iKeyValueAny, b:object):boolean {
	let is_in:boolean = true;
	const b_keys:string[] = (Object.keys(b)).sort();
	const b_keys_string:string = JSON.stringify(b_keys);
	let keys_checked:number = 0;
	for(const member of a) {
		const a_keys:string[] = (Object.keys(member)).sort();
		if(JSON.stringify(a_keys) !== b_keys_string) {
			is_in = false;
			break;
		}
		let keys_matched:number = 0;
		for(const key of Object.keys(member)) {
			keys_checked++;
/*
			if(typeof member[key] === 'object' && typeof b[key] === 'object') {
				console.log("checking objects");
				if(Array.isArray(member[key]) && Array.isArray(b[key])) {
					console.log("checking arrays");
					if(member[key].every((value,index)=> {
						b[key][index].
						value === b[key][index];
						console.log(value)
					})) {
						keys_matched++;
					}					
				}
				else {
					if(array_contains([member[key]], b[key])) {
						keys_matched++;
						console.log("array_contains", key, b[key])
					}
				}
			}
*/
			if(member[key] == b[key]) {
				keys_matched++;
			}
		}
		if(keys_matched == a_keys.length) {
			is_in = true;
			break;
		}
	}
	return is_in;
}
declare interface comingle_options {
	skip?:string[],
	excludes?:string[]
	depth?:number
}
export function copy_ofSync(source:slim.types.iKeyValueAny, options?:comingle_options) : slim.types.iKeyValueAny {
	return comingleSync([{}, source], options);
}
declare interface localized_comingle_options {
	skip:string[],
	excludes:string[],
	depth:number
}
export function comingleSync(input_sources:slim.types.iKeyValueAny[], options?:comingle_options): slim.types.iKeyValueAny {
	const localized_options:localized_comingle_options = (options) ? JSON.parse(JSON.stringify(options)) : {depth:1};
	if(!localized_options.hasOwnProperty('depth')) localized_options.depth = 1;
	['skip','excludes'].map(element => { if(!localized_options[element]) localized_options[element] = []});
	if(input_sources.length < 2) {
		throw new Error("comingle requires an array of 2 or more slim.types.iKeyValueAny objects");
	}
	const sources:slim.types.iKeyValueAny[] = JSON.parse(JSON.stringify(input_sources));
	//const merged_objects:slim.types.iKeyValueAny = sources.shift() ?? {};
	const merged_objects:slim.types.iKeyValueAny = {};
	for(let source of sources) {
		for(const key in source) {
			const key_type:string = typeof source[key];
			if(['string','number','boolean'].includes(key_type)) {
				let continue_primitive_processing = true;
				if(localized_options['skip'].includes(key)) {
					continue_primitive_processing = false;
				}
				if(localized_options['excludes'].includes(key_type)) {
					continue_primitive_processing = false;
				}
				if(continue_primitive_processing) {
					merged_objects[key] = source[key];
				}
			}
			else if(Array.isArray(source[key])) {
				let continue_array_processing:boolean = true;
				if(localized_options['skip'].includes(key)) {
					continue_array_processing = false;
				}
				if(localized_options['excludes']!.includes('array')) {
					continue_array_processing = false;
				}
				if(continue_array_processing) {
					if(typeof merged_objects[key] == 'undefined') {
						merged_objects[key] = [];
					}
				}
				if(continue_array_processing) {
 					for(const member of source[key]) {
						let lvalue_exists:boolean = false;
						for(const index in merged_objects[key]) {
							if(merged_objects[key][index] == member) {
								lvalue_exists = true;
							}
						}
						if(!lvalue_exists) {
							merged_objects[key].push(member);
						}
					}
				}
			}
			else if(key_type === 'object') {
				let continue_object_processing = true;
				if(localized_options['skip'].includes(key)) {
					continue_object_processing = false;
				}
				if(localized_options['excludes'].includes(key_type)) {
					continue_object_processing = false;
				}
				if(continue_object_processing) {
					if(typeof merged_objects[key] == 'undefined') {
						merged_objects[key] = {};
					}
					merged_objects[key] = comingleSync([merged_objects[key], source[key]], {depth: localized_options.depth++});
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