import * as slim from "./slim_modules.ts";
export module configuration {
    export interface iPrintProperties {
        [key: string]: string|number|boolean;
        precision:number;
        dim:boolean;
        bold:boolean;
        italic:boolean;
        inverse:boolean;
        underLine:boolean;
        textColor:string|number;
        backgroundColor:string|number;
        expandObject:boolean;
        suppress:boolean;
        delimiter:string;
    }
    export interface iConfiguration {
        propogate?:boolean;
        levelName?:string;
        level:iPrintProperties;
        className:iPrintProperties;
        methodName:iPrintProperties;
        fileName:iPrintProperties;
        lineNumber:iPrintProperties;
        messageText:iPrintProperties;
        messageValue:iPrintProperties;
        objectString:iPrintProperties;
        stackTrace:iPrintProperties;
        path:iPrintProperties;
    }
    export interface iConfigurationSubLevels extends Array<"level"|"className"|"methodName"|"fileName"|"lineNumber"|"objectString"|"stackTrace"|"path"|"messageText"|"messageValue">{}
    export interface iConfigurationLevels extends Array<string|"ABORT"|"ASSERT"|"DEBUG"|"ERROR"|"INFO"|"LOG"|"TODO"|"TRACE"|"WARN">{}
    export interface iLevelDefaultTextColor extends slim.types.iDictionary<"ABORT"|"ASSERT"|"DEBUG"|"ERROR"|"INFO"|"LOG"|"TODO"|"TRACE"|"WARN", string>{ [key: string]: string }
    export interface iPrintPropertyNames extends Array<"precision"|"dim"|"bold"|"italic"|"inverse"|"underLine"|"textColor"|"backgroundColor"|"expandObject"|"suppress"|"delimiter">{}
    export interface iConfigurations extends slim.types.iDictionary<string, iConfiguration>{}
}