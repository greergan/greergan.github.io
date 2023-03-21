import * as slim from "./slim_modules.ts";
declare module color {
    export interface iColors extends Array<string>{}
    export interface iTextColors extends slim.types.iDictionary<string, number>{ [key: string]: number }
    export interface iBackgroundColors extends slim.types.iDictionary<string, number>{ [key: string]: number }
}