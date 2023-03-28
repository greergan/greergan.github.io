import * as slim from "./slim_modules.ts";
import { SlimFilter } from "./index.ts"

window.SlimConsole = new slim.colorconsole.SlimColorConsole(await slim.utilities.get_json_contents("http://192.168.122.59/configurations/console/default.json"));
//SlimConsole.configurations.trace.stackTrace.suppress = true;
//console.info(SlimConsole.configurations['levelSuppressions']['trace'] = false)
//trace.suppress = false;
console.info({message:"demo",value:"filters"});
const filter = new SlimFilter();
