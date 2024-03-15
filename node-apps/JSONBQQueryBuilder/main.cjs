function generateBigQuerySQL(jsonObj, base = 'jsonPayload', path = '', parentArrayPath = '') {
    let sqlParts = [];
    let arrayHandlingParts = [];

    for (const key in jsonObj) {
        // Construct the full path of the current property
        const currentPath = path ? `${path}.${key}` : key;

        if (Array.isArray(jsonObj[key])) {
            // Handle arrays - create a separate UNNEST statement for each array
            const arrayPath = parentArrayPath ? `${parentArrayPath}, UNNEST(${base}.${currentPath}) AS ${key}` : `UNNEST(${base}.${currentPath}) AS ${key}`;
            if (jsonObj[key].length > 0 && typeof jsonObj[key][0] === 'object') {
                // Handle array of objects
                let nestedSQL = generateBigQuerySQL(jsonObj[key][0], key, '', arrayPath);
                sqlParts.push(...nestedSQL.sqlParts);
                arrayHandlingParts.push(...nestedSQL.arrayHandlingParts);
            } else {
                // Handle array of simple types
                sqlParts.push(`${key} AS ${key}`);
                arrayHandlingParts.push(arrayPath);
            }
        } else if (typeof jsonObj[key] === 'object' && jsonObj[key] !== null) {
            // Handle nested objects
            let nestedSQL = generateBigQuerySQL(jsonObj[key], base, currentPath, parentArrayPath);
            sqlParts.push(...nestedSQL.sqlParts);
            arrayHandlingParts.push(...nestedSQL.arrayHandlingParts);
        } else {
            // Handle simple properties
            sqlParts.push(`JSON_EXTRACT_SCALAR(${base}, '$.${currentPath}') AS ${key}`);
        }
    }

    return { sqlParts, arrayHandlingParts };
}

function convertJSONToBigQuerySQL(jsonObj) {
    const { sqlParts, arrayHandlingParts } = generateBigQuerySQL(jsonObj);
    return `SELECT ${sqlParts.join(', ')} FROM your_table_name ${arrayHandlingParts.length > 0 ? ', ' + arrayHandlingParts.join(', ') : ''}`;
}

// Example usage
const exampleJSON = {
    name: "John Doe",
    age: 30,
    addresses: [
        {
            street: "123 Main St",
            city: "Anytown"
        },
        {
            street: "456 Side St",
            city: "Othertown"
        }
    ]
};

const query = convertJSONToBigQuerySQL(exampleJSON);
console.log(query);
