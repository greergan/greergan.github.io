import * as slim from "./slim_modules.ts";
export class SlimView {
	private namespace:string = "";
	private rawViews:Map<string, string> = new Map<string, string>();
	private compiledViews:Map<string, string> = new Map<string, string>();
	private withViewDependencies:Map<string, Array<string>> = new Map<string, Array<string>>();
	constructor(namespace:string) {
		if(slim.utilities.is_valid_url(namespace)) {
			this.namespace = namespace;
		}
		else {
			if(window.hasOwnProperty('SlimConsole')) SlimConsole.abort({message:"namespace", value:"not a valid URL"});
			else throw new Error("namspace must be a valid URL string");
		}
		console.trace({message:"namespace",value:this.namespace});
	}
	private async coalesce(model:slim.types.iKeyValueAny, compiled_view:string):Promise<string> {
		let coalesce_view = compiled_view;
		// comments
		// statements
		// variable replacements
		coalesce_view = coalesce_view.replace(/{#\s*({{.+}})\s*#}/gm, (match, data) => {
			const replacement_string:string = "<!-- " + data + " -->";
			console.debug({message:"variable comment replacements with substitution",value:"capture group"}, match);
			console.debug({message:"variable comment replacements with substitution",value:"replaced with"}, replacement_string);
			return replacement_string;
		});
		coalesce_view = coalesce_view.replace(/({#{.+}#})/gm, (match, data) => {
			const replacement_string:string = "<!-- " + data + " -->";
			console.debug({message:"variable comment replacements without substitution",value:"capture group"}, match);
			console.debug({message:"variable comment replacements without substitution",value:"replaced with"}, replacement_string);
			return replacement_string;
		});
		coalesce_view = coalesce_view.replace(/{#\s*({%.+%})\s*#}/gm, (match, data) => {
			const replacement_string:string = "<!-- " + data + " -->";
			console.debug({message:"comment replacements with substitution",value:"capture group"}, match);
			console.debug({message:"comment replacements with substitution",value:"replaced with"}, replacement_string);
			return replacement_string;
		});
		coalesce_view = coalesce_view.replace(/{#%\s*.+\s*%#}/gm, (match) => {
			const replacement_string:string = "<!-- " + match + " -->";
			console.debug({message:"comment replacements without substitution",value:"capture group"}, match);
			console.debug({message:"comment replacements without substitution",value:"replaced with"}, replacement_string);
			return replacement_string;
		});
		const statement_expanssion_regex = /{%\s*(.+\s*.*)\s*%}/gm;
		const statement_expanssion_promises:Array<Promise<string>> = [];
		const merge_statement = (statement_string:string) => Promise.resolve(this.parseStatement(model, statement_string));
	 	coalesce_view = coalesce_view.replace(statement_expanssion_regex, (match, statement):string => {
			statement_expanssion_promises.push(merge_statement(statement));
			return match;
		});
		await Promise.all(statement_expanssion_promises).then(
			(statement_values) => coalesce_view = 
			coalesce_view.replace(statement_expanssion_regex, (match, statement_string) => {
				const replacement_string:string = statement_values.shift() ?? "";
				console.debug({message:"statement expanssion",value:"capture group"}, match);
				console.debug({message:"statement expanssion",value:"replaced with"}, replacement_string);
				return replacement_string;
		}));
		const variable_expanssion_regex = /\{\{([^}]+?)\}\}/gm;
		const variable_expanssion_promises:Array<Promise<string>> = [];
		const fetch_value:any = (property_string:string) => Promise.resolve(slim.utilities.get_node_value(model, property_string));
		coalesce_view = coalesce_view.replace(variable_expanssion_regex, (match, property_string):string => {
			variable_expanssion_promises.push(fetch_value(property_string));
			return match;
		});
		await Promise.all(variable_expanssion_promises).then(
			(property_values) => coalesce_view = 
			coalesce_view.replace(variable_expanssion_regex, (match, property_string) => {
				const replacement_string:string = property_values.shift() ?? "";
				console.debug({message:"variable expanssion",value:"capture group"}, match);
				console.debug({message:"variable expanssion",value:"replaced with"}, replacement_string);
				return replacement_string;
		}));
		console.trace({message:"coalesced", value:"file size"}, coalesce_view.length);
		return coalesce_view;
	}
	public async compile(url:string):Promise<string> {
		const normalized_url:string = slim.utilities.is_valid_url(url) ? url : `${this.namespace}/${url}`;
		console.debug({message:"beginning",value:"with view_file"}, normalized_url);
		if(this.compiledViews.has(normalized_url)) {
			const compiled_view:string = this.compiledViews.get(normalized_url) ?? "";
			console.trace({message:"returned",value:"pre-compiled view, length"}, compiled_view.length, normalized_url);
			return compiled_view;
		}
		if(!this.rawViews.has(normalized_url)) {
			console.trace({message:"fetching",value:"template file"}, normalized_url);
			const file_contents:string = await(await slim.utilities.get_file_contents(normalized_url)) as string;
			this.rawViews.set(normalized_url, file_contents);
		}
		let view_string = this.rawViews.get(normalized_url)!;
		const include_regex =/<\s*include\s+view\s*=\s*"\s*([a-z0-9-_/?&=.]+?)\s*"\s*\/?\s*>/gmi;
		const fetch_file = (file:string) => Promise.resolve(this.compile(file));
		const promises:Array<Promise<string>> = [];
		view_string.replace(include_regex, ($0:string, url:string): string => {
			const url_string:string = slim.utilities.is_valid_url(url) ? url : `${this.namespace}/${url}`;
			promises.push(fetch_file(url_string));
			return $0;
		});
		await Promise.all(promises).then((results) => view_string = view_string.replace(include_regex, () => results.shift() ?? ""));
		this.compiledViews.set(normalized_url, view_string);
		console.trace({message:"compiled",value:"view_string length"}, view_string.length, normalized_url);
		return view_string;
	}
	public async recompile(url:string):Promise<void> {
		const normalized_url:string = slim.utilities.is_valid_url(url) ? url : `${this.namespace}/${url}`;
		if(this.rawViews.has(normalized_url)) {
			this.rawViews.delete(normalized_url);
		}
		if(this.compiledViews.has(normalized_url)) {
			this.compiledViews.delete(normalized_url);
		}
		await this.compile(normalized_url);
		if(this.withViewDependencies.has(normalized_url)) {
			const dependencies = this.withViewDependencies.get(normalized_url) ?? [];
			for(const dependency in dependencies) {
				await this.recompile(dependency);
			}
		}
		console.trace();
	}
	public async render(model:slim.types.iKeyValueAny, url:string):Promise<string> {
		const normalized_url:string = slim.utilities.is_valid_url(url) ? url : `${this.namespace}/${url}`;
		const rendered_view:string = await this.coalesce(model, await this.compile(normalized_url));
		console.trace({message:"rendered", value:"view"}, rendered_view.length, normalized_url);
		return rendered_view;
	}
	private async add_dependent_view(with_view:string, view:string):Promise<void> {
		let dependant_views:Array<string> = this.withViewDependencies.get(with_view) ?? [];
		if(!dependant_views.indexOf(view)) {
			dependant_views.push(view);
		}
		this.withViewDependencies.set(with_view, dependant_views);
		console.trace();
	}
	private async parseStatement(model:slim.types.iKeyValueAny, statement:string):Promise<string> {
		console.debug({message:"beginning",value:"statement"}, statement);
		const statement_match:Array<any> = statement.match(/^with|foreach\s*/i) || [];
		const statement_type:string = (String(statement_match[0]).toLowerCase()).trim();
		let coalesced_view:string = "";
		switch(statement_type) {
			case 'foreach':
				const foreach_match:Array<string> = statement.match(/^foreach\s+model\s*=\s*"\s*(.+?)\s*"\s+view\s*=\s*"(.+?)"/) ?? [];
				console.debug({message:"foreach statement",value:"processing match results"}, foreach_match);
				if(foreach_match.length == 3) {
					const process_data = {
						"model_string": foreach_match[1],
						"view_string": await (async function(parentClass) {
							const input_view_file = slim.utilities.is_valid_url(foreach_match[2]) ? foreach_match[2] : `${parentClass.namespace}/${foreach_match[2]}`;
							console.debug({message:"foreach statement",value:"view file"}, input_view_file);
							return await parentClass.compile(input_view_file);
						})(this)
					};
					console.debug({message:"calling processMatch",value:"with process_data"}, process_data);
					coalesced_view = await this.processMatch(model, process_data);
				}
				else {
					const foreach_match = statement.match(/^foreach\s+model\s*=\s*"\s*(.+?)\s*"\s*(.+)\s*/m) ?? [];
					if(foreach_match.length == 3) {
						const process_data = {
							"model_string": foreach_match[1],
							"view_string": foreach_match[2]
						};
						console.debug({message:"calling processMatch",value:"with process_data"}, process_data);
						coalesced_view = await this.processMatch(model, process_data);
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
				const with_match:Array<string> = statement.match(/^with\s+model\s*=\s*"\s*(.+?)\s*"\s+view\s*=\s*"(.+?)"/) ?? [];
				   if(with_match.length == 3) {
					const process_data = {
						"model_string": with_match[1],
						"view_string": await (async function(parentClass) {
							//const input_view_file = (with_match[2].match('http|https|file:\/\/\/')) ? with_match[2] : `${namespace}/${with_match[2]}`;
							const input_view_file = slim.utilities.is_valid_url(with_match[2]) ? with_match[2] : `${parentClass.namespace}/${with_match[2]}`;
							console.debug({message:"with statement",value:"view file"}, input_view_file);
							return await parentClass.compile(input_view_file);
						})(this)
					};
					coalesced_view = await this.processMatch(model, process_data);
				}
				else {
					const with_match = statement.match(/^with\s+model\s*=\s*"\s*(.+?)\s*"(.+)/) ?? [];
					if(with_match.length == 3) {
						const process_data = {
							"model_string": with_match[1],
							"view_string": with_match[2]
						};
						coalesced_view = await this.processMatch(model, process_data);
					}
				}
				break;
		}
		console.trace({message:"statement",value:"parsed length"},coalesced_view.length);
		return coalesced_view;
	}
	private async processMatch(model:slim.types.iKeyValueAny, statement_data:slim.types.iKeyValueAny): Promise<string> {
		console.debug({message:"beginning",value:"with statement_data.model_string"}, statement_data.model_string);
		console.debug({message:"beginning",value:"with statement_data.view_string"}, statement_data.view_string);
		let coalesced_view = "";
		const model_match = statement_data.model_string.match(/^(.+?)\[(\d+)\]/);
		let view_models:Array<slim.types.iKeyValueAny> = [];
		if(model_match?.length == 3) {
			view_models.push(model[model_match[1]][model_match[2]]);
		}
		else {
			view_models = model[statement_data.model_string];
		}
		console.debug({message:"processing",value:"view_models"}, view_models);
		for await(const property_model of view_models) {
			coalesced_view += await this.coalesce(property_model, statement_data.view_string);
		}
		console.trace();
		return coalesced_view;
	}
}