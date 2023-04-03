import * as slim from "./slim_modules.ts";
export interface FilterArguments {
	filter_string:string;
	model_string?:string;
}
export class SlimFilter {
	private predicate:string|undefined;
	private property:string|undefined;
	private value:string|number|boolean|undefined;
	private model:string|undefined;
	private model_index:number|undefined;
	private filters:Array<SlimFilter> = [];
	private view_models:Array<slim.types.iKeyValueAny> = [];
	constructor(filterArguments:FilterArguments) {
		console.trace({message:"Creating new SlimFilter",value:"with"}, filterArguments);
		this.model = filterArguments.model_string;
		this.parseFilterString(filterArguments.filter_string);
	}
	private getOperator(predicate:string):string {
		let operator:string = "";
		switch(predicate) {
			case 'and': operator = "&&"; break;
			case 'or': operator = "||"; break;
			case 'equal': operator = "=="; break;
			case 'not_equal': operator = "!="; break;
			case 'greater_than': operator = ">"; break;
			case 'greater_than_equal': operator = ">="; break;
			case 'not_greater_than': operator = "!>"; break;
			case 'less_than': operator = "<"; break;
			case 'less_than_equal': operator = "<="; break;
			case 'not_less_than': operator = "!<"; break;
		}
		if(window.hasOwnProperty('SlimConsole')) console.trace({message:"operator"}, operator);
		return operator;
	}
	public getViewModels():Array<slim.types.iKeyValueAny> {
		if(window.hasOwnProperty('SlimConsole')) console.trace();
		return this.view_models;
	}
	private parseFilterString(filter_string:string):void {
		if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"filter_string"}, filter_string);
		const andor_match:Array<string> = filter_string.match(/^(and|or)\((.+)\)/i) ?? [];
		if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"is complex filter.length"}, andor_match.length);
		if(andor_match.length == 3) {
			if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"is complex filter"}, andor_match[1]);
			if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"is complex filter"}, andor_match[2]);
			this.predicate = andor_match[1];
			const filter_matches = andor_match[2].match(/([\w_]+\([\w\d, "']+\))/g) ?? [];
			if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"filter_matches"}, filter_matches);
			filter_matches.forEach((filter_string)=> this.filters.push(new SlimFilter({filter_string:filter_string})));
		}
		else {
			if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"is simple filter"}, filter_string);
			const property_value_match = filter_string.match(/^([^(][\w_]+)\((.+)\)\s*$/) ?? [];
			if(property_value_match.length == 3) {
				if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"property_value_match[1]"}, property_value_match[1]);
				if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"property_value_match[2]"}, property_value_match[2]);
				this.predicate = property_value_match[1];
				this.property = property_value_match[2].substring(0, property_value_match[2].indexOf(',')).trim();
				this.value = property_value_match[2].substring(property_value_match[2].indexOf(',') + 1).trim();
				if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"predicate match"}, this.predicate);
				if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"property match"}, this.property);
				if(window.hasOwnProperty('SlimConsole')) console.debug({message:"filter_string",value:"value match"}, this.value);
			}
		}
		if(window.hasOwnProperty('SlimConsole')) console.trace({message:"parsed",value:"string into filters"});
	}
	public async run(model:slim.types.iKeyValueAny):Promise<void> {
		if(window.hasOwnProperty('SlimConsole')) console.debug({message:"beginning filter run for",value:"predicate, model"}, this.predicate, this.model);
		const comparissons:string = this.toString();
		model[this.model].forEach((obj:object) => { if(eval(comparissons)) this.view_models.push(obj); });
		if(window.hasOwnProperty('SlimConsole')) console.trace({message:"ended filter run with",value:"this.view_models.length"}, this.view_models.length);
	}
	public toString():string {
		let operations_string = "";
		const isAndOr = (filter:SlimFilter):boolean => filter.predicate == 'and' || filter.predicate == 'or';
		if(isAndOr(this)) {
			operations_string += "(";
			this.filters.forEach((filter, index) => {
				if(isAndOr(filter)) {
					operations_string.toString();
				}
				else {
					operations_string += `obj.${filter.property} ${this.getOperator(filter.predicate!)} ${filter.value}`;
				}
				if(this.filters.length -1 > index) {
					operations_string += ` ${this.getOperator(this.predicate!)} `;
				}
			});
			operations_string += ")"; 
		}
		else {
			operations_string += `obj.${this.property} ${this.getOperator(this.predicate!)} ${this.value}`;
		}
		if(window.hasOwnProperty('SlimConsole')) console.trace({message:"created",value:"filter statement"}, operations_string);
		return operations_string;
	}
}
