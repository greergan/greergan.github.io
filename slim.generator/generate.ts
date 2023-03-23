#!/usr/bin/env -S deno run --allow-env -r --check 
//deno run --allow-env -r --check generate.ts -c http://192.168.122.59/models/website.json
import * as slim from "./slim_modules.ts";
import { check_config, explode_models, is_valid_output_namespace, parse_command_line, set_input_output } from "./index.ts";
try {
    window.SlimConsole = new slim.colorconsole.SlimColorConsole(await slim.utilities.get_file_contents("http://192.168.122.59/models/console_colors.json"));
    SlimConsole.configurations.trace.stackTrace.suppress = true;
    console.info({message:"awaiting parse_command_line"}, Deno.args);
    const parsed_command_line:slim.types.iKeyValueAny = await parse_command_line(Deno.args);
    console.info({message:"awaiting get config_file"}, parsed_command_line.config_file);
    const config:slim.types.iKeyValueAny|undefined = await slim.utilities.get_file_contents(parsed_command_line.config_file);
    if(config === undefined) {
        SlimConsole.abort({message:"valid configuration file not found"});
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
    console.info({message:"Beginning page generation"});
    console.debug({message:"config.generate_ids",value:config!.generate_ids});
    console.debug({message:"parsed_command_line.generate_id",value:parsed_command_line.generate_id});
    for(let page of config!.pages) {
        let continue_processing = true;
        if('generate_id' in page) {
            if('generate_ids' in config!) {
                if(!config!.generate_ids.includes(page.generate_id)) {
                    continue_processing = false;
                }
            }
            if('generate_id' in parsed_command_line && page.generate_id != parsed_command_line.generate_id) {
                continue_processing = false;
            }
        }
        if(continue_processing) {
            console.info({message:"Generating output for",value:page.title}, `page.generate_id => ${page.generate_id}`);
            let exploaded_models:slim.types.iKeyValueAny[] = [];
            if(page.external_models !== undefined) {
                if(!Array.isArray(page.external_models)) {
                    SlimConsole.abort({message:"page level property",value:"external_models not an Array"}, page.title);
                }
                else {
                    exploaded_models = await explode_models(page.external_models, namespace!);
                    delete page.external_models;
                }
            }
            let model = slim.utilities.comingleSync([{title:""}, page, config!.site, ...exploaded_models], {depth:1});
            console.debug({ message:"comingled model"}, model);
            
        }
        else {
            console.debug({message:"ending page processing",value:"page.generate_id is excluded"}, page.generate_id);
        }
    }
}
catch(e) {
    SlimConsole.abort(e.stack);
}
/*
        
        model = {page:model};
        model = await comingle(model, exploaded_models);
        new trace({message:"Generating output for"}, model.page.title);
        const input_output:KeyValueAny = await set_input_output(model.page, output_to, namespace);
        new debug(input_output.input_file)
        const results = await view.render(model, input_output.input_file);
        await write_output(input_output.output_file, results);
*/