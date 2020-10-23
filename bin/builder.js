const fs = require('fs');


const RD_OPTIONS = { "withFileTypes" : true };
const WHITELIST = ["_meta", "monster"];

// determing the directory we wish to read from
let root = ".";
if(process.argv.length > 2){ // if the user provides a path to start from... use it
    root = process.argv.slice(-1)[0]; // grab the last argument
}

// loop over the folders and read the approved ones
console.log("Starting scan from: ", root);
let result = readFolders(root);
let strJson = JSON.stringify(result, null, 2);

// console.log(strJson);

// store the result in the "target" folder
fs.mkdirSync(`${root}/target`, {"recursive":true}); // create the folder if it does not yet exist
let trg = `${root}/target/result.json`
fs.writeFile(trg, strJson, "utf8", console.error);
console.log("Finished json in", trg);
// DONE


/***** UTIL FUNCTIONS ****/
 

function readFolders(root){
    let result = {};

    let folders = fs.readdirSync(root, RD_OPTIONS);    
    // loop over the immedate group of folders
    for(file of folders){        
        let category = file.name;
        // if any folder matches the whitelist, dive down one layer
        // and concat all the json files into an array of json objects
        if(file.isDirectory() && WHITELIST.includes(file.name)){
            console.log("  Processing folder: ", file.name);
            let items = readFiles(file.name);
            result[file.name] = items; // store the result in the master json
        }        
    }
    return result;
}


function readFiles(dir) {
    var items = [];
    let files = fs.readdirSync(dir, RD_OPTIONS);
    
    // loop over the immedate group of files
    for(file of files){
        // if any of the files are a json file
        // read the file as a string, convert to json, then store
        // into the array
        if(file.isFile() && file.name.endsWith(".json")){
            console.log("    Reading", file.name);
            let rawData = fs.readFileSync(`${dir}/${file.name}`);
            let obj = JSON.parse(rawData);
            items.push(obj);
        }        
    }     
    return items;   
}