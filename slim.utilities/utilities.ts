import { is_file_url, is_valid_url } from "./validations.ts";
import * as slim from "./slim_modules.ts";
export function get_absolute_file_path(url:string): string|undefined {
    const file:string|undefined = (is_file_url(url)) ? url.substring(7): undefined;
    if(window.hasOwnProperty('SlimConsole')) console.trace(file);
    return file;
}
export async function get_file_contents(file:string): Promise<string|undefined> {
    try {
        const json:slim.types.iKeyValueAny = (await fetch(file)).text();
        if(window.hasOwnProperty('SlimConsole')) console.trace({message:"fetch",value:"succeeded"}, file);
        return json;
    }
    catch(e) {
        if('SlimConsole' in window) SlimConsole.abort({message:"fetch",value:"failed"}, file, e.message);
        else throw new Error("fetch failed" + " " + file + " " + e.message);
    }
}
export async function get_json_contents(file:string): Promise<slim.types.iKeyValueAny|undefined> {
    const json:slim.types.iKeyValueAny = JSON.parse(await get_file_contents(file) ?? "");
    if(window.hasOwnProperty('SlimConsole')) console.trace({message:"fetch",value:"succeeded"}, file);
    return json;
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
    if(window.hasOwnProperty('SlimConsole')) console.trace(normalized_url);
    return normalized_url;
}
export async function write_output(output_file:string, content:string) {
    const file = get_absolute_file_path(output_file);
    if(file !== undefined && file.length > 1) {
        try {
            Deno.mkdirSync(file.substring(0, file.lastIndexOf("/")), { recursive: true });
            Deno.writeTextFileSync(file, content);
        }
        catch(e) {
            if(window.hasOwnProperty('SlimConsole')) SlimConsole.abort({message:"write_output"}, e);
        }
    }
    else {
        if(window.hasOwnProperty('SlimConsole')) SlimConsole.abort({message: "not a valid file url"}, output_file);
    }
    if(window.hasOwnProperty('SlimConsole')) console.trace();
}