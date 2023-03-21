import * as slim from "./slim_modules.ts";
declare global {
    var SlimConsole:slim.colorconsole.SlimColorConsole;
    interface Window { SlimConsole:slim.colorconsole.SlimColorConsole; }
}