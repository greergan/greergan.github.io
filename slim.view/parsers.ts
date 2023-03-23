import * as slim from "./slim_modules.ts";
import { coalesce } from "./coalesce.ts";
import { SlimViewHandler, do_handler, parse_handlers } from "./handler.ts";
async function process_match(model:slim.types.iKeyValueAny, statement_data:slim.types.iKeyValueAny): Promise<string> {
	let coalesced_view = "";
	const model_match = statement_data.model_string.match(/^(.+?)\[(\d+)\]/);
	let view_models:Array<slim.types.iKeyValueAny> = [];
	if(model_match?.length == 3) {
		view_models.push(model[model_match[1]][model_match[2]]);
	}
	else {
		view_models = model[statement_data.model_string];
	}
	for await(const property_model of view_models) {
		coalesced_view += await coalesce(property_model, statement_data.view_string);
	}
	return coalesced_view;
}
export async function parse_statement(model:slim.types.iKeyValueAny, statement:string, compiler?:any): Promise<string> {
	statement = statement.trim();
 	const statement_match:Array<any> = statement.match(/^with|foreach\s*/i) || [];
	const statement_type:string = (String(statement_match[0]).toLowerCase()).trim();
	let coalesced_view:string = "";
	switch(statement_type) {
		case 'foreach':
			const foreach_match:Array<string> = statement.match(/^foreach\s+model\s*=\s*"\s*(.+?)\s*"\s+view\s*=\s*"(.+?)"/) || [];
			if(foreach_match.length == 3) {
				const process_data = {
					"model_string": foreach_match[1],
					"view_string": await (async function() {
						const input_view_file = (foreach_match[2].match('http|https|file:\/\/\/')) ? foreach_match[2] : `${compiler.namespace}/${foreach_match[2]}`;
						return await compiler.compile(input_view_file);
					})()
				};
				coalesced_view = await process_match(model, process_data);
			}
			else {
				const foreach_match = statement.match(/^foreach\s+model\s*=\s*"\s*(.+?)\s*"\s*(.+)\s*/m) || [];
				if(foreach_match.length == 3) {
					const process_data = {
						"model_string": foreach_match[1],
						"view_string": foreach_match[2]
					};
					coalesced_view = await process_match(model, process_data);
				}
			}
/*
			const for_match:Array<string> = statement.match(/^foreach\s+["]\s*([a-z0-9-]+)(.*)["](.+)/i) || [];
 			if(foreach_match.length == 4) {
 				let handler_array:Array<SlimViewHandler> = [];
				let node:Array<slim.types.iKeyValueAny> = model[for_match[1]];
				if(for_match[2]) {
					handler_array = parse_handlers(for_match[2].trim());
					//new debug({message:"value for handler_array"}, handler_array);
					if(handler_array[0] != undefined) {
						node = do_handler(node, handler_array[0]);
					}
				}
 				for(const member of node) {
					coalesced_view += coalesce(member, for_match[3], compiler);
				}*/
			break;
		case 'with':
			const with_match:Array<string> = statement.match(/^with\s+model\s*=\s*"\s*(.+?)\s*"\s+view\s*=\s*"(.+?)"/) || [];
   			if(with_match.length == 3) {
				const process_data = {
					"model_string": with_match[1],
					"view_string": await (async function() {
						const input_view_file = (with_match[2].match('http|https|file:\/\/\/')) ? with_match[2] : `${compiler.namespace}/${with_match[2]}`;
						return await compiler.compile(input_view_file);
					})()
				};
				coalesced_view = await process_match(model, process_data);
			}
			else {
				const with_match = statement.match(/^with\s+model\s*=\s*"\s*(.+?)\s*"(.+)/) || [];
				if(with_match.length == 3) {
					const process_data = {
						"model_string": with_match[1],
						"view_string": with_match[2]
					};
					coalesced_view = await process_match(model, process_data);
				}
			}
			break;
	}
	return coalesced_view;
}
