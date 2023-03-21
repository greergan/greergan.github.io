export function test$_78() {
    SlimConsole.trace({message:"trace",value:"values inside and external function"});
}
export async function async_function() {
    SlimConsole.warn({message:"trace",value:"values inside and external async function"});
}
export class regex_test {
    constructor() {
        SlimConsole.debug({message:"debug",value:"inside a class constructor called"});
        SlimConsole.debug({message:"debug",value:"DEBUG className, messageText, messageValue, objectString"});
    }
    debug() {
        SlimConsole.debug({message:"debug",value:"values inside and external class method"}, "with some added strings and such", {key:"pair"});
        SlimConsole.debug({message:"debug",value:"DEBUG className, methodName messageText, messageValue, objectString"});
    }
}
