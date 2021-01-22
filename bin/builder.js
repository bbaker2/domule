const fs    = require('fs');
const path  = require('path');
const ajv   = require('ajv');


process.on('uncaughtException', err => {
    red(err.message);
    red("Exiting");
    process.exit(1) //mandatory (as per the Node.js docs)
})

// determing the directory we wish to read from
let srcDir  = getArgument(2, ".") // where we will scan from
let trgDir  = getArgument(3, path.resolve(srcDir, "target")); // where we will the new files too

let schema  = getSchema();

// loop over the folders and read the approved ones
info("Starting scan from: ", srcDir);
let result  = readFolders(srcDir, schema);

info("Indexing adventures");
indexAdventures(result);

let trgName = generateFileName(result);

// validate the final json
let hbValidator = new ajv();
if(hbValidator.validate(schema, result)){
    success("The compiled json passed validation.")
} else {
    warn("The compiled json is not valid.");
    warn("Reason: " + hbValidator.errorsText());
}

// convert to string and 
// store the result in the "target" folder
let strJson = JSON.stringify(result, null, 2);
trgDir      = createFolder(trgDir);

let trgJson = path.resolve(trgDir, trgName);
fs.writeFile(trgJson, strJson, "utf8", console.error);
success(`Finished json in ${trgJson}`);

info("generating the _generated folder/files");
generateIndexes(trgJson, result);
// DONE

/***** UTIL FUNCTIONS ****/

function getSchema(){
    let binDir      = path.dirname(process.argv[1]);
    let schemaFile  = path.resolve(binDir, "schema.json");
    let schema      = loadJson(schemaFile);
    return schema;
}

function getArgument(index, defaultPath){
    if(process.argv.length > index){ 
        let usrInput = process.argv[index];
        return path.normalize(usrInput);
    }
    return defaultPath;
}

function createFolder(...args){
    let dirPath = path.resolve(...args);
    fs.mkdirSync(dirPath, {"recursive":true});
    return dirPath;
}

function generateIndexes(resultPath, resultObj){
    let trgDir  = path.dirname(resultPath);
    let trgFile = path.basename(resultPath);

    let genDir = createFolder(trgDir, "_generated");
    
    // save props
    let props = {};
    let collection = {};
    collection[trgFile] = "collection";
    for(prop in resultObj){
        if(prop == "_meta") continue; // skip _meta
        
        props[prop] = collection;
    }

    fs.writeFile(
        path.resolve(genDir, "index-props.json"), 
        JSON.stringify(props, null, 2), 
        console.error
    );

    // save sources
    let sources = {};
    if( hasMetaJson(resultObj) ){
        sources[resultObj._meta.sources[0].json] = trgFile;
    }

    fs.writeFile(
        path.resolve(genDir, "index-sources.json"), 
        JSON.stringify(sources, null, 2), 
        console.error
    );

    // save timestamps
    let timestamps = {};
    let now = Date.now();
    timestamps[trgFile] = {
        "a" : now,
        "m" : now
    };

    fs.writeFile(
        path.resolve(genDir, "index-timestamps.json"), 
        JSON.stringify(timestamps, null, 2), 
        console.error
    );
}

function hasMetaJson(obj){
    return obj._meta 
        && obj._meta.sources 
        && obj._meta.sources[0] 
        && obj._meta.sources[0].json;
}

function generateFileName(obj){
    if( hasMetaJson(obj) ){      
        let meta = obj._meta.sources[0];      
        let fileName = `${meta.authors[0]}; ${meta.full}.json`;
        return fileName;
    }

    throw new Error("Missing _meta. Unable to continue.");
}

function loadJson(path) {
    let rawData = fs.readFileSync(path);
    let obj     = JSON.parse(rawData);
    return obj;
}

function readFolders(root, schema){
    let result = {};

    for(category in schema.properties){
        let folderDir = path.resolve(root, category);
        // if any folder matches the whitelist, dive down one layer
        // and concat all the json files into an array of json objects
        if(isFolder(folderDir)){                
            success(`  Processing folder: ${category}`);
            let folderPath      = path.resolve(root, category);
            let isArray         = schema.properties[category].type == "array";
            let items           = readFiles(folderPath, isArray);
            result[category]    = items; // store the result in the master json                                   
        } else {
            info(`  No folder found for: ${category}`);
        }
        
    }
    return result;
}

function isFolder(path) {
    // sure, this could be one line
    // but then it would be less readable
    if(fs.existsSync(path) && fs.lstatSync(path).isDirectory() ){      
        return true;        
    }
    return false;
}

function readFiles(dir, isArray) {
    var items = [];
    let files = fs.readdirSync(dir, { "withFileTypes" : true });
    
    // loop over the immedate group of files
    for(file of files){
        // if any of the files are a json file
        // read the file as a string, convert to json, then store
        // into the array
        if(file.isFile() && file.name.endsWith(".json")){
            info(`    Reading ${file.name}`);
            let fullPath    = path.resolve(dir, file.name);
            let obj         = loadJson(fullPath);            
            items.push(obj);
        }        
    }     

    // if we are expecting an arrya, return the array
    if(isArray) {
        return items;
    // otherwise, return an object. In this case, return the 1st element from the array
    } else {
        return items.length == 0 ? {} : items[0];        
    }   
}

function indexAdventures(root) {
    let adventureList =     root.adventure;
    let adventureDataList = root.adventureData;
    
    if(!(adventureList && adventureDataList)){
        return;
    }

    for(adventure of adventureList) {
        for(adventureData of adventureDataList){
            if(adventureData.name === adventure.name){
                adventure.contents = collectChapters(adventureData);
            }
        }
    }
}

function collectChapters(adventureData){
    let contents = [];
    for(data of adventureData.data){
        // chapters can only be from 'sections'
        if(data.type === "section"){
            let chapters = {
                name : data.name,
                headers : []
            };

            if(!data.entries) {
                continue;
            }

            for(entries of data.entries){
                // headers can only be from 'entries'
                if(entries.type === "entries"){
                    chapters.headers.push(entries.name);
                }
            }

            contents.push(chapters);
        }
    }
    return contents;
}

function warn(msg){
    console.warn("\x1b[33m%s\x1b[0m", msg);
}

function success(msg){
    console.warn("\x1b[32m%s\x1b[0m", msg);
}

function info(msg){
    console.info("\x1b[2m%s\x1b[0m", msg);
}

function red(msg){
    console.error("\x1b[31m%s\x1b[0m", msg);
}