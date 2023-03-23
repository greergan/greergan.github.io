import * as slim from "./slim_modules.ts";
import { coalesce } from "./coalesce.ts";
export class SlimView {
	private namespace:string;
	private raw_views:Map<string, string> = new Map<string, string>();
	private compiled_views:Map<string, string> = new Map<string, string>();
	private with_view_dependencies:Map<string, Array<string>> = new Map<string, Array<string>>();
	constructor(namespace:string) {
		SlimConsole.trace({message:"namespace",value:namespace});
		console.info({message:"namespace",value:namespace});
		this.namespace = namespace;
	}
	async compile(view_file:string): Promise<string> {
		if(this.compiled_views.has(view_file)) {
			return this.compiled_views.get(view_file) || "";
		}
		if(!this.raw_views.has(view_file)) {
			try {
				this.raw_views.set(view_file, await (await fetch(view_file)).text());
			}
			catch(e) {
				new error(e, view_file);
			}
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
		SlimConsole.trace();
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
		SlimConsole.trace();
	}
	public async render(model:slim.types.iKeyValueAny, view_file:string): Promise<string> {
		//const compiled_view = await this.compile(view_file);
		//const coalesced_view = await coalesce(model, compiled_view, this);

		//new debug({message:"compiled_view"}, compiled_view)
		//new debug({message:"coalesced_view"}, coalesced_view)


		SlimConsole.trace();
		return await coalesce(model, await this.compile(view_file), this);
	}
	private add_dependent_view(with_view:string, view:string) {
		let dependant_views:Array<string> = this.with_view_dependencies.get(with_view) || [];
		if(!dependant_views.indexOf(view)) {
			dependant_views.push(view);
		}
		this.with_view_dependencies.set(with_view, dependant_views);
	}
}