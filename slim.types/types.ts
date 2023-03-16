export interface iKeyValueAny {
	[key:string]: any;
}
export type iDictionary<K extends string | number | symbol, V> = {
	[key in K]: V;
}