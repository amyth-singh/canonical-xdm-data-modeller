# JSON Transform And Validate Script

This script processes JSON documents by transforming and validating them based on user configuration.

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [VS Code](https://code.visualstudio.com/) or any text editor of your choice.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/xiatechs/xdm_modeller.git

2. Change to the directory:
   ```bash
   cd xdm_modeller
3. Install the dependencies:
   ```bash
   npm install

## Configuration

Before running the script, configure it by editing the `config.yaml` file in the root of the project directory. Update the following fields with your information:

- `jsonataExpressionFilePath`: Path to the JSONata expression file.
- `performValidation`: Set to `yes` to perform JSON schema validation.
- `schemaOption`: Choose between `load` and `generate`.
- `jsonSchemaFilePath`: Path to the JSON schema file.
- `sampleJsonFilePath`: Path to the sample JSON file.
- `schemaOutputPath`: Output path for the de-referenced or generated JSON schema.
- `jsonDocumentsFolderPath`: Path to the folder containing JSON documents.
- `outputDirectoryPath`: Output directory path.

### Example `config.yaml`:

```yaml
jsonataExpressionFilePath: './expressions/jsonataExpression.txt'
performValidation: 'yes'
schemaOption: 'load'
jsonSchemaFilePath: './schema/jsonSchema.json'
sampleJsonFilePath: './sample/sampleJson.json'
schemaOutputPath: './output/schemaOutput.json'
jsonDocumentsFolderPath: './documents'
outputDirectoryPath: './output'
```

## Running the Script

To run the script:

1. Open the project in VS Code.
2. Open the terminal in VS Code by pressing `Ctrl + `` (backtick) or navigating to `View > Terminal`.
3. In the terminal, type the following command and press Enter:

    ```bash
    node JSONTransformAndValidate.mjs
    ```

   This will execute the script, and it will process the JSON documents as per the configuration in `config.yaml`.
