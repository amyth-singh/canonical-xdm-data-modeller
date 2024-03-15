const _ = require('lodash');
const fs = require('fs').promises;
const jsonata = require('jsonata');
const path = require('path');
const yaml = require('js-yaml');
const $RefParser = require('@apidevtools/json-schema-ref-parser');
const util = require('util');
const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats")
const { merge } = require('allof-merge');
const customLogger = createCustomLogger();

function createAjvInstance() {    
    const ajvInstance = new Ajv({ allErrors: true, strict: "log", logger: customLogger });
    addFormats(ajvInstance);
    return ajvInstance;
}

function createCustomLogger() {
    let logs = [];
    return {
        log: (msg) => {
            console.log(msg);
            logs.push(msg);
        },
        warn: (msg) => {
            console.warn(msg);
            logs.push(msg);
        },
        error: (msg) => {
            console.error(msg);
            logs.push(msg);
        },
        getLogs: () => logs,
        clearLogs: () => {
            logs = [];
        }
    };
}

// Recursive function to read files from a directory and its subdirectories
async function readFilesRecursively(directory, fileList = [], baseDirectory) {
    const files = await fs.readdir(directory, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(directory, file.name);
        if (file.isDirectory()) {
            await readFilesRecursively(fullPath, fileList, baseDirectory);
        } else if (file.isFile() && path.extname(file.name) === '.json') {
            const relativePath = path.relative(baseDirectory, fullPath);
            fileList.push({ fullPath, relativePath });
        }
    }
    return fileList;
}

async function applyTransformationsToRegistry(registryDir, processConfig) {
    let temporaryRegistry = {};

    const transformations = processConfig.transformations;
    const processList = processConfig.process;

    // Use the recursive function to load the base registry JSON files into memory
    const files = await readFilesRecursively(registryDir, [], registryDir);
    console.log(`Loaded ${files.length} files from ${registryDir}`);

    for (const { fullPath, relativePath } of files) {
        const schemaData = await fs.readFile(fullPath, 'utf8');
        // Use the relative path as the key in the registry to preserve the directory structure
        temporaryRegistry[relativePath] = JSON.parse(schemaData);
    }

    // Apply transformations to the temporary registry copies
    if (processConfig.transformations) {
        for (const transformation of transformations) {
            const { file, transforms } = transformation;
            if (temporaryRegistry[file]) {
                await applyTransformationsToFile(temporaryRegistry[file], transforms);
            } else {
                throw new Error(`File ${file} specified in transformations config not found in base registry.`);
            }
        }
    }

    // Dereference specified schemas
    for (const item of processList) {
        const { inputSchema, outputSchema } = item;
        if (temporaryRegistry[inputSchema]) {
            const dereferencedSchema = await $RefParser.dereference(inputSchema, temporaryRegistry[inputSchema], {
                resolve: {
                    file: {
                        order: 1,
                        read: function (file) {
                            // Calculate the relative path based on the base path and the reference
                            const relativeFilePath = path.relative(process.cwd(), file.url);

                            // Check if the relative path is within our base directory
                            if (temporaryRegistry[relativeFilePath]) {
                                return Promise.resolve(JSON.stringify(temporaryRegistry[relativeFilePath]));
                            } else {
                                return Promise.reject(new Error(`File ${relativeFilePath} not found in transformed registry.`));
                            }
                        }
                    }
                },
                dereference: {
                    circular: 'ignore'
                }
            });
            // Merge allOf schemas
            const mergedSchema = merge(dereferencedSchema)


            // Ensure the output directory exists
            // Join registryDir with the output path to get the full path
            const outputFullPath = path.join(registryDir, outputSchema);
            const outputDir = path.dirname(outputFullPath);
            await fs.mkdir(outputDir, { recursive: true });

            // Write the dereferenced schema to the specified output path
            await fs.writeFile(outputFullPath, JSON.stringify(mergedSchema, null, 2), 'utf8');
            console.log(`Dereferenced schema written to: ${outputFullPath}`);
        } else {
            throw new Error(`Schema ${inputSchema} specified in dereference list not found in base registry.`);
        }
    }

    return { transformedRegistry: temporaryRegistry };
}

async function applyTransformationsToFile(fileData, transforms) {
    for (const transform of transforms) {
        const { path, expression } = transform;
        const currentValue = _.get(fileData, path);
        const jsonataExpression = jsonata(expression);
        const newValue = await jsonataExpression.evaluate(currentValue);
        console.log(`Applying transformation to ${path}: ${expression}`);
        if (newValue !== undefined) {
            _.set(fileData, path, newValue);
        }
    }
}

async function readYamlConfig(filePath) {
    const yamlData = await fs.readFile(filePath, 'utf8');
    return yaml.load(yamlData);
}

// New function to get a list of YAML files from a directory
async function getYamlFilesFromDirectory(directory) {
    const files = await fs.readdir(directory);
    return files.filter(file => file.endsWith('.yaml')).map(file => path.join(directory, file));
}

async function runTransformationPipeline(configPath) {
    const pipelineConfig = await readYamlConfig(configPath);
    const { registryDir, transformationLibraries } = pipelineConfig;

    for (const libraryDir of transformationLibraries) {
        const transformationFiles = await getYamlFilesFromDirectory(libraryDir);

        for (const file of transformationFiles) {
            const processConfig = await readYamlConfig(file);
            console.log('Applying transformations from:', file);
            const { transformedRegistry } = await applyTransformationsToRegistry(registryDir, processConfig);

            // New process steps

            if (processConfig.process) {
                for (const processStep of processConfig.process) {
                    const { inputSchema, outputSchema, test } = processStep;
                    if (test) {
                        // Perform validation
                        const inputDocumentData = await fs.readFile(test.inputDocument, 'utf8');
                        const inputDocument = JSON.parse(inputDocumentData);
                        const outputSchemaData = await fs.readFile(path.join(registryDir, outputSchema), 'utf8');
                        const ajv = createAjvInstance();
                        const validate = ajv.compile(JSON.parse(outputSchemaData));

                        const valid = validate(inputDocument);
                        let validationResults = { isValid: valid };

                        if (!valid) {
                            console.log(`Validation errors for ${test.inputDocument}:`, validate.errors);
                            validationResults.errors = validate.errors;
                        } else {
                            console.log(`Document ${test.inputDocument} successfully validated against ${outputSchema}.`);
                        }

                        validationResults.ajvLogs = customLogger.getLogs();

                        // Write the validation results to the specified result path
                        const resultPath = path.join(registryDir, test.result);
                        await fs.writeFile(resultPath, JSON.stringify(validationResults, null, 2), 'utf8');
                        console.log(`Validation results written to: ${resultPath}`);

                        // Clear logs after processing each validation
                        customLogger.clearLogs();
                    }
                }
            }
        }
    }
}


// Helper function to get YAML files from a directory
async function getYamlFilesFromDirectory(directory) {
    const files = await fs.readdir(directory);
    return files
        .filter(file => file.endsWith('.yaml'))
        .map(file => path.join(directory, file));
}


runTransformationPipeline('main-config.yaml')
    .then(() => console.log('Transformation pipeline completed.'))
    .catch(error => console.error('An error occurred in the transformation pipeline:', error));
