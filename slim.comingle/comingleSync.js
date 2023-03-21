export function comingleSync(input_sources, options) {
    if (input_sources.length < 2) {
        throw new Error("comingle requires an array of 2 or more slim.types.iKeyValueAny objects");
    }
    const sources = JSON.parse(JSON.stringify(input_sources));
    const merged_objects = sources.shift() || {};
    for (const key in merged_objects) {
        if (typeof options == 'object') {
            if (Array.isArray(options['skip']) && options['skip'].includes(key)) {
                delete merged_objects[key];
            }
            if (Array.isArray(options['excludes']) && options['excludes'].includes(typeof key)) {
                delete merged_objects[key];
            }
        }
    }
    for (let source of sources) {
        for (const key in source) {
            if (typeof source[key] == 'string' || typeof source[key] == 'number' || typeof source[key] == 'boolean') {
                let continue_comingle = true;
                if (typeof options == 'object') {
                    if (Array.isArray(options['skip']) && options['skip'].includes(key)) {
                        continue_comingle = false;
                    }
                }
                if (continue_comingle) {
                    merged_objects[key] = source[key];
                }
            }
            else if (Array.isArray(source[key])) {
                if (typeof merged_objects[key] == 'undefined') {
                    merged_objects[key] = source[key];
                }
                else if (Array.isArray(merged_objects[key])) {
                    for (const member of source[key]) {
                        let lvalue_exists = false;
                        for (const index in merged_objects[key]) {
                            if (merged_objects[key][index] == member) {
                                lvalue_exists = true;
                                merged_objects[key][index] == member;
                            }
                        }
                        if (!lvalue_exists) {
                            merged_objects[key].push(member);
                        }
                    }
                }
            }
            else if (typeof source[key] == 'object') {
                let continue_comingle = true;
                if (typeof options == 'object') {
                    if ((Array.isArray(options['skip']) && options['skip'].includes(key)) || (Array.isArray(options['excludes']) && options['excludes'].includes('object'))) {
                        continue_comingle = false;
                    }
                    else if (Number.isInteger(options['depth'])) {
                        if (options['depth'] == 1) {
                            merged_objects[key] = "[object]";
                            continue_comingle = false;
                        }
                        else {
                            if (options['depth'] > 0) {
                                --options['depth'];
                            }
                        }
                    }
                }
                if (continue_comingle) {
                    if (typeof merged_objects[key] == 'undefined') {
                        merged_objects[key] = {};
                    }
                    merged_objects[key] = comingleSync([merged_objects[key], source[key]], options);
                }
            }
        }
    }
    return merged_objects;
}
