//import { SlimView } from "https://greergan.github.io/slim.view/mod.ts";
import { SlimView, check_config, get_namespace, get_output_to, merge_json, explode_models, set_input_output, write_output, trace, debug, SlimTypes } from "./mod.ts";

for await(const arg of Deno.args) {
    new debug({message: "deno args"}, arg)
}

//Deno.exit(1);

new trace({message:"Getting assets..."});
const config_string:string = await (await fetch('file:///home/greergan/mnt/host/src/slim.website/models/website.json')).text();
const config = JSON.parse(config_string);
await check_config(config);
const namespace:string = await get_namespace(config.namespace);
const output_to:string = await get_output_to(config.output_to, namespace);
const view:SlimView = new SlimView(namespace);
for(let page of config.pages) {
    const exploaded_models = await explode_models(page.external_models, namespace);
    let model = await merge_json({title:""}, page, config.site, exploaded_models);
    model = {page:model};
    model = await merge_json(model, exploaded_models);
    new trace({message:"Generating output for"}, model.page.title);
    const input_output:SlimTypes.KeyValueAny = await set_input_output(model.page, namespace, output_to);
    const results = await view.render(model, input_output.input_file);
    await write_output(input_output.output_file, results);
}
