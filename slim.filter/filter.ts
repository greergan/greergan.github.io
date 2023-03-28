import * as slim from "./slim_modules.ts";
export class SlimFilter {
	predicate:string;
	property:string;
	value:any;
	filterLeft?:SlimFilter;
	filterRight?:SlimFilter;
	current_new_model:'right'|'left'|'main' = 'main';
	new_model_index:Array<number> = [];
	constructor(predicate:string, property:string, value:string) {
		this.predicate = predicate;
		this.property = property;
		this.value = value;
		console.trace();
	}
	is_complex():boolean {
		return (this.filterLeft != undefined && this.filterRight != undefined) ? true : false;
	}
}

/*
export function get_handler(handler_string:string):SlimFilter {
	console.debug({message:"entry"}, handler_string);
	const handler:SlimFilter = new SlimFilter();
	const complex_match:Array<string> = handler_string.match(/^(and|or)\((.+)\)/i) || [];
	if(complex_match.length == 3) {
		//new debug({message:"complex array"}, complex_match)
		handler.handler = complex_match[1];
		const left_right_match = complex_match[2].match(/[a-z_]+\([a-z0-9- ]+,[a-z0-9'" ]+\)/gi) || [];
console.debug({message: "left_right_match"}, left_right_match);
		if(left_right_match.length == 2) {
			handler.left = get_handler(left_right_match[0])
			handler.left.current_new_model = 'left';
			handler.right = get_handler(left_right_match[1]);
			handler.right.current_new_model = 'right';
		}
	}
	else{
		let handler_array:Array<string> = handler_string.match(/([a-z]+)\(\s*([a-z0-9-]+)\s*,\s*(.+?)\s*\)/i) || [];
		handler.handler = handler_array[1];
		handler.property = handler_array[2];
		let tick_array:Array<string> = handler_array[3].match(/^'(.+)'$/) || [];
		SlimConsole.todo({message:"need to continue working on proper quote and double quote handling in string matches"})
		handler.value = (tick_array.length == 2) ? tick_array[1]: handler_array[3];
	}
	return handler;
}
*/
/*
export function parse_handlers(handler_string:string):Array<SlimFilter> {
	console.trace({message:'entry', value: "/" + handler_string + "/"});
	let handlers:Array<SlimFilter> = [];
		
	let handler_array:Array<string> = handler_string.match(/[a-z]+\(.+\)/ig) || [];
	console.debug({message:"handler_array", value:handler_array});
	const handler:SlimFilter = get_handler(handler_array[0])
	if(handler.is_valid()) {
		handlers.push(handler);
	}
	else if(handler.is_complex()) {
		console.debug({message:"handler.is_complex()"})
	}
	console.trace();
	return handlers;
}
*/