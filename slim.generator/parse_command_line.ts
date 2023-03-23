import * as slim from "./slim_modules.ts";
export async function parse_command_line(command_line:string[]): Promise<slim.types.iKeyValueAny> {
    console.debug({message:"commencing",value:"arguments"}, command_line);
    let parsed_command_line:slim.types.iKeyValueAny = {};
    const set_next = {
        "config": false,
        "generate_id": false
    };
    for await(const arg of command_line) {
        if(set_next.config) {
            if(parsed_command_line.config_file === undefined) {
                if(!arg.startsWith("-")) {
                    parsed_command_line.config_file = await slim.utilities.get_normalized_url(arg);
                }
            }
            else {
                SlimConsole.abort("config_file already configured");
            }
            set_next.config = false;
        }
        else if(set_next.generate_id) {
            if(parsed_command_line.generate_id === undefined) {
                const id:number = Number(arg);
                if(!isNaN(id)) {
                    parsed_command_line.generate_id = id;
                }
                else {
                    SlimConsole.abort("--generate_id | -id must be a number");
                }
            }
            else {
                SlimConsole.abort("generate_id already configured");
            }
            set_next.generate_id = false;
        }
        else if(arg == "--config" || arg == "-c") {
            set_next.config = true;
        }
        else if(arg == "--generate_id" || arg == "-id") {
            set_next.generate_id = true;
        }
    }
    if(!('config_file' in parsed_command_line)) {
        throw new Error("--config or -c command line option is required with valid configuration file path");
    }
    SlimConsole.todo("clean up");
    console.trace({message:"succeeded",value:"returning"}, parsed_command_line);
    return parsed_command_line;
}