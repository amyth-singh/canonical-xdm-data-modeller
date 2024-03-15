import { readFileSync, writeFileSync } from 'fs';

function extractDescriptionsFromAnySchema(jsonDoc, jsonSchema) {
    let descriptions = {};

    if (typeof jsonDoc !== 'object' || jsonDoc === null) {
        return descriptions;
    }

    // Handle "allOf", "anyOf", and "oneOf" in the schema
    ['allOf', 'anyOf', 'oneOf'].forEach(keyword => {
        if (jsonSchema[keyword]) {
            jsonSchema[keyword].forEach(subschema => {
                Object.assign(descriptions, extractDescriptionsFromAnySchema(jsonDoc, subschema));
            });
            return descriptions;
        }
    });

    // Handle objects (dictionaries)
    if (jsonDoc.constructor === Object && jsonSchema.properties) {
        for (let key in jsonDoc) {
            if (jsonSchema.properties[key]) {
                let propertySchema = jsonSchema.properties[key];

                // Extract description if it exists
                if (propertySchema.description) {
                    descriptions[key] = propertySchema.description;
                }

                // Recurse into nested structures
                let nestedDescriptions = extractDescriptionsFromAnySchema(jsonDoc[key], propertySchema);
                if (Object.keys(nestedDescriptions).length > 0) {
                    descriptions[key] = nestedDescriptions;
                }
            } else if (jsonSchema.additionalProperties && typeof jsonSchema.additionalProperties === 'object') {
                let additionalSchema = jsonSchema.additionalProperties;
                let nestedDescriptions = extractDescriptionsFromAnySchema(jsonDoc[key], additionalSchema);
                if (Object.keys(nestedDescriptions).length > 0) {
                    descriptions[key] = nestedDescriptions;
                }
            }
        }
    }

    // Handle arrays
    if (Array.isArray(jsonDoc) && jsonSchema.items) {
        jsonDoc.forEach((item, idx) => {
            let itemDescriptions = extractDescriptionsFromAnySchema(item, jsonSchema.items);
            if (Object.keys(itemDescriptions).length > 0) {
                descriptions[idx] = itemDescriptions;
            }
        });
    }

    return descriptions;
}

// Load JSON document and schema from files
const documentPath = '/Users/thinkninja/repos/xdm_modeller/fakeJSON.json';  // Adjust the path accordingly
const schemaPath = '/Users/thinkninja/repos/xdm_modeller/JSONschema/client-specific/crew/sales/SalesOrderCompositeEventDereferenced.json';      // Adjust the path accordingly
const outputPath = '/Users/thinkninja/repos/xdm_modeller/JSONata/outputs/Crew/Sales/NextSalesLineDocument.json';        // Adjust the output path if needed

let document1 = JSON.parse(readFileSync(documentPath, 'utf-8'));
let crewProductSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

  let extractedDescriptions = extractDescriptionsFromAnySchema(document1, crewProductSchema);

  // Write extracted descriptions to a file
writeFileSync(outputPath, JSON.stringify(extractedDescriptions, null, 2), 'utf-8');
console.log(`Descriptions extracted and saved to ${outputPath}`);
