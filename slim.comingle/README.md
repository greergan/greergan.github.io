# slim.utilities
A set of reusable Typescript functions for the Slim platform

## slim.comingle

A synchronized version of comingle. Takes in multiple JSON objects and outputs a new object which contains comingled properties.

### inputs
1) an array of json objects
```
omingleSync([json1, json2, json3, json4])
```
2) an object which continas the options  
Currently only Javascript objects are excluded. If used, this option will result in top level only properties without any nested objects.  
The skip option takes an array of property names which will be excluded from the final result.  
The depth option indicates how many levels of nested objects will be included.  
```
{depth: 1, skip:['middle_name'], excludes:['object']}
```
```
import { comingleSync } from "./comingleSync.js"

const json1 = {
    first_name: "Arthur"
};
const json2 = {
    middle_name: "Conan"
};
const json3 = {
    last_name: "Doyle"
};

const json4 = {
    first_name: "George"
}

const merged_object = comingleSync([json1, json2, json3, json4]);
console.log(merged_object);

const without_middle_name = comingleSync([json1, json2, json3, json4], {skip:['middle_name']});
console.log(without_middle_name);
```
Run the test.js file using Deno
```
deno run -r https://greergan.github.io/slim.comingle/test.js
```
```
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
```
Run the complex.js file using Deno
```
deno run -r https://greergan.github.io/slim.comingle/complex.js
```
