#!/usr/bin/env -S deno run --allow-env -r --check 
//deno run --allow-env -r --check generate.ts -c http://192.168.122.59/models/website.json
import * as slim from "./slim_modules.ts";
import { check_config, explode_models, is_valid_output_namespace, parse_command_line, set_input_output } from "./index.ts";
window.SlimConsole = new slim.colorconsole.SlimColorConsole(await slim.utilities.get_file_contents("http://192.168.122.59/models/console_colors.json"));
SlimConsole.configurations.trace.stackTrace.suppress = true;
SlimConsole.info({message:"awaiting parse_command_line"}, Deno.args);
const parsed_command_line:slim.types.iKeyValueAny = await parse_command_line(Deno.args);
SlimConsole.info({message:"awaiting get config_file"}, parsed_command_line.config_file);
const config:slim.types.iKeyValueAny|undefined = await slim.utilities.get_file_contents(parsed_command_line.config_file);
if(config === undefined) {
    SlimConsole.abort({message:"configuration file not found"});
}
if(!(await check_config(config!))) {
    SlimConsole.abort({message:"check_config","value":"failed"});
}
const namespace:string|undefined = await slim.utilities.get_normalized_url(config!.namespace);
const output_to:string|undefined = await slim.utilities.get_normalized_url(config!.output_to);
if(namespace === undefined) {
    SlimConsole.abort({message:"namespace","value":"undefined"});   
}
if(output_to === undefined) {
    SlimConsole.abort({message:"output_to","value":"undefined"});   
}

// Is this needed?
await is_valid_output_namespace(output_to!, namespace!);

const view:slim.view.SlimView = new slim.view.SlimView(namespace!);
SlimConsole.info({message:"Beginning page generation"});
for(let page of config!.pages) {
}
/*
for(let page of config.pages) {
    if(!isNaN(parsed_command_line.generate_id) && !isNaN(page.generate_id) && parsed_command_line.generate_id == page.generate_id) {
        let exploaded_models:KeyValueAny[] = [];
        if(page.external_models !== undefined) {
            exploaded_models = await explode_models(page.external_models, namespace);
        }
        let model = await comingle({title:""}, page, config.site, exploaded_models);
        model = {page:model};
        model = await comingle(model, exploaded_models);
        new trace({message:"Generating output for"}, model.page.title);
        const input_output:KeyValueAny = await set_input_output(model.page, output_to, namespace);
        new debug(input_output.input_file)
        const results = await view.render(model, input_output.input_file);
        await write_output(input_output.output_file, results);
    }
}
*/