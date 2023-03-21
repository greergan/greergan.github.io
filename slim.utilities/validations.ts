import { get_absolute_file_path } from "./utilities.ts";
export async function is_directory(url:string): Promise<boolean> {
    let isDirectory:boolean = false;
    if(is_file_url(url)) {
        const results = get_absolute_file_path(url);
        if(results !== 'undefined') {
            isDirectory = (await Deno.stat(results!)).isDirectory;
        }
    }
    return isDirectory;
}
export async function is_file(url:string): Promise<boolean> {
    let isFile:boolean = false;
    if(is_file_url(url)) {
        const results = get_absolute_file_path(url);
        if(results !== 'undefined') {
            isFile = (await Deno.stat(results!)).isFile;
        }
    }
    return isFile;
}
export function is_file_url(url:string): boolean {
    return (url.startsWith("file:///")) ? true: false;
}
export function is_http_url(url:string): boolean {
    return (url.startsWith("http://")) ? true: false;
}
export function is_https_url(url:string): boolean {
    return (url.startsWith("https://")) ? true: false;
}
export function is_valid_url(url:string): boolean {
    return (is_file_url(url) || is_http_url(url) || is_https_url(url)) ? true: false;
}