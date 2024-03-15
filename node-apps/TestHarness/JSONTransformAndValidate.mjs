// import fs from 'fs';
import fs from 'fs/promises'; // Node.js v14.14.0 or later
import path from 'path';
import jsonata from 'jsonata';
import Ajv from 'ajv';
import addFormats from "ajv-formats";
import $RefParser from "@apidevtools/json-schema-ref-parser";
import yaml from 'yaml';
import pLimit from 'p-limit';

let memoryUsageSum = 0;
let processedDocumentsCount = 0;
let startTime;


async function getInputs() {
    try {
        // Read YAML file
        const file = await fs.readFile('config.yaml', 'utf8');
        const config = yaml.parse(file);
        
        const expression = await fs.readFile(config.jsonataExpressionFilePath, 'utf-8');

        function convertInput(input) {
            function setValue(obj, path, value) {
              let i;
              path = path.split('.');
              for (i = 0; i < path.length - 1; i++)
                obj = obj[path[i]] = obj[path[i]] || {};
              obj[path[i]] = value;
            }
          
            const output = {};
            input.forEach(item => {
              setValue(output, item.Code, item.Value);
            });
          
            return output;
        }
        
        const jsonataExpression = jsonata(expression);
        jsonataExpression.registerFunction('convertInput', convertInput, '<a:o>');

        let jsonSchema;
        let validate;
        if (config.performValidation.toLowerCase() === 'yes') {
            if (config.schemaOption.toLowerCase() === 'load') {
                let jsonSchemaFile = JSON.parse(await fs.readFile(config.jsonSchemaFilePath, 'utf-8'));

                const schemaDir = path.dirname(config.jsonSchemaFilePath);
                process.chdir(schemaDir);
                jsonSchema = await $RefParser.dereference(jsonSchemaFile);

                if (config.saveDereferencedSchema.toLowerCase() === 'yes') {
                    await fs.writeFile(config.schemaOutputPath, JSON.stringify(jsonSchema, null, 2));
                }

            } else {
                const sampleJson = JSON.parse(await fs.readFile(config.sampleJsonFilePath, 'utf-8'));
                jsonSchema = generateSchema(sampleJson);
                await fs.writeFile(config.schemaOutputPath, JSON.stringify(jsonSchema, null, 2));
            }
            const ajv = new Ajv();
            addFormats(ajv);
            validate = ajv.compile(jsonSchema);
        }

        return { 
            jsonataExpression, 
            validate, 
            jsonDocumentsFolderPath: config.jsonDocumentsFolderPath, 
            outputDirectoryPath: config.outputDirectoryPath, 
            performValidation: config.performValidation 
        };
    } catch (error) {
        console.error('Error reading YAML file:', error);
    }
}

async function transformAndValidate(jsonDocument, jsonFile, jsonataExpression, validate, outputDirectoryPath, performValidation) {
    let stats = {
        transformationTime: 0,
        validationTime: 0,
    };
    try {

        let transformationStart = process.hrtime();
        const transformedJson = await jsonataExpression.evaluate(jsonDocument);
        let transformationEnd = process.hrtime(transformationStart);

        stats.transformationTime = transformationEnd[1] / 1000000; // convert to milliseconds

        if (performValidation.toLowerCase() === 'yes') {
            let validationStart = process.hrtime();
            const validationResult = validate(transformedJson);
            let validationEnd = process.hrtime(validationStart);
            
            stats.validationTime = validationEnd[1] / 1000000; // convert to milliseconds

            // Create output directories if they don't exist
            try {
                await fs.access(path.join(outputDirectoryPath, 'valid'));
            } catch {
                await fs.mkdir(path.join(outputDirectoryPath, 'valid'), { recursive: true });
            }
            try {
                await fs.access(path.join(outputDirectoryPath, 'invalid'));
            } catch {
                await fs.mkdir(path.join(outputDirectoryPath, 'invalid'), { recursive: true });
            }

            if (!validationResult) {
                console.log(`JSON document ${jsonFile} is invalid: ${JSON.stringify(validate.errors)}`);
                await fs.writeFile(path.join(outputDirectoryPath, 'invalid', jsonFile), JSON.stringify(transformedJson, null, 2));
            } else {
                console.log(`JSON document ${jsonFile} is valid.`);
                await fs.writeFile(path.join(outputDirectoryPath, 'valid', jsonFile), JSON.stringify(transformedJson, null, 2));
            }
        } else {
            console.log(`JSON document ${jsonFile} is transformed.`);
            await fs.writeFile(path.join(outputDirectoryPath, jsonFile), JSON.stringify(transformedJson, null, 2));
        }
        return stats;
    } catch (error) {
        console.error(`Error processing file ${jsonFile}: ${error.message}`);
    }
}

