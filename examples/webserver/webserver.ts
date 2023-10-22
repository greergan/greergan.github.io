#!/usr/bin/env -S deno run --allow-all --reload --watch
import * as slim from "./slim_modules.ts";
const running_since:number = new Date().getTime();
const console_config:slim.types.iKeyValueAny = await slim.utilities.get_json_contents("http://192.168.122.59/configurations/console/default.json") ?? {};
window.SlimConsole = new slim.colorconsole.SlimColorConsole(console_config);
const cwd = await Deno.cwd();
//console.clear();
const namespace:string = await slim.utilities.get_normalized_url("/home/greergan/greergan.github.io/") ?? "";
const view:slim.view.SlimView = new slim.view.SlimView(namespace);
const web_sockets = new Map();
const reverse_path_mappings = new Map();
async function watchAndUpdate(view:slim.view.SlimView) {
    //const watcher = Deno.watchFs([`${cwd}`], {recursive:true});
    const watcher = Deno.watchFs([`${cwd}`, "/home/greergan/greergan.github.io"], {recursive:true});
    const notified = new Set<string>();
    for await (const event of watcher) {
        if(event.kind == 'modify' && event.paths[0].endsWith('.ts') || event.paths[0].endsWith('.json')) {
            console.log(event.kind)
            console.error();
        }
        else if(event.kind == 'modify' && event.paths[0].endsWith('.html')) {
            const refreshable_url:string|undefined = reverse_path_mappings.get(slim.utilities.get_normalized_url(event.paths[0]));
            const normalized_url:string|undefined = await slim.utilities.get_normalized_url(event.paths[0]);
            const updateWebSocketClients = async (url:string) => {
                if(url && web_sockets.has(url)) {
                    let new_sockets:WebSocket[] = [];
                    web_sockets.get(url).map((socket:WebSocket) => {
                        if(socket.readyState == 1) {
                            const data = view.getStatus();
                            const reverse_mappings:object[] = [];
                            reverse_path_mappings.forEach((value, key) => reverse_mappings.push({url:value,file:key}));
                            data.reverse_path_mappings = reverse_mappings;
                            console.debug({message:"responding", value:"updating through socket"});
                            socket.send(JSON.stringify(data));
                            new_sockets.push(socket);
                        }
                    }); 
                    web_sockets.set(refreshable_url, new_sockets);
                }
            };
            if(refreshable_url && !notified.has(refreshable_url)) {
                notified.add(refreshable_url);
                const recompiled_files:string[] = await view.recompile(refreshable_url!);
                recompiled_files.forEach((file:string) => {
                    updateWebSocketClients(file);
                });
                setTimeout(function() { notified.delete(refreshable_url); }, 1000);
            }
            else if(refreshable_url) {
                notified.delete(refreshable_url);
            }
            else if(normalized_url && !notified.has(normalized_url)) {
                notified.add(normalized_url);
                const dependent_files_recompiled:string[] = await view.recompile(normalized_url);
                dependent_files_recompiled.forEach((file:string) => {
                    updateWebSocketClients(reverse_path_mappings.get(file));
                });
                setTimeout(function() { notified.delete(normalized_url); }, 1000);
            }
            else if(normalized_url && notified.has(normalized_url)) {
                    notified.delete(normalized_url);
            }
        }
    }
}
watchAndUpdate(view);
const env = Deno.env.toObject();
const projects:string[] = [];
for(const dirEntry of Deno.readDirSync(`${env.HOME}/.slim/etc/generator`)) {
    projects.push(dirEntry.name);
}
const model:slim.types.iKeyValueAny = {
    page:{
        title:"Control Panel",
        projects: {
            directory: `${env.HOME}/.slim/etc/generator`,
            projects: projects
        }
    },
    site:{copyright:{started_date:"2023",by:"Jeff Greer"}}
};
console.dir(model.page.projects, {depth:3});
const server = Deno.listen({ port: 8080 });
console.log(`Control Panel server running => https://dev.tail96550.ts.net/SLIM_ADMIN`);
for await (const conn of server) { serveHttp(conn); }

