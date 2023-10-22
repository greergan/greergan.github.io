import { get_absolute_file_path } from "./utilities.ts";
// '[^]A-Za-z0-9_.~!*''();:@&=+$,/?#[%-]+' are all valid in URI strings
export async function is_directory(url:string): Promise<boolean> {
    let isDirectory:boolean = false;
    if(is_file_url(url)) {
        const results = get_absolute_file_path(url);
        if(results !== undefined) {
            isDirectory = (await Deno.stat(results!)).isDirectory;
        }
    }
    if(window.hasOwnProperty('SlimConsole')) console.trace(isDirectory);
    return isDirectory;
}
export async function is_file(url:string|undefined): Promise<boolean> {
    let isFile:boolean = false;
    if(url && is_file_url(url)) {
        const results = get_absolute_file_path(url);
        if(results !== 'undefined') {
            isFile = (await Deno.stat(results!)).isFile;
        }
    }
    if(window.hasOwnProperty('SlimConsole')) console.trace(isFile);
    return isFile;
}
export function is_file_url(url:string|undefined): boolean {
    if(window.hasOwnProperty('SlimConsole')) console.trace({message:url,value: url && url.startsWith("file:///")});
    return (url && url.startsWith("file:///")) ? true: false;
}
export function is_http_url(url:string=""): boolean {
    if(window.hasOwnProperty('SlimConsole')) console.trace({message:url,value: url && url.startsWith("http://")});
    return (url && url.startsWith("http://")) ? true: false;
}
export function is_https_url(url:string=""): boolean {
    if(window.hasOwnProperty('SlimConsole')) console.trace({message:url,value: url && url.startsWith("https://")});
    return (url && url.startsWith("https://")) ? true: false;
}
export function is_valid_url(url:string=""): boolean {
    const is_valid:boolean = (is_file_url(url) || is_http_url(url) || is_https_url(url));
    if(window.hasOwnProperty('SlimConsole')) console.trace({message:url}, is_valid);
    return is_valid;
}