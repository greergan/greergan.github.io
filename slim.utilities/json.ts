import * as slim from "./slim_modules.ts";
export function copy_ofSync(source:slim.types.iKeyValueAny, options?:slim.types.iKeyValueAny) : slim.types.iKeyValueAny {
	console.trace();
	return comingleSync([{}, source], options);
}
export function comingleSync(input_sources:slim.types.iKeyValueAny[], options?:{skip?:string[],excludes?:string[],depth?:number,current_depth?:number}): slim.types.iKeyValueAny {
	console.debug({message:"beginning",value:"options"}, options);
	if(input_sources.length < 2) {
		if('SlimConsole' in window) SlimConsole.abort("comingle requires an array of 2 or more slim.types.iKeyValueAny objects");
		else throw new Error("comingle requires an array of 2 or more slim.types.iKeyValueAny objects");
	}
	const sources:slim.types.iKeyValueAny[] = JSON.parse(JSON.stringify(input_sources));
	const merged_objects:slim.types.iKeyValueAny = sources.shift() || {};
	for(const key in merged_objects) {
		if(typeof options == 'object') {
			console.debug({message:"options",value:"is object"}, key, options);
			if('skip' in options && options['skip']!.includes(key)) {
				console.debug({message:"options",value:"skip"}, key);
				delete merged_objects[key];
			}
			if('excludes' in options && options['excludes']!.includes(typeof key)) {
				console.debug({message:"options",value:"exclude"}, typeof key);
				delete merged_objects[key];
			}
		}
	}
	for(let source of sources) {
		for(const key in source) {
			const key_type:string = typeof source[key];
			if(['string','number','boolean'].includes(key_type)) {
				let continue_primitive_processing = true;
				console.debug({message:"options",value:"is object"}, key);
				if('skip' in options! && options['skip']!.includes(key)) {
					console.debug({message:"options",value:"skip"}, key);
					continue_primitive_processing = false;
				}
				if('excludes' in options! && options['excludes']!.includes('key_type')) {
					console.debug({message:"options",value:"excludes"}, key);
					continue_primitive_processing = false;
				}
				if(continue_primitive_processing) {
					merged_objects[key] = source[key];
				}
			}
			else if(Array.isArray(source[key])) {
				console.debug({message:"is array",value:"key"}, key);
				let continue_array_processing:boolean = true;
				if('skip' in options! && options['skip']!.includes(key)) {
					console.debug({message:"options",value:"skip"}, key);
					continue_array_processing = false;
				}
				if('excludes' in options! && options['excludes']!.includes('array')) {
					console.debug({message:"options",value:"excludes"}, key);
					continue_array_processing = false;
				}
				if(continue_array_processing && 'depth' in options! && options['depth'] == 0) {
					console.debug({message:"setting",value:"[Array] for"}, key)
					merged_objects[key] = "[Array]";
					continue_array_processing = false;
				}
				if(continue_array_processing && typeof merged_objects[key] === 'undefined') {
					console.debug({message:"assigned",value:"source key to merged_objects"}, key);
					merged_objects[key] = source[key];
				}
				if(continue_array_processing) {
					console.debug({message:"continue_array_processing",value:"key"}, key);
					if(continue_array_processing) {
						for(const member of source[key]) {
							console.debug({message:"array",value:"key"}, key);
							console.debug({message:"member of",value:"key"}, member);
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
					// merged_objects[key] = comingleSync([merged_objects[key], source[key]], options);
				}
			}
			else if(key_type === 'object') {
				console.debug({message:"is object",value:"key"}, key);
				let continue_object_processing = true;
				if('skip' in options! && options['skip']!.includes(key)) {
					console.debug({message:"options",value:"skip"}, key);
					continue_object_processing = false;
				}
				if('excludes' in options! && options['excludes']!.includes(key_type)) {
					console.debug({message:"options",value:"excludes"}, key);
					continue_object_processing = false;
				}
				if(continue_object_processing && 'depth' in options! && options['depth'] == 0) {
					console.debug({message:"setting",value:"[Object] for"}, key)
					merged_objects[key] = "[Object]";
					continue_object_processing = false;
				}
				if(continue_object_processing) {
					console.debug({message:"continue_object_processing"});
					if(typeof merged_objects[key] == 'undefined') {
						merged_objects[key] = {};
					}
					merged_objects[key] = comingleSync([merged_objects[key], source[key]], options);
				}
			}
		}
	}
	console.trace();
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
	console.trace();
	return node_value;
}
export function get_value<Type, Key extends keyof Type>(obj: Type, key: Key) {
	console.trace(key);
    return obj[key];
}