import * as slim from "./slim_modules.ts";
export class SlimView {
	private namespace:string;
	private raw_views:Map<string, string> = new Map<string, string>();
	private compiled_views:Map<string, string> = new Map<string, string>();
	private with_view_dependencies:Map<string, Array<string>> = new Map<string, Array<string>>();
	constructor(namespace:string) {
		console.trace({message:"namespace",value:namespace});
		this.namespace = namespace;
	}
	async coalesce(model:slim.utilities.iKeyValueAny, compiled_view:string, compiler?:any):string {
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
		console.trace({message:"coalesced", value:"file size"}, merged_view.length);
		return merged_view;
	}
	async compile(view_file:string): Promise<string> {
		if(this.compiled_views.has(view_file)) {
			const compiled_view:string = this.compiled_views.get(view_file) ?? "";
			console.trace({message:"returned",value:"pre-compiled view, length"}, compiled_view.length, view_file);
			return compiled_view;
		}
		if(!this.raw_views.has(view_file)) {
			console.debug({message:"fetching",value:"template file"}, view_file);
			this.raw_views.set(view_file, await (await fetch(view_file)).text());
			const file_contents = await(await slim.utilities.get_file_contents(view_file));
			//this.raw_views.set(view_file, await(await slim.utilities.get_file_contents(view_file)));
		}
		let view_string = this.raw_views.get(view_file)!;
		const include_regex =/<\s*include\s+view\s*=\s*"\s*([a-z0-9-_/?&=.]+?)\s*"\s*\/?\s*>/gmi;
		const fetch_file = (file:string) => Promise.resolve(this.compile(file));
		const promises:Array<Promise<string>> = [];
		view_string.replace(include_regex, ($0:string, url:string): string => {
			const url_string:string = (url.match(/^https:\/\/|http:\/\/|file:\/\/\//i)) ? url : `${this.namespace}/${url}`;
			promises.push(fetch_file(url_string));
			return $0;
		});
		await Promise.all(promises).then((results) => view_string = view_string.replace(include_regex, () => results.shift() || ""));
		this.compiled_views.set(view_file, view_string);
		console.trace({message:"compiled",value:"view_string length"}, view_string.length, view_file);
		return view_string;
	}
	public async recompile(url:string) {
		const normalized_url:string = (url) ? url : this.namespace;
		if(this.raw_views.has(normalized_url)) {
			this.raw_views.delete(normalized_url);
		}
		if(this.compiled_views.has(normalized_url)) {
			this.compiled_views.delete(normalized_url);
		}
		this.compile(normalized_url);
		if(this.with_view_dependencies.has(normalized_url)) {
			const dependencies = this.with_view_dependencies.get(normalized_url) || [];
			for(const dependency in dependencies) {
				this.recompile(dependency);
			}
		}
		console.trace();
	}
	public async render(model:slim.types.iKeyValueAny, view_file:string): Promise<string> {
		const rendered_view:string = await this.coalesce(model, await this.compile(view_file), this);
		console.trace({message:"rendered", value:"view"}, rendered_view.length, view_file);
		return rendered_view;
	}
	private async add_dependent_view(with_view:string, view:string):Promise<void> {
		let dependant_views:Array<string> = this.with_view_dependencies.get(with_view) || [];
		if(!dependant_views.indexOf(view)) {
			dependant_views.push(view);
		}
		this.with_view_dependencies.set(with_view, dependant_views);
		console.trace();
	}
}