async function processFile(jsonFile, jsonataExpression, validate, jsonDocumentsFolderPath, outputDirectoryPath, performValidation) {
    let stats = {
        transformationTime: 0,
        validationTime: 0,
        memoryUsage: 0
    };

    try {
            const data = await fs.readFile(path.join(jsonDocumentsFolderPath, jsonFile), 'utf-8');
            const jsonDocument = JSON.parse(data);
            
            let memoryUsageStart = process.memoryUsage().heapUsed / 1024; // convert to KB
            const transformAndValidateStats = await transformAndValidate(jsonDocument, jsonFile, jsonataExpression, validate, outputDirectoryPath, performValidation);
            let memoryUsageEnd = process.memoryUsage().heapUsed / 1024; // convert to KB

            memoryUsageSum += (memoryUsageEnd - memoryUsageStart);
            processedDocumentsCount++;

            stats.transformationTime = transformAndValidateStats.transformationTime;
            stats.validationTime = transformAndValidateStats.validationTime;
            stats.memoryUsage = (memoryUsageEnd - memoryUsageStart);
            
            return stats;
        } catch (error) {
            console.error(`Error processing file ${jsonFile}: ${error.message}`);
        }
}

async function processFiles(files, jsonataExpression, validate, jsonDocumentsFolderPath, outputDirectoryPath, performValidation) {
    const limit = pLimit(5);

    const processingTasks = files.map(file => 
        limit(() => processFile(file, jsonataExpression, validate, jsonDocumentsFolderPath, outputDirectoryPath, performValidation))
    );

    const results = await Promise.all(processingTasks);
    
    let totalTransformationTime = 0, totalValidationTime = 0, totalMemoryUsage = 0, totalProcessed = 0;
    results.forEach(result => {
        totalTransformationTime += result.transformationTime;
        totalValidationTime += result.validationTime;
        totalMemoryUsage += result.memoryUsage;
        totalProcessed += 1;
    });
    
    let endTime = process.hrtime(startTime);
    let elapsedTime = (endTime[0] * 1e9 + endTime[1]) / 1e9; // convert to seconds
    
    console.log(`Average JSONata Transformation Time (ms): ${(totalTransformationTime / totalProcessed).toFixed(2)}`);
    console.log(`Average Validation Time (ms): ${(totalValidationTime / totalProcessed).toFixed(2)}`);
    console.log(`Average Memory Usage (KB): ${(totalMemoryUsage / totalProcessed).toFixed(2)}`);
    console.log(`JSON Documents Processed Per Second: ${(totalProcessed / elapsedTime).toFixed(2)}`);
    console.log(`Total Elapsed Time (s): ${elapsedTime.toFixed(2)}`);
}

async function main() {
    try {
        const { jsonataExpression, validate, jsonDocumentsFolderPath, outputDirectoryPath, performValidation} = await getInputs();

        const files = await fs.readdir(jsonDocumentsFolderPath); // Update to use await fs.readdir()
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        startTime = process.hrtime();
        await processFiles(jsonFiles, jsonataExpression, validate, jsonDocumentsFolderPath, outputDirectoryPath, performValidation);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();

