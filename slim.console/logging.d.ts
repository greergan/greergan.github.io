import * as slim from "./slim_modules.ts";
export module logging {
    export interface iPrintValues {
        levelName?:string;
        className:string;
        methodName:string;
        fileName:string;
        lineNumber:string;
        messageText:string;
        messageValue:string;
        objectString:string;
        stackTrace:string;
        path:string;
    }
    export interface iLogInformation extends Error {
        name:string;
        message:string;
        overrides:slim.types.iKeyValueAny;
        properties:logging.iPrintValues;
    }
    export interface iLogInformationClass {
        new(args:Array<any>): iLogInformation;
    }
}