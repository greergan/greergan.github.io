import * as slim from "./slim_modules.ts";
export async function check_config(config:slim.types.iKeyValueAny): Promise<boolean> {
    const top_level_words:string = "top level configuration property";
    if(typeof config.pages === undefined || !Array.isArray(config.pages) || config.pages.length === 0) {
        SlimConsole.abort({message:top_level_words,value:"pages array is empty or not found"});
    }
    if(typeof config.namespace === undefined || config.namespace === "") {
        SlimConsole.abort({message:top_level_words,value:"namespace value not found"});
    }
    if(typeof config.output_to === undefined || config.output_to === "") {
        SlimConsole.abort({message:top_level_words,value:"output_to not found"});
    }
    if('generate_ids' in config!) {
        if(!Array.isArray(config!.generate_ids)) {
            SlimConsole.abort({message:top_level_words,value:"generate_ids not an Array"});
        }
    }
    console.trace({message:"suceeded"});
    return true;
}
export async function is_valid_output_namespace(output_to:string, namespace:string): Promise<boolean> {
    if(output_to == namespace) {
        SlimConsole.warn({message: "top level properties output directory and namespace",value:"match"});
    }
/*
    if(!(await slim.utilities.is_directory(output_to))) {
        SlimConsole.abort({message: "cannot assign output to a file"});
    }
    if(!await (await slim.utilities.is_directory(output_to))) {
        SlimConsole.abort({message: "cannot assign output to a file"});
    }
    if(!await (await slim.utilities.is_directory(namespace))) {
        SlimConsole.abort({message: "namespace must be a directory"});
    }
*/
    SlimConsole.todo({message:"decide if better checking is needed"});
    console.trace({message:"suceeded"});
    return true;
}