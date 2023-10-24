#!/usr/bin/env -S deno run --allow-env -r --check 
//deno run --allow-all -r --check generate.ts -c http://192.168.122.59/configurations/website.json
import * as slim from "./slim_modules.ts";
import { check_config, explode_models, populate_model, is_valid_output_namespace, parse_command_line, set_input_output } from "./index.ts";
try {
    window.SlimConsole = new slim.colorconsole.SlimColorConsole(await slim.utilities.get_json_contents("http://192.168.122.59/configurations/console/default.json"));
    console.clear();
    console.info({message:"awaiting parse_command_line"}, Deno.args);
    const parsed_command_line:slim.types.iKeyValueAny = await parse_command_line(Deno.args);
    console.info({message:"awaiting get config_file"}, parsed_command_line.config_file);
    const config:slim.types.iKeyValueAny|undefined = await slim.utilities.get_json_contents(parsed_command_line.config_file);
    if(!config) {
        console.error({message:"valid configuration file not found"});
    }
    if(!(await check_config(config!))) {
        console.error({message:"check_config","value":"failed"});
    }
    const namespace:string|undefined = await slim.utilities.get_normalized_url(config!.namespace);
    const output_to:string|undefined = await slim.utilities.get_normalized_url(config!.output_to);
    if(namespace === undefined) {
        console.error({message:"namespace","value":"undefined"});
    }
    if(output_to === undefined) {
        console.error({message:"output_to","value":"undefined"});
    }

    // Is this needed?
    await is_valid_output_namespace(output_to!, namespace!);

    const view:slim.view.SlimView = new slim.view.SlimView(namespace!);
    console.info({message:"Beginning page generation"});
    console.debug({message:"config.generate_ids",value:config!.generate_ids});
    console.debug({message:"parsed_command_line.generate_id",value:parsed_command_line.generate_id});
    for(const page of config!.pages) {
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
        if('generate_all' in config! && config.generate_all == true) {
            continue_processing = true;
        }
        if(continue_processing) {
            console.info({message:"Generating output",value:"page"}, page.title, `page.generate_id => ${page.generate_id}`);
            let exploaded_models:slim.types.iKeyValueAny = {};
            if('external_models' in page) {
                if(!Array.isArray(page.external_models)) {
                    console.error({message:"page level property",value:"external_models not an Array"}, page.title);
                }
                else {
                    exploaded_models = await explode_models(page.external_models, namespace!);
                    delete page.external_models;
                }
            }
            let model = slim.utilities.comingleSync([{}, {page:page,site:config!.site}]);
            model.page = slim.utilities.comingleSync([model.page, exploaded_models]);
            //model.page =  populate_model(page, site);
            console.debug({message:"model", value: "page"}, model.page);
            const input_output:slim.types.iKeyValueAny = await set_input_output(model.page, output_to!, namespace!);
            const html_string:string = await view.render(model, input_output.input_file);
            console.debug({ message:"rendered",value:"page size"}, html_string.length);
            await slim.utilities.write_output(input_output.output_file, html_string);
            console.info({ message:"wrote",value:"to output file"}, {SLIMOVERRIDES:{debug:{suppress:false},path:{suppress:true}}}, input_output.output_file);
        }
    }
}
catch(e) {
    console.error({message:"caught unhandled error",value:e.stack});
}
