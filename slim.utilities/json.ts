import * as slim from "./slim_modules.ts";
declare interface comingle_options {
	skip?:string[],
	excludes?:string[]
	depth?:number
}
export function copy_ofSync(source:slim.types.iKeyValueAny, options?:comingle_options) : slim.types.iKeyValueAny {
	if(window.hasOwnProperty('SlimConsole') && SlimConsole.hasOwnProperty('trace')) console.trace();
	return comingleSync([{}, source], options);
}
declare interface localized_comingle_options {
	skip:string[],
	excludes:string[],
	depth:number
}
export function comingleSync(input_sources:slim.types.iKeyValueAny[], options?:comingle_options): slim.types.iKeyValueAny {
	if(window.hasOwnProperty('SlimConsole')) console.debug({message:"begining with",value:"options"}, options);
	const localized_options:localized_comingle_options = (options) ? JSON.parse(JSON.stringify(options)) : {depth:1};
	if(!localized_options.hasOwnProperty('depth')) localized_options.depth = 1;
	['skip','excludes'].map(element => { if(!localized_options[element]) localized_options[element] = []});
	if(window.hasOwnProperty('SlimConsole')) console.debug({message:"begining with",value:"localized_options"}, localized_options);
	if(input_sources.length < 2) {
		if('SlimConsole' in window) SlimConsole.abort("comingle requires an array of 2 or more slim.types.iKeyValueAny objects");
		else throw new Error("comingle requires an array of 2 or more slim.types.iKeyValueAny objects");
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
					if(window.hasOwnProperty('SlimConsole')) console.debug({message:"options",value:"skip"}, key);
					continue_primitive_processing = false;
				}
				if(localized_options['excludes'].includes(key_type)) {
					if(window.hasOwnProperty('SlimConsole')) console.debug({message:"options",value:"excludes"}, key);
					continue_primitive_processing = false;
				}
				if(continue_primitive_processing) {
					merged_objects[key] = source[key];
				}
			}
			else if(Array.isArray(source[key])) {
				let continue_array_processing:boolean = true;
				if(window.hasOwnProperty('SlimConsole')) console.debug({message:"processing",value:"array"}, key);
				if(localized_options['skip'].includes(key)) {
					if(window.hasOwnProperty('SlimConsole')) console.debug({message:"options",value:"skip"}, key);
					continue_array_processing = false;
				}
				if(localized_options['excludes']!.includes('array')) {
					if(window.hasOwnProperty('SlimConsole')) console.debug({message:"options",value:"excludes"}, key);
					continue_array_processing = false;
				}
				if(continue_array_processing) {
					if(typeof merged_objects[key] == 'undefined') {
						merged_objects[key] = [];
					}
				}
				if(continue_array_processing) {
					if(window.hasOwnProperty('SlimConsole')) console.debug({message:"continue_array_processing",value:"key"}, key, Array.isArray(merged_objects[key]), merged_objects[key]);
 					for(const member of source[key]) {
						if(window.hasOwnProperty('SlimConsole')) console.debug({message:"member of",value:"source[key]"}, member);
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
				if(window.hasOwnProperty('SlimConsole')) console.debug({message:"processing",value:"object"}, key);
				if(localized_options['skip'].includes(key)) {
					if(window.hasOwnProperty('SlimConsole')) console.debug({message:"options",value:"skip"}, key);
					continue_object_processing = false;
				}
				if(localized_options['excludes'].includes(key_type)) {
					if(window.hasOwnProperty('SlimConsole')) console.debug({message:"options",value:"excludes"}, key);
					continue_object_processing = false;
				}
				if(continue_object_processing) {
					if(typeof merged_objects[key] == 'undefined') {
						merged_objects[key] = {};
					}
					if(window.hasOwnProperty('SlimConsole')) console.debug({message:"next level",value:"calling comingleSync"} );
					merged_objects[key] = comingleSync([merged_objects[key], source[key]], {depth: localized_options.depth++});
				}
			}
		}
	}
	if(window.hasOwnProperty('SlimConsole')) console.trace({message:"depth", value:localized_options.depth});
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
	if(window.hasOwnProperty('SlimConsole')) console.trace();
	return node_value;
}
export function get_value<Type, Key extends keyof Type>(obj: Type, key: Key) {
	if(window.hasOwnProperty('SlimConsole')) console.trace(key);
    return obj[key];
}