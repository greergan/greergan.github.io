import { comingleSync } from "./comingleSync.js"

const json1 = {
    first_name: "Arthur",
    passions: {
        first: "life",
        last: "writing"
    }
};
const json2 = {
    middle_name: "Conan",
    recurse: {
        text:"recurse level",
        one: {
            text: "first level",
            two: {
                text: "second level",
                three: {
                    text: "third level"
                }
            }
        }
    }
};
const json3 = {
    last_name: "Doyle"
};

let merged_object = comingleSync([json1, json2, json3, {options:"none"}]);
console.dir(merged_object);

merged_object = comingleSync([json1, json2, json3, {options: "depth: 2, skip:['middle_name']"}], {depth: 2, skip:['middle_name']});
console.dir(merged_object);

merged_object = comingleSync([json1, json2, json3, {options: "excludes:['object']"}], {excludes:['object']});
console.dir(merged_object);

merged_object = comingleSync([json1, json2, json3, {options: "skip:['first_name', 'last_name']"}], {skip:['first_name', 'last_name']});
console.dir(merged_object);