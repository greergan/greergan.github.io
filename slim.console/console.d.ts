import { configuration } from "./configuration.d.ts";
import { logging } from "./logging.d.ts";
import * as slim from "./slim_modules.ts";
export module colorconsole {
    export interface iConsole {
        configurations:configuration.iConfigurations;
        levelSuppressions:slim.types.iKeyValueAny;
        assert(): void;
        abort(...args:any): void;
        clear(): void;
        colorize(string_value:string, configuration:configuration.iPrintProperties, print_delimiter:boolean): string;
        dir(...args:any): void;
        debug(...args:any): void;
        error(...args:any): void;
        info(...args:any): void;
        log(...args:any): void;
        print(event:logging.iLogInformation, configuration:configuration.iConfiguration): void;
        todo(...args:any): void;
        trace(...args:any): void;
        warn(...args:any): void;
    }
    export interface iConsoleClass {
        new(configuration?:slim.types.iKeyValueAny): iConsole;
    }
}