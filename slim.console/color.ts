/// <reference path="./color.d.ts"/>
import { color } from "./color.d.ts";
export const colors:color.iColors = [
    "default", "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white", "bright_black",
    "bright_red", "bright_green", "bright_yellow", "bright_blue", "bright_magenta", "bright_cyan", "bright_white"
];

export const textColors:color.iTextColors = {
    default: 39, black: 30, red: 31, green: 32, yellow: 33, blue: 34,
    magenta: 35, cyan: 36, white: 37, bright_black: 90, bright_red: 91, bright_green: 92,
    bright_yellow: 93, bright_blue: 94, bright_magenta: 95, bright_cyan: 96, bright_white: 97
};

export const  backgroundColors:color.iBackgroundColors = {
    default: 49, black: 40, red: 41, green: 42, yellow: 43, blue: 44,
    magenta: 45, cyan: 46, white: 47, bright_black: 100, bright_red: 101, bright_green: 102,
    bright_yellow: 103, bright_blue: 104, bright_magenta: 105, bright_cyan: 106, bright_white: 107  
};
