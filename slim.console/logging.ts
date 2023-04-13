import { logging } from "./logging.d.ts";
import * as slim from "./slim_modules.ts";
export class LogInformation extends Error implements logging.iLogInformation {
    name:string = "";
    message:string = "";
    overrides:slim.types.iKeyValueAny = {};
    properties:logging.iPrintValues = {} as logging.iPrintValues;
    constructor(args:Array<any>) {
        super();
        this.properties.objectString = "";
        let index = 0;
        args.forEach(arg => {
            if(typeof arg == 'object' && index == 0 && 'message' in arg) {
                this.properties.messageText = arg.message;
                this.properties.messageValue = arg.value;
            }
            else if(typeof arg == 'object' && (arg.hasOwnProperty('SLIMOVERRIDE') || arg.hasOwnProperty('SLIMOVERRIDES'))) {
                this.overrides = arg.SLIMOVERRIDE ? arg.SLIMOVERRIDE : arg.SLIMOVERRIDES;
            }
            else {
                this.properties.objectString += JSON.stringify(arg) + ", ";
            }
            index++;
        });
        if(this.properties.objectString.endsWith(", ")) {
            this.properties.objectString = this.properties.objectString.substring(0, this.properties.objectString.lastIndexOf(", "));
        }
        if(this.stack !== undefined) {
            let stack_array:Array<string> = this.stack.split('\n');
            this.properties.stackTrace = this.stack;
            stack_array.shift(); // Remove the word Error or line of whitespace
            if(stack_array[0].indexOf("slim.console/console.ts") > -1) {
                stack_array.shift(); // Remove reference to the console class
            }
            let stack_end_file:string|undefined;
            let break_while: boolean = false;
            while(!break_while) {
                stack_end_file = stack_array.shift()?.trim();
                if(stack_end_file?.startsWith("at file:") || stack_end_file?.startsWith("at https:") || stack_end_file?.startsWith("at http:")) {
                    break_while = true;
                    this.properties.path = stack_end_file.replace(/^at\s/, '');
                }
                else {
                    break_while = true;
                    const file_info_regex:RegExp = /^at\s(new)*\s*([\w\d_\$\.\s]+)\s\((.+)\)/;
                    const string_matches = stack_end_file?.match(file_info_regex) || [];
                    if(string_matches && string_matches.length == 4) {
                        if(string_matches[1] == "new") {
                            this.properties.className = string_matches[2];
                        }
                        else if(string_matches[2]) {
                            const class_method_match = string_matches[2].match(/^([\w\d_\$]+)\.*(([\w\d_\$\s]+)*)$/) || [];
                            if(class_method_match.length >= 3) {
                                if(class_method_match[0] == class_method_match[1]) {
                                    this.properties.methodName = class_method_match[1];    
                                }
                                else {
                                    this.properties.className = class_method_match[1];
                                    this.properties.methodName = class_method_match[2];
                                }
                            }
                        }
                        this.properties.path = string_matches[3] as string;
                    }
                }
            }
            const path_string:string = this.properties.path as string || "";
            const path_elements:Array<string> = path_string.match(/(file:\/*|https*:\/*)\/*(.+):(\d+):\d+/) || [];
            if(path_elements.length == 4) {
                this.properties.fileName = path_elements[1] + "..." + path_elements[2].substring(path_elements[2].lastIndexOf('/'));
                this.properties.lineNumber = Number(path_elements[3]).toString();
            }
        }
    }
}
