#!/usr/bin/env -S deno run --allow-env -r --check
import * as slim from './slim_modules.ts';
import { test$_78, async_function, regex_test } from './demo_include.ts';
declare global {
    var SlimConsole:slim.colorconsole.SlimColorConsole;
    interface Window { SlimConsole:slim.colorconsole.SlimColorConsole; }
}

window.SlimConsole = new slim.colorconsole.SlimColorConsole({propogate: true, suppress:true, textColor:"blue",
    trace:{delimiter:"|",
        level:{suppress:false,bold:true},
        path:{suppress:false, textColor:"white",dim:true},
        messageText:{suppress:false, textColor:"blue",delimiter:"|"},
        messageValue:{suppress:false, textColor:"cyan"},
        objectString:{suppress:false, textColor:"yellow",delimiter:""}
    },
    info:{suppress:false, delimiter:": ",
        level:{suppress:false,bold:true},
        className:{suppress:false,bold:true},
        methodName:{suppress:false,bold:true},
        fileName:{suppress:false,dim:true},
        objectString:{suppress:false},
        path:{suppress:true},
        stackTrace:{suppress:true}
    },
    log:{suppress:true, delimiter:" => ",
        level:{suppress:false,bold:true},
        messageText:{suppress:false, textColor:"blue",delimiter:"|"},
        messageValue:{suppress:false, textColor:"cyan"},
        objectString:{suppress:false, textColor:"yellow", delimiter:""}
    },
    warn:{
        level:{suppress:false},
        className:{suppress:false,bold:true},
        methodName:{suppress:false,bold:true},
        messageText:{suppress:false, textColor:"blue",delimiter:"|"},
        messageValue:{suppress:false, textColor:"cyan"},
        objectString:{suppress:false}
    },
    debug:{
        level:{suppress:false},
        className:{suppress:false,bold:true},
        methodName:{suppress:false,bold:true},
        messageText:{suppress:false, textColor:"blue",delimiter:"|"},
        messageValue:{suppress:false, textColor:"cyan"},
        objectString:{suppress:false}
    },
    error:{stackTrace:{textColor: "red"}}
});
SlimConsole.trace({message:"this is a message", value:"this is a value"}, "a string", true, 900, {trace:"object"});
SlimConsole.configurations.trace.objectString.textColor = "red"
SlimConsole.trace({message:"this is a message", value:"this is a value"}, "a string", true, 900, {trace:"object"});
SlimConsole.log({message: "testing", value:"console.log"}, "string 1", "using multiple strings", {other: "message", prop:"testing"});
test$_78();
await async_function();
SlimConsole.info({message: "message", value:"testing from main file"}, "info test", "using multiple strings", {other: "message", prop:"testing"});
SlimConsole.trace("string only trace test", "using multiple strings");
const regex_test_instance = new regex_test();
regex_test_instance.debug();


//printf '\e]11;%s\a' '#ff0000'