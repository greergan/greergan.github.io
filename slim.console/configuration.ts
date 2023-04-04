///// <reference types="./configuration.d.ts" />
import { configuration  } from "./configuration.d.ts";
import * as slim from "./slim_modules.ts";
export const configurationLevels:configuration.iConfigurationLevels = ["ABORT", "ASSERT", "DEBUG", "ERROR", "INFO", "LOG", "TODO", "TRACE", "WARN"];
export const configurationSubLevels:configuration.iConfigurationSubLevels = ["level", "className", "methodName", "fileName", "lineNumber",
        "objectString", "stackTrace", "path", "messageText", "messageValue"];
const levelDefaultTextColor:configuration.iLevelDefaultTextColor = {
    ABORT: "bright_red", ASSERT: "bright_blue", DEBUG: "green", ERROR: "bright_red", INFO: "default", LOG: "default", TODO: "bright_blue", TRACE: "bright_magenta", WARN: "yellow"};
const printPropertyNames:configuration.iPrintPropertyNames = ["precision","dim","bold","italic","inverse","underLine","textColor","backgroundColor","expandObject","suppress","delimiter"];

export function get_default_print_property_values(): configuration.iPrintProperties {
    return {
        precision: 4, dim: false, bold: false, italic: false, inverse: false, underLine: false,
        textColor: "default", backgroundColor: "default", expandObject: false, suppress: false, delimiter:" "
    };
}
export function configure(configuration:slim.types.iKeyValueAny): configuration.iConfiguration {
    if('levelName' in configuration == false || !configurationLevels.includes(configuration.levelName)) {
        throw new Error('Configuration property levelName is required');
    }
    const config_template:configuration.iPrintProperties = get_default_print_property_values();
    const top_level_properties:configuration.iPrintProperties = slim.utilities.comingleSync([config_template, configuration], {excludes: ['object']}) as configuration.iPrintProperties;
    top_level_properties.textColor = levelDefaultTextColor[configuration.levelName! as string];
    const master_config:configuration.iConfiguration = {} as configuration.iConfiguration;
    for(const subLevel of configurationSubLevels) {
        if(top_level_properties.propogate) {
            if(subLevel == 'level') {
                master_config[subLevel] = slim.utilities.comingleSync([top_level_properties, configuration[subLevel]], {skip:['propogate'], excludes: ['object']}) as configuration.iPrintProperties;
            }
            else {
                master_config[subLevel] = slim.utilities.comingleSync([top_level_properties, configuration[subLevel]], {skip:['levelName', 'propogate'], excludes: ['object']}) as configuration.iPrintProperties;
            }
        }
        else {
            if(subLevel == 'level') {
                master_config[subLevel] = slim.utilities.comingleSync([top_level_properties, configuration[subLevel]], {skip:['propogate'], excludes: ['object']}) as configuration.iPrintProperties;
            }
            else {
                master_config[subLevel] = slim.utilities.comingleSync([config_template, configuration[subLevel]], {skip:['levelName', 'propogate'], excludes: ['object']}) as configuration.iPrintProperties;
            }
        }
    }
    return master_config;
}


function copy() {

}

/*
export function copy(source:iConfiguration, destination:iConfiguration): void
export function configure(source:iPrintProperties): void
*/

// abort, dir, log, debug, error, info, todo, trace, warn;
