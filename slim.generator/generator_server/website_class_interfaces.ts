import * as slim from "./slim_modules.ts";
export interface WebSite {
    configuration:WebSiteClassConfiguration
}
export interface WebSiteClass {
    new(configuration?:slim.types.iKeyValueAny): WebSite;
}
export interface WebSitePageExternalModule {
    path:string
}
export interface WebSitePage {
    generate_id:number,
    meta_tags:string[],
    input_file:string,
    output_file:string,
    title:string,
    models?:slim.types.iKeyValueAny[];
    external_models?:WebSitePageExternalModule[]
}
export interface WebSiteClassConfiguration {
    namspace:string
    output_to:string,
    generate_ids:number[],
    meta_tags:string[],
    models:slim.types.iKeyValueAny[],
    pages:WebSitePage[]
}