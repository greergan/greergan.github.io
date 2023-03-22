import * as slim from "./slim_modules.ts";
export async function explode_models(models_array:Array<slim.types.iKeyValueAny>, namespace:string): Promise<slim.types.iKeyValueAny[]> {
    if(typeof models_array == 'undefined') {
        SlimConsole.abort("page level property external_models is not found");
    }
    let exploded_models:slim.types.iKeyValueAny[] = [];
    for await(const model of models_array) {
        const input_file:string = (slim.utilities.is_valid_url(model.path)) ? model.path: `${namespace}/${model.path}`;
        try {
            exploded_models = slim.utilities.comingleSync(exploded_models, JSON.parse(await (await fetch(input_file)).text())) as [];
        }
        catch(e) {
            SlimConsole.abort({message:"aborting explode_models"}, e);
        }
    }
    SlimConsole.trace({message: "exploded_models.length"}, exploded_models.length);
    return exploded_models;
}
export async function set_input_output(config:slim.types.iKeyValueAny, output_to:string, namespace:string): Promise<slim.types.iKeyValueAny> {
    if(config.input_file === 'undefined' || config.input_file === "") {
        SlimConsole.abort({message: "set_input_output"}, "input_file property not found");
    }
    const input_output:slim.types.iKeyValueAny = {
        input_file:`${namespace}/${config.input_file}`,
        output_file:`${output_to}/${config.output_file}`
    }
    /*
    new todo({message:"enhancement",value:"check into addings defaults when property is empty or non-existant"});
    new todo({message:"enhancement",value:"add better and more error checking and path/file existance"});
    new todo({message:"documentation",value:"add documentation prior to release"});
    new todo({message:"documentation",value:"add copyright notice prior to release"});
    */
    SlimConsole.todo({message:"clean up"});
    SlimConsole.trace(input_output);
    return input_output;
}
export async function write_output(output_file:string, content:string) {
    const file = slim.utilities.get_absolute_file_path(output_file);
    if(file !== undefined && file.length > 1) {
        try {
            Deno.mkdirSync(file.substring(0, file.lastIndexOf("/")), { recursive: true });
            Deno.writeTextFileSync(file, content);
        }
        catch(e) {
            SlimConsole.abort({message:"write_output"}, e);
        }
    }
    else {
        SlimConsole.abort({message: "not a valid file url"}, output_file);
    }
    SlimConsole.trace();
}