async function serveHttp(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);
    for await (const event of httpConn) {
        const url = new URL(event.request.url);
        let body:string = "";
        if(event.request.headers.get("Connection") == 'Upgrade' && event.request.headers.get("Upgrade") == 'websocket') {
/*             console.log(event.request.headers.get("RemoteAddr") ?? "Unknown");
            console.log(event.request.headers.get("X-Real-Ip") ?? "Unknown"); */
//console.log(event.request.headers.get("X-Forwarded-For") ?? "Unknown");
/*             console.log(event.request.headers.get("Host") ?? "Unknown");
            console.log(event.request.headers.get("Origin") ?? "Unknown");
            console.log(event.request.headers.get("X-Powered-By") ?? "Unknown");
            console.log(event.request.headers.get("Referer") ?? "Unknown");
            console.log(event.request.headers.get("Connection") ?? "Unknown");
            console.log(event.request.headers.get("Upgrade") ?? "Unknown");
            console.log(event.request.headers.get("Sec-WebSocket-Version") ?? "Unknown");
            console.log(event.request.headers.get("Sec-WebSocket-Protocol") ?? "Unknown");
            console.log(event.request.headers.get("Sec-WebSocket-Extensions") ?? "Unknown");
            console.log(event.request.headers.get("Sec-WebSocket-Key") ?? "Unknown"); */
            //Sec-WebSocket-Accept: hash.258EAFA5-E914-47DA-95CA-C5AB0DC85B11
            //{ socket, response } = Deno.upgradeWebSocket(event.request);
            const { socket, response } = Deno.upgradeWebSocket(event.request);
            //response.headers.append("Sec-WebSocket-Accept", event.request.headers.get("Sec-WebSocket-Key") ?? "");
            //console.log(event.request.url, url.pathname);
            if(!web_sockets.has(event.request.url)) {
                web_sockets.set(event.request.url, [socket]);
            }
            else {
                web_sockets.get(event.request.url).push(socket);
            }
            socket.onopen = () => {
                const data = view.getStatus();
                const reverse_mappings:object[] = [];
                reverse_path_mappings.forEach((value, key) => reverse_mappings.push({url:value,file:key}));
                data.reverse_path_mappings = reverse_mappings;
                data.running_since = running_since;
                socket.send(JSON.stringify(data));
            };
            //socket.onmessage = (e) => { console.log(e.data);};
            //socket.onclose = () => console.log("WebSocket has been closed.");
            socket.onerror = (e) => console.error("WebSocket error:", e);
            console.debug({message:"responding", value:"initial socket request"});
            event.respondWith(response);
        }
        else if(url.pathname == "/SLIM_ADMIN") {
            if(!reverse_path_mappings.has(`${namespace}/examples/webserver/pages/index.html`)) {
                reverse_path_mappings.set(`${namespace}/examples/webserver/pages/index.html`, event.request.url);
            }
            body = await view.render(model, "examples/webserver/pages/index.html");
            console.debug({message:"responding", value:url.pathname});
            event.respondWith( new Response(body, {
                status: 200,
                headers: { "content-type": "text/html; charset=utf-8" }
            }));
        }
        else if(url.pathname == "/assets/images/favicon.ico" || url.pathname == "/favicon.ico") {
            body = await slim.utilities.get_binary_contents(await slim.utilities.get_normalized_url(`${namespace}/assets/images/favicon.ico`) ?? "") ?? "";
            console.debug({message:"responding", value:url.pathname});
            event.respondWith( new Response(body, {
                status: 200,
                headers: { "content-type": "image/x-icon" }
            }));
        }
        else if(url.pathname == "/assets/images/logo.png") {
            body = await slim.utilities.get_binary_contents(await slim.utilities.get_normalized_url(`${namespace}${url.pathname}`) ?? "") ?? "";
            console.debug({message:"responding", value: await slim.utilities.get_normalized_url(`${namespace}${url.pathname}`) ?? "" });
            event.respondWith( new Response(body, {
                status: 200,
                headers: { "content-type": "image/png" }
            }));
        }
        else if(url.pathname == "/examples/webserver/assets/js/slim_admin_client.js") {
            body = await slim.utilities.get_file_contents(await slim.utilities.get_normalized_url(`${cwd}/${url.pathname}`) ?? "") ?? "";
            console.debug({message:"responding", value:url.pathname});
            event.respondWith( new Response(body, {
                status: 200,
                headers: { "content-type": "text/javascript" }
            }));
        }
        else {
            body = "";
            console.debug(url.pathname);
        }
    }
}
