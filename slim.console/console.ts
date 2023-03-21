///// <reference types="./console.d.ts" />
import * as slim from "./slim_modules.ts";
import { colorconsole } from "./console.d.ts";
import { configuration } from "./configuration.d.ts";
import { configure, configurationLevels } from "./configuration.ts";
import * as colors from "./color.ts";
import { LogInformation } from "./logging.ts";
export class SlimColorConsole implements colorconsole.iConsole {
    configurations:configuration.iConfigurations = {};
    master_configuration:slim.types.iKeyValueAny = {};
    constructor(configuration?:slim.types.iKeyValueAny) {
        const lower_case_levels = configurationLevels.map(element => element.toLowerCase());
        if(typeof configuration !== 'object') {
            configuration = {};
        }
        else {
            this.master_configuration = slim.utilities.copy_ofSync(configuration, {skip:lower_case_levels});
        }
        for(const level of configurationLevels) {
            const levelConfiguration = slim.utilities.comingleSync([this.master_configuration, configuration[level.toLowerCase()]], {}) as configuration.iPrintProperties;
            levelConfiguration.levelName = level;
            this.configurations[level.toLowerCase()] = configure(levelConfiguration);
        }
    }
    abort(...args:any) {
        this.print(new LogInformation(args), this.configurations.abort);
        if(Deno !== undefined) {
            Deno.exit(1);
        }
    }
    assert() {

    }
    clear() {

    }
    dir(...args:any) {

    }
    debug(...args:any): void {
        this.print(new LogInformation(args), this.configurations.debug);
    }
    error(...args:any): void {
        this.print(new LogInformation(args), this.configurations.error);
    }
    info(...args:any): void {
        this.print(new LogInformation(args), this.configurations.info);
    }
    log(...args:any): void {
        this.print(new LogInformation(args), this.configurations.log);
    }
    todo(...args:any): void {
        this.print(new LogInformation(args), this.configurations.todo);
    }
    trace(...args:any): void {
        this.print(new LogInformation(args), this.configurations.trace);
    }
    warn(...args:any): void {
        this.print(new LogInformation(args), this.configurations.warn);
    }
    colorize(string_value:string, configuration:configuration.iPrintProperties): string {
        let colored_string = "";
        if(string_value !== undefined && !configuration.suppress) {
            colored_string = "\u001b[";
            if(configuration.bold) {
                colored_string += "1;";
            }
            if(configuration.dim) {
                colored_string += "2;";
            }
            if(configuration.italic) {
                colored_string += "3;";
            }
            if(configuration.underLine) {
                colored_string += "4;";
            }
            if(configuration.inverse) {
                colored_string += "7;";
            }
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
    print (event:LogInformation, configuration:configuration.iConfiguration): void {
        let printable_string:string = "";
        const levelName:string = configuration!.level!['levelName'] as string;
        printable_string += this.colorize(levelName, configuration.level);
        printable_string += this.colorize(event.properties.path, configuration.path);
        printable_string += this.colorize(event.properties.className, configuration.className);
        printable_string += this.colorize(event.properties.methodName, configuration.methodName);
        printable_string += this.colorize(event.properties.fileName, configuration.fileName);
        printable_string += this.colorize(event.properties.lineNumber.toString() as string, configuration.lineNumber);
        printable_string += this.colorize(event.properties.messageText, configuration.messageText);
        printable_string += this.colorize(event.properties.messageValue, configuration.messageValue);
        printable_string += this.colorize(event.properties.objectString, configuration.objectString);
        printable_string += this.colorize(event.properties.stackTrace, configuration.stackTrace);
        if(Deno !== undefined && printable_string.length > 0) {
            Deno.stderr.writeSync(new TextEncoder().encode(`${printable_string}\n`));
        }
    }
}