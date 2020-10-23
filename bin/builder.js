const fs = require('fs');

var RD_OPTIONS = { "withFileTypes" : true };
let WHITELIST = ["_meta", "monster"];

function readFolders(root){
    let result = {};

    let folders = fs.readdirSync(root, RD_OPTIONS);    
    // loop over the immedate group of folders
    for(file of folders){        
        let category = file.name;
        // if any folder matches the whitelist, dive down one layer
        // and concat all the json files into an array of json objects
        if(file.isDirectory() && WHITELIST.includes(file.name)){
            console.log("Processing folder: ", file.name);
            let items = readFiles(file.name);
            result[file.name] = items; // store the result in the master json
        }        
    }
    return result;
}

function readFiles(dir) {
    var items = [];
    let files = fs.readdirSync(dir, RD_OPTIONS);
    
    for(file of files){
        if(file.isFile() && file.name.endsWith(".json")){
            console.log("Reading", file.name);
            let rawData = fs.readFileSync(`${dir}/${file.name}`);
            let obj = JSON.parse(rawData);
            items.push(obj);
        }        
    }     
    return items;   
}

let root = ".";
// if the user provides a path to start from... use it
if(process.argv.length > 2){
    root = process.argv.slice(-1)[0]; // grab the last argument
}


console.log("Starting scan from: ", root);
let result = readFolders(root);
let strJson = JSON.stringify(result, null, 2);
console.log(strJson);
fs.writeFile("result.json", strJson, "utf8", console.error);