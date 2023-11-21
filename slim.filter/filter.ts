import * as slim from "./slim_modules.ts";
export interface FilterArguments {
	filter_string:string;
	model_string?:string;
}
export class SlimFilter {
	private operator:string|undefined;
	private property:string|undefined;
	private value:string|number|boolean|undefined;
	private model_name:string|undefined;
	private filters:Array<SlimFilter> = [];
	private view_models:Array<slim.types.iKeyValueAny> = [];
	constructor(filterArguments:FilterArguments) {
		console.trace({message:"Creating new SlimFilter",value:"with"}, filterArguments);
		this.model_name = filterArguments.model_string;
		this.parseFilterString(filterArguments.filter_string);
	}
	private getOperator(operator:string):string {
		let operator_string:string = "";
		switch(operator) {
			case 'and': operator_string = "&&"; break;
			case 'or': operator_string = "||"; break;
			case 'equal': operator_string = "=="; break;
			case 'not_equal': operator_string = "!="; break;
			case 'greater_than': operator_string = ">"; break;
			case 'greater_than_equal': operator_string = ">="; break;
			case 'not_greater_than': operator_string = "!>"; break;
			case 'less_than': operator_string = "<"; break;
			case 'less_than_equal': operator_string = "<="; break;
			case 'not_less_than': operator_string = "!<"; break;
		}
		console.trace({message:"operator"}, operator_string);
		return operator_string;
	}
	public getViewModels():Array<slim.types.iKeyValueAny> {
		console.trace();
		return this.view_models;
	}
	private parseFilterString(filter_string:string):void {
		console.debug({message:"filter_string",value:"filter_string"}, filter_string);
		const andor_match:Array<string> = filter_string.match(/^(and|or)\((.+)\)/i) ?? [];
		console.debug({message:"filter_string",value:"is complex filter.length"}, andor_match.length);
		if(andor_match.length == 3) {
			console.debug({message:"filter_string",value:"is complex filter"}, andor_match[1]);
			console.debug({message:"filter_string",value:"is complex filter"}, andor_match[2]);
			this.operator = andor_match[1];
			const filter_matches = andor_match[2].match(/([\w_]+\([\w\d, "']+\))/g) ?? [];
			console.debug({message:"filter_string",value:"filter_matches"}, filter_matches);
			filter_matches.forEach((filter_string)=> this.filters.push(new SlimFilter({filter_string:filter_string})));
		}
		else {
			console.debug({message:"filter_string",value:"is simple filter"}, filter_string);
			const property_value_match = filter_string.match(/^([^(][\w_]+)\((.+)\)\s*$/) ?? [];
			if(property_value_match.length == 3) {
				console.debug({message:"filter_string",value:"property_value_match[1]"}, property_value_match[1]);
				console.debug({message:"filter_string",value:"property_value_match[2]"}, property_value_match[2]);
				this.operator = property_value_match[1];
				this.property = property_value_match[2].substring(0, property_value_match[2].indexOf(',')).trim();
				this.value = property_value_match[2].substring(property_value_match[2].indexOf(',') + 1).trim();
				console.debug({message:"filter_string",value:"operator match"}, this.operator);
				console.debug({message:"filter_string",value:"property match"}, this.property);
				console.debug({message:"filter_string",value:"value match"}, this.value);
			}
		}
		console.trace({message:"parsed",value:"string into filters"});
	}
	public async run(model:slim.types.iKeyValueAny):Promise<void> {
		console.trace({message:"beginning filter run for",value:"operator, model_name, property"}, this.operator, this.model_name, this.property);
		const run_model:slim.types.iKeyValueAny[]|object|undefined = await slim.utilities.get_node_value(model, this.model_name);
		let run_model_array:object[] = [];
		if(typeof run_model == 'object') {
			run_model_array.push(run_model)
		}
		else if(Array.isArray(run_model)) {
			run_model_array = run_model;
		}
		else {
			return;
		}
		if(this.operator) {
			const comparissons:string = this.toString();
			console.debug({message:"checking",value:"comparissons"}, comparissons);
			run_model_array.forEach((obj:object) => { if(eval(comparissons)) this.view_models.push(obj); });
		}
		else {
			this.view_models = run_model_array;
		}
		console.trace({message:"ended filter run with",value:"this.view_models.length"}, this.view_models.length);
	}
	public toString():string {
		let operations_string = "";
		const isAndOr = (filter:SlimFilter):boolean => filter.operator == 'and' || filter.operator == 'or';
		if(isAndOr(this)) {
			operations_string += "(";
			this.filters.forEach((filter, index) => {
				if(isAndOr(filter)) {
					operations_string.toString();
				}
				else {
					operations_string += `obj.${filter.property} ${this.getOperator(filter.operator!)} ${filter.value}`;
				}
				if(this.filters.length -1 > index) {
					operations_string += ` ${this.getOperator(this.operator!)} `;
				}
			});
			operations_string += ")"; 
		}
		else {
			operations_string += `obj.${this.property} ${this.getOperator(this.operator!)} ${this.value}`;
		}
		console.trace({message:"created",value:"filter statement"}, operations_string);
		return operations_string;
	}
}
