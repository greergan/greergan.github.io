import * as slim from "./slim_modules.ts";
import { SlimFilter } from "./index.ts"

window.SlimConsole = new slim.colorconsole.SlimColorConsole(await slim.utilities.get_json_contents("https://greergan.github.io/configurations/console/default.json"));
SlimConsole.configurations.trace.stackTrace.suppress = true;
console.info({message:"demo",value:"filters"});