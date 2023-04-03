import { configuration } from "./configuration.d.ts";
import { logging } from "./logging.d.ts";
import * as slim from "./slim_modules.ts";
export module colorconsole {
    export interface iConsole extends Console{
        configurations:configuration.iConfigurations;
        levelSuppressions:slim.types.iKeyValueAny;
        assert(...args:any):void;
        count(...args:any):void;
        countReset(...args:any):void;
        dirxml(...args:any):void;
        abort(...args:any): void;
        clear(...args:any):void;
        colorize(string_value:string, configuration:configuration.iPrintProperties, print_delimiter:boolean):string;
        dir(...args:any):void;
        debug(...args:any):void;
        error(...args:any):void;
        group(...args:any):void;
        groupCollapsed(...args:any):void;
        groupEnd(...args:any):void;
        info(...args:any):void;
        log(...args:any):void;
        profile(...args:any):void;
        profileEnd(...args:any):void;
        print(event:logging.iLogInformation, configuration:configuration.iConfiguration):void;
        table(...args:any):void;
        time(...args:any):void;
        timeEnd(...args:any):void;
        timeLog(...args:any):void;
        timeStamp(...args:any):void;
        todo(...args:any):void;
        trace(...args:any):void;
        warn(...args:any):void;
        write(write_string:string):void;
    }
    export interface iConsoleClass {
        new(configuration?:slim.types.iKeyValueAny): iConsole;
    }
    export interface DirOptions {
        showHidden:boolean,
        depth:number,
        colors:boolean,
        current_depth:number
    }
}