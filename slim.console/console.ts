///// <reference types="./console.d.ts" />
import * as slim from "./slim_modules.ts";
import { colorconsole } from "./console.d.ts";
import { configuration } from "./configuration.d.ts";
import { configure, configurationLevels, configurationSubLevels } from "./configuration.ts";
import * as colors from "./color.ts";
import { LogInformation } from "./logging.ts";
declare global {
    var SlimConsole:colorconsole.SlimColorConsole;
    interface Window {
        SlimConsole:colorconsole.SlimColorConsole;
    }
}
window.console
export class SlimColorConsole implements colorconsole.iConsole {
    configurations:configuration.iConfigurations = {};
    levelSuppressions:slim.types.iKeyValueAny = {};
    master_configuration:slim.types.iKeyValueAny = {};
    constructor(configuration?:slim.types.iKeyValueAny) {
        window.console = this;
        const lower_case_levels = configurationLevels.map(element => element.toLowerCase());
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
    }
    abort(...args:any) {
        this.print(new LogInformation(args), this.configurations.abort);
        if(Deno !== undefined) {
            Deno.exit(1);
        }
    }
    assert(...args:any):void {}
    clear():void {}
    count(...args:any):void {}
    countReset(...args:any):void {}
    dir(...args:any):void {}
    dirxml(...args:any):void {}
    debug(...args:any):void { this.print(new LogInformation(args), this.configurations.debug); }
    error(...args:any):void { this.print(new LogInformation(args), this.configurations.error); }
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
    print(event:LogInformation, configuration:configuration.iConfiguration): void {
        const saved_configuration:configuration.iConfiguration = {};
        const levelName:string = configuration!.level!['levelName'];
        if(levelName.toLowerCase() in this.levelSuppressions) {
            if(this.levelSuppressions[levelName.toLowerCase()]) {
                return;
            }
        }
        for(const slim_module of ['slim.generator','slim.utilities','slim.view']) {
            if(slim_module in this.levelSuppressions) {
                if(levelName.toLowerCase() in this.levelSuppressions[slim_module]) {
                    if(this.levelSuppressions[slim_module][levelName.toLowerCase()]) {
                        if(event.properties.path.indexOf(`/${slim_module}/`) > 0) {
                            return;
                        }
                    }
                }
            }
        }
        if('SLIMOVERRIDES' in event.overrides) {
            for(const subLevel of configurationSubLevels) {
                if(subLevel in event.overrides.SLIMOVERRIDES) {
                    saved_configuration[subLevel] = slim.utilities.comingleSync([{},configuration[subLevel]]);
                    configuration[subLevel] = slim.utilities.comingleSync([configuration[subLevel], event.overrides.SLIMOVERRIDES[subLevel]]);
                }
            }
        }
        let printable_string:string = "";
        printable_string += this.colorize(levelName, configuration.level);
        printable_string += this.colorize(event.properties.path, configuration.path);
        printable_string += this.colorize(event.properties.fileName, configuration.fileName);
        printable_string += this.colorize(event.properties.lineNumber, configuration.lineNumber);
        printable_string += this.colorize(event.properties.className, configuration.className);
        printable_string += this.colorize(event.properties.methodName, configuration.methodName);
        printable_string += this.colorize(event.properties.messageText, configuration.messageText);
        printable_string += this.colorize(event.properties.messageValue, configuration.messageValue);
        printable_string += this.colorize(event.properties.objectString, configuration.objectString);
        printable_string += this.colorize(event.properties.stackTrace, configuration.stackTrace);
        if(Deno !== undefined && printable_string.length > 0) {
            Deno.stderr.writeSync(new TextEncoder().encode(`${printable_string}\n`));
        }
        if('SLIMOVERRIDES' in event.overrides) {
            for(const subLevel of configurationSubLevels) {
                if(subLevel in saved_configuration) {
                    configuration[subLevel] = slim.utilities.comingleSync([configuration[subLevel], saved_configuration[subLevel]]);
                    delete saved_configuration[subLevel];
                }
            }
        }
    }
}