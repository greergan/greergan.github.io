///// <reference types="./console.d.ts" />
import * as slim from "./slim_modules.ts";
import { colorconsole } from "./console.d.ts";
import { configuration } from "./configuration.d.ts";
import { configure, configurationLevels, configurationSubLevels, get_default_print_property_values} from "./configuration.ts";
import * as colors from "./color.ts";
import { LogInformation } from "./logging.ts";
declare global {
    var SlimConsole:colorconsole.SlimColorConsole;
    interface Window {
        SlimConsole:colorconsole.SlimColorConsole;
    }
}
const defaultDirOptions:colorconsole.DirOptions = { "showHidden": false, "depth": 2, "colors": false, "current_depth":0 };
export class SlimColorConsole implements colorconsole.iConsole {
    configurations:configuration.iConfigurations = {};
    levelSuppressions:slim.types.iKeyValueAny = {};
    master_configuration:slim.types.iKeyValueAny = {};
    constructor(configuration?:slim.types.iKeyValueAny) {
        const lower_case_levels:string[] = configurationLevels.map(element => element.toLowerCase());
        if(typeof configuration !== 'object') {
            configuration = {};
        }
        else {
            this.master_configuration = slim.utilities.copy_ofSync(configuration, {skip:lower_case_levels});
            this.levelSuppressions = slim.utilities.copy_ofSync(configuration['levelSuppressions']);
        }
        for(const level of configurationLevels) {
            const levelConfiguration = slim.utilities.comingleSync([this.master_configuration, configuration[level.toLowerCase()]], {}) as configuration.iPrintProperties;
            levelConfiguration.levelName = level;
            this.configurations[level.toLowerCase()] = configure(levelConfiguration);
        }
        if(configuration!.hasOwnProperty('dir')) {
            this.configurations['dir'] = {};
            ['object','name','value'].forEach((key) => {
                if(configuration['dir'].hasOwnProperty(key)) {
                    this.configurations['dir'][key] = slim.utilities.comingleSync([get_default_print_property_values(), configuration['dir'][key]]) as configuration.iPrintProperties;
                }
                else {
                    this.configurations['dir'][key] = slim.utilities.copy_ofSync(get_default_print_property_values());
                }
            });
        }
        else {
            this.configurations['dir'] = {};
            ['object','name','value'].forEach((key) => { 
                this.configurations['dir'][key] = slim.utilities.copy_ofSync(get_default_print_property_values());
            });
        }
        window.console = this;
    }
    abort(...args:any) {
        this.print(new LogInformation(args), this.configurations.abort);
        if(Deno !== undefined) { Deno.exit(1); }
    }
    assert(...args:any):void {
        if(args[0]) return;
        args.shift();
        if(typeof args[0] !== 'object' || !args[0].hasOwnProperty('message')) {
            args.unshift("Assertion failed");
        }
        this.print(new LogInformation(args), this.configurations.assert);
    }
    clear():void {
        this.stdout('\x1b[2J\x1b[H');
    }
    count(...args:any):void {}
    countReset(...args:any):void {}
    dir(item:object, options?:object):void {
        const working_options = slim.utilities.comingleSync([defaultDirOptions, options]);
        working_options.current_depth++;
        let print_string = "";
        const object_type:string = Array.isArray(item) ? "Array" : typeof item;
        let content_string = this.format_dir(item, working_options);
        if(content_string.length > 0) {
            print_string += this.colorize(`${object_type}:\n`, this.configurations['dir']['object']);
            print_string += content_string;
            //print_string += `\n`;
        }
        else {
            print_string += this.colorize(`${object_type}:\n`, this.configurations['dir']['object']);
        }
        this.stderr(print_string);
    }
    dirxml(...args:any):void {}
    debug(...args:any):void { this.print(new LogInformation(args), this.configurations.debug); }
    error(...args:any):void { this.print(new LogInformation(args), this.configurations.error); if(Deno !== undefined) { Deno.exit(1); } }
    group(...args:any):void {}
    groupCollapsed(...args:any):void {}
    groupEnd(...args:any):void {}
    info(...args:any):void { this.print(new LogInformation(args), this.configurations.info); }
    log(...args:any):void { this.print(new LogInformation(args), this.configurations.log); }
    profile(...args:any):void {}
    profileEnd(...args:any):void {}
    table(...args:any):void {}
    time(...args:any):void {}
    timeEnd(...args:any):void {}
    timeLog(...args:any):void {}
    timeStamp(...args:any):void {}
    todo(...args:any):void { this.print(new LogInformation(args), this.configurations.todo); }
    trace(...args:any):void { this.print(new LogInformation(args), this.configurations.trace); }
    warn(...args:any):void { this.print(new LogInformation(args), this.configurations.warn); }
    colorize(string_value:string, configuration:configuration.iPrintProperties): string {
        let colored_string = "";
        if(string_value !== undefined && !configuration.suppress) {
            colored_string = "\u001b[";
            if(configuration.bold)      { colored_string += "1;"; }
            if(configuration.dim)       { colored_string += "2;"; }
            if(configuration.italic)    { colored_string += "3;"; }
            if(configuration.underLine) { colored_string += "4;"; }
            if(configuration.inverse)   { colored_string += "7;"; }
            const console_text_color:number = colors.textColors[configuration.textColor];
            const console_background_color:number = colors.backgroundColors[configuration.backgroundColor];
            if(console_text_color > 29) {
                colored_string += `${console_text_color};`;
            }
            else {
/*
                if(stoi(configuration->text_color) > -1) {
                    return_stream << "\33[38;5;" + configuration->text_color << "m";
                }
                else if(std::regex_match(configuration->text_color, std::regex("[0-9]{1,3};[0-9]{1,3};[0-9]{1,3}"))) {
                    return_stream << "\33[38;2;" + configuration->text_color << "m";
                }
*/
            }
            if(console_background_color > 38) {
                colored_string += `${console_background_color};`;
            }
            else {
/*
                if(stoi(configuration->background_color) > -1) {
                    return_stream << "\33[48;5;" + configuration->background_color << "m";
                }
                else if(std::regex_match(configuration->text_color, std::regex("[0-9]{1,3};[0-9]{1,3};[0-9]{1,3}"))) {
                    return_stream << "\33[48;2;" + configuration->background_color << "m";
                }
*/
            }
            if(colored_string.endsWith(';')) {
                colored_string = colored_string.substring(0, colored_string.length - 1);
            }
            colored_string += `m${string_value}${configuration.delimiter}\u001b[0m`;
        }
        return colored_string;
    }
    format_dir(item:object, options:colorconsole.DirOptions):string {
        const working_options:colorconsole.DirOptions = slim.utilities.copy_ofSync(options);
        if(working_options.current_depth == working_options.depth) {
            return "";
        }
        let dir_string = "";
        const addSpaces = ():string => "".padStart(working_options.current_depth * 2, ' ');
        const keys:string[] = Object.keys(item);
        const new_options:colorconsole.DirOptions = slim.utilities.copy_ofSync(working_options);
        new_options.current_depth++;
        Object.keys(item).forEach((key:string, index:number) => {
            let object_type:string = Array.isArray(item[key]) ? "Array" : (typeof item[key]);
            if(object_type == 'object' || object_type == 'Array') {
                const key_value_string:string = this.format_dir(item[key], new_options);
                if(key_value_string.length > 0) {
                    dir_string += this.colorize(`${addSpaces()}${object_type}: ${key}\n`, this.configurations['dir']['object']);
                    dir_string += key_value_string;
                    dir_string += this.colorize(`${addSpaces()}\n`, this.configurations['dir']['object']);
                }
                else {
                    dir_string += this.colorize(`${addSpaces()}${object_type}: ${key}\n`, this.configurations['dir']['object']);
                }
            }
            else {
                dir_string += this.colorize(`${addSpaces()}${key}:`, this.configurations['dir']['name']);
                dir_string += this.colorize(`${item[key]}${(index < keys.length - 1) ? `,\n` : `\n`}`, this.configurations['dir']['value']);
            }
        });
        return dir_string;
    }
    print(event:LogInformation, configuration:configuration.iConfiguration): void {
        let working_configuration:configuration.iConfiguration = slim.utilities.copy_ofSync(configuration);
        const levelName:string = configuration!.level!['levelName'];
        // check for module entries
        // check for module functions overrides file level
        // check for module files overrides module level
        // check for module levels [debug|trace|...] // overrides base levels
        const setOverride = (override_object:slim.types.iKeyValueAny):boolean => {
            let override_found:boolean = true;
            switch(typeof override_object[levelName.toLowerCase()]) {
                case 'boolean':
                    override_found = true;
                    working_configuration.suppress = override_object[levelName.toLowerCase()];
                    break;
                case 'object':
                    override_found = true;
                    working_configuration = slim.utilities.comingleSync([working_configuration, override_object[levelName.toLowerCase()]]);
                    break;
                default:
                    console.warn({message:"object type", value:"not supported"}, override_object)
                    break;
            }
            return override_found;
        }
        let override_found:boolean = false;
        const slim_module:string = event.properties.path.match(/slim.\w*/);
        if(this.levelSuppressions.hasOwnProperty(slim_module)) {
            if(this.levelSuppressions[slim_module].hasOwnProperty('functions')) {
                const funct:object = this.levelSuppressions[slim_module].functions.find(funct => funct.name == event.properties.methodName);
                if(funct !== undefined && funct.hasOwnProperty(levelName.toLowerCase())) {
                    override_found = setOverride(funct);
                }
            }
            if(!override_found && this.levelSuppressions[slim_module].hasOwnProperty('files')) {
                const file:object = this.levelSuppressions[slim_module].files.find(
                    file => file.name == event.properties.fileName.substring(event.properties.fileName.lastIndexOf('/') + 1));
                if(file !== undefined && file.hasOwnProperty(levelName.toLowerCase())) {
                    override_found = setOverride(file);
                }
            }
            if(!override_found && this.levelSuppressions[slim_module][levelName.toLowerCase()]) {
                override_found = setOverride(this.levelSuppressions[slim_module]);
            }
        }
        if(!override_found && this.configurations.hasOwnProperty(levelName.toLowerCase())) {
            override_found = setOverride(this.configurations);
        }
        // event.overrides takes precedence 
        if(event.overrides.hasOwnProperty(levelName.toLowerCase())) {
            override_found = setOverride(event.overrides);
        }
        if(working_configuration.hasOwnProperty('suppress') && working_configuration.suppress) {           
            return;
        }
        let printable_string:string = "";
        printable_string += this.colorize(`${levelName} ${new Date().getTime().toString().substring(5)}`, working_configuration.level);
        printable_string += this.colorize(event.properties.path, working_configuration.path);
        printable_string += this.colorize(event.properties.fileName, working_configuration.fileName);
        printable_string += this.colorize(event.properties.lineNumber, working_configuration.lineNumber);
        printable_string += this.colorize(event.properties.className, working_configuration.className);
        printable_string += this.colorize(event.properties.methodName, working_configuration.methodName);
        printable_string += this.colorize(event.properties.messageText, working_configuration.messageText);
        printable_string += this.colorize(event.properties.messageValue, working_configuration.messageValue);
        printable_string += this.colorize(event.properties.objectString, working_configuration.objectString);
        if(printable_string.length > 0) { this.stderr(printable_string); }
        printable_string = this.colorize(event.properties.stackTrace, working_configuration.stackTrace);
        if(printable_string.length > 0) { this.stderr(printable_string); }
    }
    stderr(string_to_print:string):void {
        if(window.hasOwnProperty('Deno')) {
            Deno.stderr.writeSync(new TextEncoder().encode(`${string_to_print}\n`));
        }
    }
    stdout(string_to_print:string):void {
        if(window.hasOwnProperty('Deno')) {
            Deno.stdout.writeSync(new TextEncoder().encode(`${string_to_print}\n`));
        }
    }
}