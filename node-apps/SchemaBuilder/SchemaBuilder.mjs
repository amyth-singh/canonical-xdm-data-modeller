import $RefParser from "@apidevtools/json-schema-ref-parser";
import { JSONSchemaFaker } from "json-schema-faker";
import fs from "fs/promises";
import { faker } from '@faker-js/faker';
import { Chance } from 'chance';
import yaml from 'js-yaml'; // You'll need to install this package

faker.setLocale('en_GB');
faker.seed(1);

// Read the YAML configuration
async function readYAMLConfig(filePath) {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return yaml.load(fileContents);
}

// Process each schema
async function processSchema(schemaPath, outputFolder) {
    let api = await $RefParser.dereference(schemaPath);

    // Save the dereferenced schema to the output folder
    const dereferencedSchemaString = JSON.stringify(api, null, 2);
    const dereferencedOutputFile = `${outputFolder}/${schemaPath.split('/').pop().replace('.json', '_Dereferenced.json')}`;
    await fs.writeFile(dereferencedOutputFile, dereferencedSchemaString);
    console.log(`Dereferenced schema saved at ${dereferencedOutputFile}!`);

    JSONSchemaFaker.extend('chance', () => new Chance());
    JSONSchemaFaker.extend('faker', () => faker);
    let fakeJSON = JSONSchemaFaker.generate(api);

    // Convert object to JSON string and save the sample JSON
    const jsonString = JSON.stringify(fakeJSON, null, 2);
    const sampleOutputFile = `${outputFolder}/${schemaPath.split('/').pop().replace('.json', '_sample.json')}`;
    await fs.writeFile(sampleOutputFile, jsonString);
    console.log(`Sample JSON saved at ${sampleOutputFile}!`);
}

async function main() {
    const config = await readYAMLConfig('./config.yaml'); // Assuming the YAML is named 'config.yaml'

    for (let schemaConfig of config.schemas) {
        await processSchema(schemaConfig.path, schemaConfig.outputFolder);
    }
}

main().catch(console.error);
