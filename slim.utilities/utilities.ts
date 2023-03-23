import { is_file_url, is_valid_url } from "./validations.ts";
import * as slim from "./slim_modules.ts";

export function get_absolute_file_path(url:string): string|undefined {
    const file:string|undefined = (is_file_url(url)) ? url.substring(7): undefined;
    console.trace(file);
    return file;
}
export async function get_file_contents(file:string): Promise<slim.types.iKeyValueAny|undefined> {
    try {
        const json:slim.types.iKeyValueAny = JSON.parse(await(await fetch(file)).text());
        console.trace({message:"fetch",value:"succeeded"}, file);
        return json;
    }
    catch(e) {
        if('SlimConsole' in window) SlimConsole.abort({message:"fetch",value:"failed"}, file);
        else throw new Error("fetch failed" + " " + file);
    }
}
export async function get_normalized_url(property:string): Promise<string|undefined> {
    const cwd = await Deno.cwd();
    let normalized_url:string|undefined = undefined;
    if(property.startsWith("./")) {
        const new_value = property.replace("./", "");
        normalized_url = (new_value.length > 1) ? `file://${cwd}/${new_value}` : `file://${cwd}`;
    }
    else if(property == ".") {
        normalized_url = `file://${cwd}`;
    }
    else if(property.startsWith("..")) {
        let new_value = property;
        let new_cwd = cwd;
        while(new_value.startsWith("..")) {
            if(new_value.startsWith("../")) {
                new_value = new_value.substring(3);
            }
            else if(new_value.startsWith("..")) {
                new_value = new_value.substring(2);
            }
            new_cwd = new_cwd.substring(0, new_cwd.lastIndexOf("/"));
        }
        normalized_url = (new_value.length == 0) ? `file://${new_cwd}` : `file://${new_cwd}/${new_value}`;
    }
    else if(is_valid_url(property)) {
        normalized_url = property;
    }
    else {
        normalized_url = `file://${cwd}/${property}`;
    }
    if(normalized_url.endsWith("/")) {
        normalized_url = normalized_url.substring(0, normalized_url.lastIndexOf("/"));
    }
    console.trace(normalized_url);
    return normalized_url;
}