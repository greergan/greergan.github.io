import * as slim from "./slim_modules.js";
export class ControlPanel {
    #serverSocket;
    #reconnectRetriesCount = 0;
    #reconnectRetries = 10;
    #appUri = '/SLIM_GENERATOR_ADMIN';
    #projects = new Map();
    #projectsTree;
    #routesTree;
    #viewTree;
    #reverseMappingsTree;
    constructor() {
        console.log("ControlPanel::new");
        document.getElementById("current_time").innerHTML = this.#timeString(new Date());
        setInterval(() => { document.getElementById("current_time").innerHTML = this.#timeString(new Date())}, 5000);
        this.#connectToWebSocketServer();
        this.#startRetryTimer();
        this.#projectsTree = new slim.ui.Tree({label:'Projects',id:'projects-list',anchor:'projects-tree-anchor',display:true,
            classes: {tree:'projects-tree',folded:'projects-tree-plus',expanded:'projects-tree-minus',child_text:'left-menu-text'}});
        this.#routesTree = new slim.ui.Tree({label:'Routes',id:'routes-list',anchor:'routes-tree-anchor',display:true,
            classes: {tree:'routes-tree',folded:'routes-tree-plus',expanded:'routes-tree-minus',child_text:'left-menu-text'}});
        this.#viewTree = new slim.ui.Tree({label:'View data',id:'view-list',anchor:'view-tree-anchor',display:true,
            classes: {tree:'view-tree',folded:'view-tree-plus',expanded:'view-tree-minus',child_text:'left-menu-text'}});
        this.#reverseMappingsTree = new slim.ui.Tree({label:'Reverse mappings',id:'reverse-mappings-list',anchor:'reverse-mappings-tree-anchor',display:true,
            classes: {tree:'reverse-mappings-tree',folded:'reverse-mappings-tree-plus',expanded:'reverse-mappings-tree-minus',child_text:'left-menu-text'}});
        slim.utilities.addEventListener('projects-tree-anchor', 'click', this.#projectsQueryEventFunction);
        slim.utilities.addEventListener('reverse-mappings-tree-anchor', 'click', this.#reverseMappingsQueryEventFunction);
        //https://stackoverflow.com/questions/7914684/trigger-right-click-using-pure-javascript
    }
    #projectQueryEventFunction  = (event) => {
        const id = event.target.id.indexOf('-') > 0 ? event.target.id.substring(0, event.target.id.indexOf('-')) : event.target.id;
        if(id && !this.#projects.has(id)) {
            this.#query({query:{project:id}});
        }
    }
    #projectsQueryEventFunction = (event) => {
        //console.log("#projectsQueryEventFunction")
        this.#query({query:{projects:{list:true}}})
    };
    #reverseMappingsQueryEventFunction  = (event) => {
        this.#query({query:{get_reverse_mappings:{list:true}}});
        //slim.utilities.removeEventListener('reverse-mappings-tree-anchor', 'click', this.#reverseMappingsQueryEventFunction);
    }
    #startRetryTimer() {
        const reconnectCount = setInterval(() => {
            if(this.#serverSocket.readyState > 1) {
                if(this.#reconnectRetriesCount === this.#reconnectRetries) {
                    document.getElementById("server_start_time").innerHTML = `<button onclick="${this.#connectToWebSocketServer()}">Reconnect</button>`;
                    clearInterval(reconnectCount);
                }
                else {
                    this.#reconnectRetriesCount++;
                    document.getElementById("server_start_time").innerHTML = `<span class="retryCount">Reconnect Attempt: ${this.#reconnectRetriesCount}</span>`;
                    this.#connectToWebSocketServer();
                }
            }
        }, 2000);
    }
    #connectToWebSocketServer() {
        //console.log("ControlPanel::#connectToWebSocketServer");
        this.#serverSocket = new WebSocket(window.location.toString().startsWith('https')
            ? window.location.toString().replace("https", "wss")
            : window.location.toString().replace("http", "wss")
        );
        this.#serverSocket.onclose   = this.#onWebSocketClose;
        this.#serverSocket.onerror   = this.#onWebSocketError;
        this.#serverSocket.onmessage = this.#onWebSocketMessage;
        this.#serverSocket.onopen    = this.#onWebSocketOpen;
    }
    #onWebSocketClose = (event) => {
        console.debug("ControlPanel::#onWebSocketClose ");
    }
    #onWebSocketError = (event) => {
        console.error("ControlPanel::#onWebSocketError ", event);
    }
    #onWebSocketMessage = (event) => {
        //console.debug("ControlPanel::#onWebSocketMessage ");
        document.getElementById("last_updated_time").innerHTML = this.#timeString(new Date());
        if(typeof event.data === 'string') {
            this.#handleData(JSON.parse(event.data));
        }
    }
    #onWebSocketOpen = (event) => { 
        //console.debug("ControlPanel::#onWebSocketOpen")
        document.getElementById("connected_time").innerHTML = this.#timeString(new Date());
        this.#reconnectRetriesCount = 0;
    };
    async #handleRefresh(refresh) {
        //console.debug("ControlPanel::#handleData refresh");
        for(const route of refresh) {
            let refreshable_url;
            if('url' in route) {
                refreshable_url = new URL(route.url);
            }
            else if(route.uri == this.#appUri) {
                refreshable_url = new URL(window.location.href);
            }
            else {
                console.debug(route);
                console.debug(window.location);
                alert('need to code this case');
            }
            if(refreshable_url) {
                refreshable_url.protocol = window.location.protocol;
                if(refreshable_url.pathname.startsWith(this.#appUri)) {
                    if(refreshable_url.href == window.location.href || refreshable_url.pathname.endsWith('.js')) location.reload();
                    else if(refreshable_url.pathname.endsWith('.css')) {
                        const css_file_contents = await fetch(refreshable_url).then(contents => contents.text()).catch((err) => console.error(err) && alert('error fetching css'));
                        if(css_file_contents) {
                            let stylesheet = new CSSStyleSheet();
                            stylesheet.replace(css_file_contents);
                            document.adoptedStyleSheets = [stylesheet];
                        }
                    }
                }
                else {
                    window.open(refreshable_url, refreshable_url);
                }
            }
        }
    }
    async #handleData(data) {
        console.debug("ControlPanel::#handleData", data)
        if('add_route' in data) {
            if('response' in data.add_route && 'page_label_id' in data) {
                data.add_route.response == 201
                    ? document.getElementById(data.page_label_id).classList.add('green')
                    : document.getElementById(data.page_label_id).classList.add('red');
            }
        }
        if('add_view' in data) {
            if('response' in data.add_view && 'project_label_id' in data) {
                if(data.add_view.response == 201) {
                    document.getElementById(data.project_label_id).classList.add('green');
                }
                else if(data.add_view.response == 409) {
                    document.getElementById(data.project_label_id).classList.add('yellow');
                }
                else {
                    document.getElementById(data.project_label_id).classList.add('red');
                }
            }
        }
        if('get_reverse_mappings' in data) {
            console.debug("ControlPanel::#handleData::get_routes", data)
/*             if('response' in data.get_reverse_mappings) {
                if(data.get_routes.response == 200) {
                    document.getElementById('routes-list-span').classList.add('green');
                    this.#handleGetRoutesResponse(data);
                }
                else {
                    document.getElementById('routes-list-span').classList.add('red');
                }
            } */
        }
        if('get_routes' in data) {
            //console.debug("ControlPanel::#handleData::get_routes", data)
            if('response' in data.get_routes) {
                if(data.get_routes.response == 200) {
                    document.getElementById('routes-list-span').classList.add('green');
                    this.#handleGetRoutesResponse(data);
                }
                else {
                    document.getElementById('routes-list-span').classList.add('red');
                }
            }
        }
        if('get_view' in data) {
            //console.debug("ControlPanel::#handleData", data)
            if('response' in data.get_view) {
                if(data.get_view.response == 200) {
                    if('view' in data && 'raw_views' in data.view && 'compiled_views' in data.view && 'dependent_views' in data.view && 'namespace' in data) {
                        //console.debug("ControlPanel::#handleData", data)
                        this.#viewTree.insertChildTree({label:'Compiled views',id:'compiled-views',parent:this.#viewTree.id});
                        this.#viewTree.insertChildTree({label:'Dependent views',id:'dependent-views',parent:this.#viewTree.id});
                        this.#viewTree.insertChildTree({label:'Raw views',id:'raw-views',parent:this.#viewTree.id});
                        for(const view of data.view.compiled_views) {
                            this.#viewTree.insertChildTree({label:view.url.substring(data.view.namespace.length),id:`${data.namespace}-compiled-${view.url}`,parent:'compiled-views',
                                children:[
                                    {
                                        type:'element',element:
                                        await slim.ui.html.create_div({style:'display:none',classes:['text'],
                                            append_objects: [
                                                await slim.ui.html.create_span({text:`Time updated: `, classes:['label','left-menu-text']}),
                                                await slim.ui.html.create_span({text:`${this.#timeString(view.time)}`, classes:['text']})
                                            ]
                                        })
                                    },
                                    {
                                        type:'element', element: await slim.ui.html.create_div({style:'display:none;white-space:pre-wrap;',
                                        text:view.view,classes:['left-menu-text','text']})
                                    }
                                ]
                            })
                        }
                        for(const view of data.view.dependent_views) {
                            const children = [];
                            for(const dview of view.dependent_urls) {
                                children.push({type:'element',element:await slim.ui.html.create_div({text:dview.substring(data.view.namespace.length),classes:['left-menu-text', 'text'],style:'display:none;'})});
                            }
                            this.#viewTree.insertChildTree({label:view.url.substring(data.view.namespace.length),id:`${data.namespace}-dependent-${view.url}`,parent:'dependent-views',classes:['label'],children:children});
                        }
                        for(const view of data.view.raw_views) {
                            this.#viewTree.insertChildTree({label:view.url.substring(data.view.namespace.length),id:`${data.namespace}-raw-${view.url}`,parent:'raw-views',
                                children:[
                                    {type:'element',element:
                                        await slim.ui.html.create_div({style:'display:none',classes:['text'],
                                            append_objects: [
                                                await slim.ui.html.create_span({text:`Time updated: `, classes:['label','left-menu-text']}),
                                                await slim.ui.html.create_span({text:`${this.#timeString(view.time)}`, classes:['text']})
                                            ]
                                        })
                                    },
                                    {type:'element', element: await slim.ui.html.create_div({style:'display:none;white-space:pre-wrap;',text:view.view,classes:['left-menu-text','text']})}
                                ]
                            })
                        }
                    }
                }
            }
        }
        if('refresh' in data) {
            await this.#handleRefresh(data.refresh);
        }
        if('serverStartTime' in data) {
            document.getElementById("server_start_time").innerHTML = this.#timeString(data.serverStartTime);
        }
        if('query' in data) {
            if('response' in data.query) {
                await this.#handlQueryResponse(data.query.response);
            }
        }
        if('unknown' in data) {
            console.warn(data);
        }
    }
    async #buildRouteTable(route) {
        return await slim.ui.html.create_table({style:'display:none', classes: ['table-routes'],
            append_objects:[
                await slim.ui.html.creat_tr({
                    append_objects: [
                        await slim.ui.html.create_td({text:'Hits', classes:['label']}),
                        await slim.ui.html.create_td({text:route.hits, classes:['text']}),
                    ]
                }),
                await slim.ui.html.creat_tr({
                    append_objects: [
                        await slim.ui.html.create_td({text:'Protocol', classes:['label']}),
                        await slim.ui.html.create_td({text:route.protocol, 'data-text':'http or websocket', classes:['text','tooltip']}),
                    ]
                }),
                await slim.ui.html.creat_tr({
                    append_objects: [
                        await slim.ui.html.create_td({text:'Discovered', classes:['label']}),
                        await slim.ui.html.create_td({text:route.discovered, 'data-text':'true or false or generated', classes:['text','tooltip']})
                    ]
                }),
                await slim.ui.html.creat_tr({
                    append_objects: [
                        await slim.ui.html.create_td({text:'Resolver', classes:['label']}),
                        await slim.ui.html.create_td({text: route.resolver, style:'white-space: pre-wrap;', 'data-text':'File on disk or Javascript function', classes:['text','tooltip']})
                    ]
                }),
                await slim.ui.html.creat_tr({
                    append_objects: [
                        route.url ? await slim.ui.html.create_td({text:'URL', classes:['label']}) : await slim.ui.html.create_empty(),
                        route.url ? await slim.ui.html.create_td({
                            append_objects:[ 
                                await slim.ui.html.create_a({href:`${route.url}`,target:route.uri,text:route.url, 'data-text': 'Click to open in new window', classes:['text','tooltip']})
                            ]
                        }) : await slim.ui.html.create_empty()
                    ]
                }),
                (await slim.ui.html.creat_tr({
                    append_objects: [
                        route.rootDirectory ? await slim.ui.html.create_td({text:'Root directory', classes:['label']}) : await slim.ui.html.create_empty(),
                        route.rootDirectory ? await slim.ui.html.create_td({text:route.rootDirectory, classes:['text']}) : await slim.ui.html.create_empty()
                    ]
                }))
            ]
        })
    }
    async #handleGetRoutesResponse(response) {
        //console.debug("ControlPanel::#handleGetRoutesResponse", response.routes[0]);
        if('routes' in response) {
            for await(const route of response.routes.sort()) {
                this.#routesTree.insertChildTree({label:route.uri,id:route.uri,parent:this.#routesTree.id,children:[{type:'element', element:await this.#buildRouteTable(route)}]});
            }
        }
    }
    async #handleProjectQueryResponse(response) {
        //console.debug("ControlPanel::#handleProjectQueryResponse", response);
        if('project' in response && 'configuration' in response && 'namespace' in response.configuration) {
            this.#projects.set(response.project);
            this.#query({add_view: {namespace:response.configuration.namespace},project_label_id:`${response.project}-span`});
            slim.utilities.removeEventListener(`${response.project}-parent`, 'click', this.#projectQueryEventFunction);
            const configuration = response.configuration;
            this.#projectsTree.insertChildTree({label:'Namespace',id:`${response.project}-namespace`,parent:response.project,display:true,children:[{text:configuration.namespace}]});
            this.#projectsTree.insertChildTree({label:'Output directory',id:`${response.project}-output-directory`,parent:response.project,display:true,children:[{text:configuration.output_to}]});
            this.#projectsTree.insertChildTree({label:'Generate IDs',id:`${response.project}-generate-ids`,parent:response.project,display:true,children:[{text:configuration.generate_ids}]});
            this.#projectsTree.insertChildTree({label:'Meta-tags',id:`${response.project}-project-meta-tags`,parent:response.project,display:true,children:[{text:configuration.meta_tags}]});
            this.#projectsTree.insertChildTree({label:'Models',id:`${response.project}-project-models`,parent:response.project,display:true,children:[{text:configuration.models}]});
            this.#projectsTree.insertChildTree({label:'External models',id:`${response.project}-project-external-models`,parent:response.project,display:true,children:[{text:configuration.external_models}]});
            this.#projectsTree.insertChildTree({label:'Pages',id:`${response.project}-project-pages`,parent:response.project,display:true});
            let page_index = 0;
            for await(const page of configuration.pages) {
                page_index++;
                const page_id = `${response.project}-page-${page_index}`;
                this.#projectsTree.insertChildTree({label:page.title,id:page_id,parent:`${response.project}-project-pages`});
                this.#projectsTree.insertChildTree({label:'Input file',id:`${page_id}-input-file`,parent:page_id,children:[{text:page.input_file}]});
                this.#projectsTree.insertChildTree({label:'Output file',id:`${page_id}-output-file`,parent:page_id,children:[{text:page.output_file}]});
                this.#projectsTree.insertChildTree({label:'Generate ID',id:`${page_id}-generate-id`,parent:page_id,children:[{text:page.generate_id}]});
                this.#projectsTree.insertChildTree({label:'Meta-tags',id:`${page_id}-meta-tags`,parent:page_id,children:[{text:page.meta_tags}]});
                this.#projectsTree.insertChildTree({label:'Models',id:`${page_id}-models`,parent:page_id,children:[{text:page.models}]});
                this.#projectsTree.insertChildTree({label:'External models',id:`${page_id}-external-models`,parent:page_id,children:[{text:page.external_models}]});
                // possibly adding 2 routes, one with an express index.html URI and one with only a slash URI
                console.debug(page);
                console.debug(configuration);
                if(page.output_file.endsWith('index.html')) {
                    let slash_uri = page.output_file.substring(0, page.output_file.lastIndexOf('index.html'));
                    if(!slash_uri.startsWith('/')) {
                        slash_uri = `/${slash_uri}`;
                    }
                    const url = `${location.origin}${slash_uri}`;
                    this.#query({add_route: {url:url,uri:slash_uri,input_file:page.input_file, namespace:configuration.namespace}, page_label_id:`${page_id}-span`});
                    fetch(slash_uri);                
                }
                let slash_uri = page.output_file.startsWith('/') ? page.output_file : `/${page.output_file}`;
                const url = `${location.origin}${slash_uri}`;
                this.#query({add_route: {url:url,uri:slash_uri,input_file:page.input_file, namespace:configuration.namespace}, page_label_id:`${page_id}-span`});
            }
            this.#query({get_view:{namespace:configuration.namespace},get_routes:{protocol:'http'},project:response.project});
        }
    }
    async #handleProjectsQueryResponse(projects) {
        //console.debug("ControlPanel::#handleProjectsQueryResponse", projects);
        slim.utilities.removeEventListener('projects-tree-anchor', 'click', this.#projectsQueryEventFunction);
        for await (const project of projects) {
            this.#projectsTree.insertChildTree({label:project,id:project,parent:'projects-list',display:true,parent_onclick:this.#projectQueryEventFunction});
        }
        const projects_list_span = document.getElementById('projects-list-span');
        projects_list_span.textContent = `${projects_list_span.textContent} (${projects.length})`;
        projects_list_span.classList.add('green');

    }
    async #handleReverseMappingsQueryResponse(reverse_mappings) {
        //console.debug("ControlPanel::#handleReverseMappingsQueryResponse", reverse_mappings);
        for await (const mapping of reverse_mappings) {
            this.#reverseMappingsTree.insertChildTree({label:mapping.file,id:mapping.file,parent:'reverse-mappings-list',classes:['label'],
                display:true,children:[{text:mapping.uri,classes:['text']}]});
        }
        const reverse_mappings_list_span = document.getElementById('reverse-mappings-list-span');
        reverse_mappings_list_span.textContent = `${reverse_mappings_list_span.textContent} (${reverse_mappings.length})`;
        reverse_mappings_list_span.classList.add('green');
    }
    async #handlQueryResponse(response) {
        //console.debug("ControlPanel::#handlQueryResponse", response);
        if('projects' in response) {
            await this.#handleProjectsQueryResponse(response.projects);
        }
        if('project' in response && 'configuration' in response) {
            await this.#handleProjectQueryResponse(response);
        }
        if('reverse_mappings' in response) {
            await this.#handleReverseMappingsQueryResponse(response.reverse_mappings);
        }
    }
    #timeString = (time_stamp) => {
        const date = new Date(time_stamp);
        return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
    }
    #query(query) {
        //console.debug(query);
        query.uri = this.#appUri;
        this.#serverSocket.send(JSON.stringify(query));
    }
}
