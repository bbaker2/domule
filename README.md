# Summary
This is my personal repo I used to track my homebrew content for dnd. It has a weird strucutre but it will eventually be compiled into a series of jsons that can be consumed by 5e.tools

# Building Scripts
Node.js is used to build. To view the script itself, see [builder.js](bin/builder.js). It has one dependency to [Another Json Schema Validator](https://www.npmjs.com/package/ajv) so please have it pre-installed. 
```bash
npm install ajv
```
To build the homebrew snapshot run the build command
```bash
node bin/builder.js [sourceDir [ targetDir ]]
```
## Running the script
Argument | Description | Required | Default if not provided
---- | ---- | ---- | ----
sourceDir | Path to the root folder that you wish to scan | No (unless you want to specify targetDir) | The directory you are executing from
targetDir | The path to the fodler that you wish the compiled jsons to be written too. If the path does not exist, it will be created. | No | {sourceDir}/target
## Example (defaults)
```bash
:> pwd 
/usr/foo/workspace/domule
:> node bin/builder.js
```
This will read the folders found in `/usr/foo/workspace/domule` and output the compiled json into `/usr/foo/workspace/domule/target`

## Example (overrides)
```bash
:> pwd 
/usr/bar/
:> node bin/builder.js workspace/domule snapshots/domule
```
This will read the folders found in `/usr/bar/workspace/domule` and output the compiled json into `/usr/bar/snapshots/domule` (and create these folders if they do not exist
