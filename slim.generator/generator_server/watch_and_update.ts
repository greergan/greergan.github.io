import * as slim from "./slim_modules.ts";
import { explode_models } from "../generate/index.ts";
interface namespaceFileTuple {
    namespace:string,
    inputFile:string
}
export class WatchAndUpdate {
    private router:slim.server.HttpRouter;
    private fsEventDebounce:Set<string> = new Set<string>();
    private namespaceFiles:Map<string, namespaceFileTuple> = new Map<string, namespaceFileTuple>();
    private reversePathMappings:Map<string, string> = new Map<string, string>();
    private views:Map<string, slim.view.SlimView> = new Map<string, slim.view.SlimView>();
    private pageModels:Map<string, slim.types.iKeyValueAny> = new Map<string, slim.types.iKeyValueAny>();
    private middleWareAdded:boolean = false;
    private userHome = Deno.env.toObject().HOME;
    constructor(router:slim.server.HttpRouter) {
        this.router = router;
    }
    private addMiddleWare() {
        if(!this.middleWareAdded) {
            this.router.addMiddleWare({serverMethod:'addRoute',
                function:async (route:slim.server.HttpRouterInterfaces.HttpRoute) => {
                    console.debug(route);
                    if(route.protocol == 'http' && route.resolver != 'static' && route.contentType && route.contentType.startsWith('text/') && route.normalizedUrl) {
                        this.reversePathMappings.set(route.normalizedUrl, `${route.uri}`);
                        console.trace({message:"added", value:"reverse mapping for"}, route.uri);
                    }
                }
            });
            this.middleWareAdded = true;
        }
        console.trace();
    }
    public onConnect = async (event:EventTarget) => {
        console.debug({message:"beginning with",value:"event"},event);
        this.prepareResponse({response:{uri: '/SLIM_GENERATOR_ADMIN', initialResponse: true, message: {serverStartTime:this.router.ServerStartedTime}}});
        console.trace();
    };
    private async handleProjectQuery(project_name:slim.types.iKeyValueAny): Promise<slim.types.iKeyValueAny|undefined> {
        console.debug({message:"beginning with",value:"project_file_name"}, project_name);
        let query_response:slim.types.iKeyValueAny|undefined = undefined;
        if(project_name) {
            const normalized_url:string|undefined = await slim.utilities.get_normalized_url(`${this.userHome}/.slim/etc/generator/${project_name}`);
            if(normalized_url) {
                console.debug({message:"have",value:"normalized_url"}, normalized_url);
                const web_site_configuration:slim.types.iKeyValueAny|undefined = await slim.utilities.get_json_contents(normalized_url);
                if(web_site_configuration && 'pages' in web_site_configuration) {
                    let site_exploaded_models:slim.types.iKeyValueAny = {};
                    if(!('external_models' in web_site_configuration)) {
                        web_site_configuration.external_models = [];
                    }
                    else {
                        if(!Array.isArray(web_site_configuration.external_models)) {
                            console.error({message:"site level property",value:"external_models not an Array"});
                        }
                        else {
                            site_exploaded_models = await explode_models(web_site_configuration.external_models, web_site_configuration.namespace!);
                        }
                    }
                    if(!('models' in web_site_configuration)) {
                        web_site_configuration.models = {};
                    }
                    web_site_configuration.models = slim.utilities.comingleSync([{}, web_site_configuration.models, site_exploaded_models]);
                    for(const page of web_site_configuration.pages) {
                        let exploaded_models:slim.types.iKeyValueAny = {};
                        if('external_models' in page) {
                            if(!Array.isArray(page.external_models)) {
                                console.error({message:"page level property",value:"external_models not an Array"}, page.input_file);
                            }
                            else {
                                exploaded_models = await explode_models(page.external_models, web_site_configuration.namespace!);
                            }
                        }
                        if(!('models' in page)) {
                            page.models = {};
                        }
                        page.models = slim.utilities.comingleSync([{}, page.models, exploaded_models]);
                        const model:slim.types.iKeyValueAny = slim.utilities.comingleSync([{}, {site:web_site_configuration.models, page:page.models}]);
                        this.pageModels.set(page.input_file, model);
                    }
                }
                query_response = {query:{response:{project:project_name,configuration: web_site_configuration ?? 404}}};
            }
            else {
                query_response = {query:{response: 404}};
            }
        }
        console.trace();
        return query_response;
    }
    private async handleProjectsQuery(query:slim.types.iKeyValueAny): Promise<slim.types.iKeyValueAny|undefined> {
        console.debug({message:"beginning with",value:"query"}, query);
        let query_response:slim.types.iKeyValueAny|undefined = undefined;
        if('list' in query) {
            const projects:string[] = [];
            const directory_entries:AsyncIterable<Deno.DirEntry> = await Deno.readDir(`${this.userHome}/.slim/etc/generator`)
            for await (const dirEntry of directory_entries) {
                if(dirEntry.isFile) projects.push(dirEntry.name);
            }
            if(projects.length > 0) query_response = {query:{response:{projects:projects}}};
        }
        console.trace();
        return query_response;
    }
    private async handleReverseMappingsQuery(query:slim.types.iKeyValueAny): Promise<slim.types.iKeyValueAny|undefined> {
        console.debug({message:"beginning with",value:"query"}, query);
        let query_response:slim.types.iKeyValueAny|undefined = undefined;
        if('list' in query) {
            console.debug({message:"beginning with",value:"reversePathMappings"}, this.reversePathMappings.size);
            const reverse_mappings:object[] = [];
            this.reversePathMappings.forEach((value, key) => reverse_mappings.push({uri:value,file:key}));
            console.debug({message:"beginning with",value:"reversePathMappings"}, reverse_mappings);
            query_response = {query:{response:{reverse_mappings:reverse_mappings}}};
        }
        console.trace();
        return query_response;
    }
    private async handleQuery(query:slim.types.iKeyValueAny): Promise<slim.types.iKeyValueAny|undefined> {
        console.debug({message:"beginning with",value:"query"}, query);
        let query_response = undefined;
        if('projects' in query) {
            query_response = await this.handleProjectsQuery(query.projects);
        }
        if('project' in query) {
            query_response = await this.handleProjectQuery(query.project);
        }
        if('get_reverse_mappings' in query) {
            query_response = await this.handleReverseMappingsQuery(query.get_reverse_mappings);
        }
        console.trace();
        return query_response;
    }
    private async handleAddView(request:slim.types.iKeyValueAny):Promise<slim.types.iKeyValueAny> {
        console.debug({message:"beginning with",value:"request"}, request);
        const response:slim.types.iKeyValueAny= {add_view:{response:slim.server.http.Created}};
        if('namespace' in request.add_view && 'project_label_id' in request) {
            response.project_label_id = request.project_label_id;
            if(!this.views.has(request.add_view.namespace)) {
                this.views.set(request.add_view.namespace, new slim.view.SlimView(request.add_view.namespace));
            }
            else {
                response.add_view.response = slim.server.http.Conflict;
            }
        }
        else {
            response.original = request;
            response.add_view.response = slim.server.http.BadRequest;
        }
        console.trace({message:"returning", value:response.add_view.response});
        return response;
    }
    private async handleAddRoute(request:slim.types.iKeyValueAny):Promise<slim.types.iKeyValueAny> {
        console.debug({message:"beginning with",value:"request"}, request);
        const response:slim.types.iKeyValueAny = {add_route:{response:slim.server.http.Created}};
        if('uri' in request.add_route && 'input_file' in request.add_route && 'namespace' in request.add_route && 'page_label_id' in request) {
            response.page_label_id = request.page_label_id;
            this.namespaceFiles.set(`${request.add_route.namespace/request.add_route.input_file}`, {namespace:request.add_route.namespace,inputFile:request.add_route.input_file});
            const route_data:slim.server.HttpRouterInterfaces.HttpRoute = {
                uri:request.add_route.uri,protocol:'http',hits:0,discovered:'generated',contentType:'text/html; charset=utf-8',
                resolver: async () => {
                    const view = this.views.get(request.add_route.namespace);
                    if(view) {
                        const model:slim.types.iKeyValueAny = this.pageModels.get(request.add_route.input_file) ?? {};
                        return await view.render(model, request.add_route.input_file);
                    }
                }
            }
            route_data.inputFile = request.add_route.input_file;
            if('url' in request.add_route) {
                route_data.url = request.add_route.url;
            }
            await this.router.addRoute(route_data);
        }
        else {
            response.original = request;
            response.add_view.response = slim.server.http.BadRequest;
        }
        if(this.views.has(request.add_route.namespace)) {
           await this.views.get(request.add_route.namespace)!.compile(request.add_route.input_file);
        }
        console.trace({message:"returning", value:response.add_route.response});
        return response;
    }
    private async handleGetRoutes(request:slim.types.iKeyValueAny):Promise<slim.types.iKeyValueAny> {
        console.debug({message:"beginning with",value:"request"}, request);
        const response:slim.types.iKeyValueAny= {get_routes:{response:slim.server.http.OK}};
        if('protocol' in request.get_routes) {
            const routes = this.router.getRoutes(request.get_routes.protocol);
            if(routes) {
                response.routes = routes;
            }
            else {
                response.get_routes.response = slim.server.http.NotFound;
            }
        }
        else {
            response.original = request;
            response.get_routes.response = slim.server.http.BadRequest;
        }
        console.trace({message:"returning", value:response.get_routes.response}, "%d routes found", response.routes.size);
        return response;
    }
    private async handleGetView(request:slim.types.iKeyValueAny):Promise<slim.types.iKeyValueAny> {
        console.debug({message:"beginning with",value:"request"}, request);
        const response:slim.types.iKeyValueAny = {get_view:{response:slim.server.http.OK}};
        if('namespace' in request.get_view) {
            response.namespace = request.get_view.namespace;
            if(this.views.has(request.get_view.namespace)) {
                response.view = await this.views.get(request.get_view.namespace)!.getViewData();
            }
            else {
                response.get_view.response = slim.server.http.NotFound;
            }
        }
        else {
            response.original = request;
            response.get_view.response = slim.server.http.BadRequest;
        }
        console.trace({message:"returning", value:response.get_view.response});
        return response;
    }
    public onMessage = async (event:slim.types.iKeyValueAny) => {
        console.debug({message:"beginning with",value:"event"}, typeof event.data, event);
        let queries_made:number = 0;
        const eventContent:slim.types.iKeyValueAny = JSON.parse(event.data);
        const route:slim.server.HttpRouterInterfaces.WebSocketRoute|undefined
            = this.router.getRoute(eventContent.uri, 'webSocket') as slim.server.HttpRouterInterfaces.WebSocketRoute;
        if(route) {
            if('query' in eventContent) {
                console.debug({message:"using",value:"event.data"}, eventContent);
                let query_response = await this.handleQuery(eventContent.query);
                console.debug({message:"using",value:"query_response"}, query_response);
                if(!query_response) {
                    query_response = {query:{response:slim.server.http.InternalServerError},original:eventContent};
                }
                queries_made++;
                this.sendMessageToWebSocketClient(route, query_response);
            }
            if('add_route' in eventContent) {
                let response = await this.handleAddRoute(eventContent);
                if(!response) {
                    response = {add_route:{response:slim.server.http.InternalServerError},original:eventContent}
                }
                queries_made++;
                this.sendMessageToWebSocketClient(route, response);
            }
            if('add_view' in eventContent) {
                let response = await this.handleAddView(eventContent);
                if(!response) {
                    response = {add_view:{response:slim.server.http.InternalServerError},original:eventContent}
                }
                queries_made++;
                this.sendMessageToWebSocketClient(route, response);
            }
            if('get_routes' in eventContent) {
                let response = await this.handleGetRoutes(eventContent);
                if(!response) {
                    response = {get_routes:{response:slim.server.http.InternalServerError},original:eventContent}
                }
                queries_made++;
                this.sendMessageToWebSocketClient(route, response);
            }
            if('get_view' in eventContent) {
                let response = await this.handleGetView(eventContent);
                if(!response) {
                    response = {get_view:{response:slim.server.http.InternalServerError},original:eventContent}
                }
                queries_made++;
                this.sendMessageToWebSocketClient(route, response);
            }
            if(queries_made == 0) {
                this.sendMessageToWebSocketClient(route, {unknown:{response:slim.server.http.NotFound},original:eventContent});
            }
        }
    };
    public async watch(paths:string[], recursive:boolean=true) {
        console.debug({message:'beginning',value:'watch'});
        this.addMiddleWare();
        if(paths.length < 1) {
            throw new Error("An array with atleast 1 string expected");
        }
        for await(const event of Deno.watchFs(paths, {recursive:recursive})) {
            console.debug({message:'awaiting',value:'watch'});
            const normalized_url:string|undefined = await slim.utilities.get_normalized_url(event.paths[0]);
            if(event.kind == 'modify' && ['.ts','.json'].includes(event.paths[0].substring(event.paths[0].lastIndexOf('.')))) {
                console.error();
            }
            else if(event.kind == 'modify' && ['.html', '.js', '.css'].includes(event.paths[0].substring(event.paths[0].lastIndexOf('.')))) {
                if(!this.fsEventDebounce.has(normalized_url!)) {
                    this.fsEventDebounce.add(normalized_url!);
                    console.debug({message:"updating",value:"saved file"}, normalized_url);
                    if(this.reversePathMappings.has(normalized_url!)) {
                        console.debug({message:"found",value:"reversePathMappings"}, normalized_url);
                        const uri:string|undefined = this.reversePathMappings.get(normalized_url!);
                        if(uri) {
                            console.debug({message:"calling",value:"prepareResponse"}, uri);
                            this.prepareResponse({response:{uri: '/SLIM_GENERATOR_ADMIN', message:{refresh:{routes:[{uri: uri}]}}}});
                        }
                    }
                    else if(this.namespaceFiles.has(normalized_url!)) {
                        const namespace_input_file_pair:namespaceFileTuple|undefined = this.namespaceFiles.get(normalized_url!);
                        console.debug({message:"found",value:"namespaceFile"}, normalized_url);
                        if(this.views.has(namespace_input_file_pair!.namespace)) {
                            const view:slim.view.SlimView|undefined = this.views.get(namespace_input_file_pair!.namespace);
                            const updated_files:string[] = await view!.recompile(namespace_input_file_pair!.inputFile);
                            console.debug(updated_files);
                        }
                    }
                }
                else {
                    this.fsEventDebounce.delete(normalized_url!);
                }
            }
        }
    }
    private sendMessageToWebSocketClient = async (route:slim.server.HttpRouterInterfaces.WebSocketRoute, message:slim.types.iKeyValueAny, initialOnly:boolean=false) => {
        console.debug({message:"beginning with",value:"message, initialOnly"}, message);
        if(route) {
            for await (const socketTuple of route.socketTuples) {
                const canSend:boolean = initialOnly && socketTuple.messagesSent > 0 ? false : true;
                if(canSend) {
                    if(socketTuple.socket.readyState == 1) {
                        console.debug({message:"found",value:"socket"});
                        socketTuple.socket.send(JSON.stringify(message));
                        socketTuple.messagesSent++;
                        console.debug({message:"sent",value:"message"});
                    }
                }
            }
        }
    }
    private prepareResponse = async (query_response:slim.types.iKeyValueAny) => {
        console.debug({message:"beginning",value:"with message"}, query_response);
        if('response' in query_response) {
            if('uri' in query_response.response) {
                if('message' in query_response.response) {
                    const route:slim.server.HttpRouterInterfaces.WebSocketRoute|undefined
                        = this.router.getRoute(query_response.response.uri, 'webSocket') as slim.server.HttpRouterInterfaces.WebSocketRoute;
                    if(route) {
                        console.debug({message:"route",value:"found"}, route);
                        if('serverStartTime' in query_response.response.message) {
                            console.debug({message:"processing",value:"serverStartTime"}, route);
                            let initialOnly:boolean = false;
                            if('initialResponse' in query_response.response) {
                                initialOnly = query_response.response.initialResponse;
                            }
                            console.trace({message:"calling",value:"sendMessageToWebSocketClient"}, query_response);
                            this.sendMessageToWebSocketClient(route, query_response.response.message, initialOnly);
                        }
                        else if('refresh' in query_response.response.message) {
                            if('routes' in query_response.response.message.refresh) {
                                const routes_to_refresh:slim.server.HttpRouterInterfaces.HttpRoute[] = [];
                                for await (const r of query_response.response.message.refresh.routes) {
                                    console.debug({message:"preparing",value:"refresh"}, r);
                                    const route_to_refresh:slim.server.HttpRouterInterfaces.HttpRoute|undefined
                                        = this.router.getRoute(r.uri, 'http') as slim.server.HttpRouterInterfaces.HttpRoute;
                                    if(route_to_refresh) console.debug({message:"found", value:"route"}, route_to_refresh);
                                    if(route_to_refresh) routes_to_refresh.push(route_to_refresh);
                                }
                                if(routes_to_refresh.length > 0) {
                                    console.trace({message:"calling",value:"sendMessageToWebSocketClient"}, routes_to_refresh);
                                    this.sendMessageToWebSocketClient(route, {refresh:routes_to_refresh});
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/* public async watch(paths:string[], recursive:boolean=true) {
    if(paths.length < 1) {
        throw new Error("An array with atleast 1 string expected");
    }
    for await(const event of Deno.watchFs(paths, {recursive:recursive})) {
        if(event.kind == 'modify' && ['.ts','.json'].includes(event.paths[0].substring(event.paths[0].lastIndexOf('.')))) {
            console.error();
        }
        else if(event.kind == 'modify' && event.paths[0].endsWith('.html')) {
            const refreshable_url:string|undefined = this.reversePathMappings.get(await slim.utilities.get_normalized_url(event.paths[0]));
            const normalized_url:string|undefined = await slim.utilities.get_normalized_url(event.paths[0]);
            console.debug({message:"updating",value:"file"}, normalized_url);

            if(refreshable_url && !this.fsEventDebounce.has(refreshable_url)) {
                this.fsEventDebounce.add(refreshable_url);
                const recompiled_files:string[] = await this.view.recompile(refreshable_url!);
                recompiled_files.forEach((file:string) => {
                    updateWebSocketClients(file);
                });
                setTimeout(function() { this.fsEventDebounce.delete(refreshable_url); }, 1000);
            }
            else if(refreshable_url) {
                this.fsEventDebounce.delete(refreshable_url);
            }
            else if(normalized_url && !this.fsEventDebounce.has(normalized_url)) {
                this.fsEventDebounce.add(normalized_url);
                const dependent_files_recompiled:string[] = await this.view.recompile(normalized_url);
                dependent_files_recompiled.forEach((file:string) => {
                    const file_map:string|undefined = this.reversePathMappings.get(file);
                    if(file_map) {
                        updateWebSocketClients(file_map);
                    }
                });
                setTimeout(function() { this.fsEventDebounce.delete(normalized_url); }, 1000);
            }
            else if(normalized_url && this.fsEventDebounce.has(normalized_url)) {
                this.fsEventDebounce.delete(normalized_url);
            }
        }
    }
} */