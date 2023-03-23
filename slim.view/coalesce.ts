import * as slim from "./slim_modules.ts";
import { parse_statement } from "./parsers.ts";
export function coalesce(model:SlimTypes.KeyValueAny, compiled_view:string, compiler?:any):string {
	let merged_view = compiled_view;
	merged_view = merged_view.replace(/\{#.+?#\}/gm, ($0):string => {
		let replacement_string = $0.replace(/{{|{%/gm, "{#");
		replacement_string = replacement_string.replace(/%}|}}/gm, "#}")
		return "<!-- " + replacement_string + " -->";
	});
/* 	merged_view = merged_view.replace(/\{%[^%]+?%\}/gm, (statement):string => {
		return parse_statement(model, statement, compiler);
	}); */
	merged_view = merged_view.replace(/\{\{([^}]+?)\}\}/gm, ($1, property_string):string => {
		return slim.utilities.get_node_value(model, property_string);
	});
	return merged_view;
}