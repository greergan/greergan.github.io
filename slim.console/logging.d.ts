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
        properties:logging.iPrintValues;
    }
    export interface iLogInformationClass {
        new(args:Array<any>): iLogInformation;
    }
}