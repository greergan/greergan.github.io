#!/usr/bin/env -S deno run --allow-all --reload --watch --check
import * as slim from "./slim_modules.ts";
import { WatchAndUpdate } from "./watch_and_update.ts";
const console_config:slim.types.iKeyValueAny = await slim.utilities.get_json_contents("http://192.168.122.59/configurations/console/default.json") ?? {};
window.SlimConsole = new slim.colorconsole.SlimColorConsole(console_config);
const router:slim.server.HttpRouter = new slim.server.HttpRouter({
    port:8080,
    handleWebsockets:true,
    rootDirectory:'/home/greergan/greergan.github.io',
    runningOnMessage:`Control Panel server running => https://dev.tail96550.ts.net/SLIM_GENERATOR_ADMIN`
});
const watchAndUpdate:WatchAndUpdate = new WatchAndUpdate(router);
watchAndUpdate.watch([
    "/home/greergan/greergan.github.io/pages",
    "/home/greergan/greergan.github.io/includes",
    "/home/greergan/greergan.github.io/partials",
    "/home/greergan/greergan.github.io/slim.generator/generator_server",
    "/home/greergan/greergan.github.io"
]);
await router.addRoute({uri:'/SLIM_GENERATOR_ADMIN', resolver:'index.html', rootDirectory:'/home/greergan/greergan.github.io/slim.generator/generator_server/html' });
await router.addRoute({uri:'/SLIM_GENERATOR_ADMIN', resolver:'static', rootDirectory:'/home/greergan/greergan.github.io/slim.generator/generator_server/html' });
await router.addRoute({uri:'/SLIM_GENERATOR_ADMIN', protocol:"webSocket", onMessage:watchAndUpdate.onMessage, resolver: watchAndUpdate.onConnect});
router.startRouter();
