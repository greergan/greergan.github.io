import * as slim from "./slim_modules.ts";
export async function check_config(config:slim.types.iKeyValueAny): Promise<boolean> {
    if(typeof config.pages === 'undefined' || config.pages.length === 0) {
        SlimConsole.abort({message:"top level pages array is empty or not found"});
    }
    if(typeof config.namespace === 'undefined' || config.namespace === "") {
        SlimConsole.abort({message:"top level namespace property value not found"});
    }
    if(typeof config.output_to === 'undefined' || config.output_to === "") {
        SlimConsole.abort({message:"top level output_to property value not found"});
    }
    SlimConsole.trace({message:"suceeded"});
    return true;
}
export async function is_valid_output_namespace(output_to:string, namespace:string): Promise<boolean> {
    if(output_to == namespace) {
        SlimConsole.warn({message: "output directory and namespace should not match"});
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
    SlimConsole.trace({message:"suceeded"});
    return true;
}