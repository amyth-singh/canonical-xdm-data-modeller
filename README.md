# XDM Canonical Data Model

### Overview

The Canonical Data Model is designed to facilitate the transformation and standardization of data from multiple sources and formats into a unified, canonical JSON representation. Its purpose is to provide a consistent data structure that can be easily consumed by various systems and integrations.

The data model follows a hierarchical structure, allowing the mapping of input data fields to specific positions within the canonical format. This hierarchical representation enables efficient data organization and retrieval, making it easier to access and manipulate the data based on its logical relationships.

By adopting the Canonical Data Model, organizations can achieve data interoperability and streamline data integration processes. It eliminates the need for complex mappings and conversions between different data formats, simplifying data exchange and reducing potential data inconsistencies.

The key benefits of the Canonical Data Model include:

1. **Standardization**: The model enforces a standardized format for data representation, ensuring consistency across different data sources and integrations.

2. **Flexibility**: The hierarchical structure of the model allows for easy addition or removal of data fields without requiring modifications to the underlying database schema. This flexibility simplifies the handling of evolving data requirements.

3. **Interoperability**: The canonical format enables seamless data integration between systems by providing a common data representation that can be easily understood and processed by various applications.

4. **Efficiency**: By mapping data fields to specific positions within the hierarchical structure, the model optimizes data organization and retrieval, improving data access and manipulation performance.

### Example Input

The following is an example input that can be converted to the canonical format:

```json
{
  "FirstName": "Billy",
  "LastName": "Jones",
  "AddresLine1": "Test Street",
  "AddresLine2": "Test Town",
  "AddresLine3": "Test City",
  "Postcode": "TT12 1TT",
  "DOB": "1980-01-01 00:00:00",
  "Age": "41",
  "IsActive": "Y"
}
```

### Canonical Mapping

Given the example input above, the data can be mapped to the canonical format as follows:

```json
[
  {
    "ID": "Get_Customer_1234_Header_Contact_Address_AddresLine1",
    "Desc": "First Line of Contact Address",
    "Code": "Header.Contact.Address.AddresLine1",
    "Value": "Test Street",
    "Type": "STRING"
  },
  {
    "ID": "Get_Customer_1234_Header_Contact_Address_AddresLine2",
    "Desc": "Second Line of Contact Address",
    "Code": "Header.Contact.Address.AddresLine2",
    "Value": "Test Town",
    "Type": "STRING"
  },
  {
    "ID": "Get_Customer_1234_Header_Contact_Address_AddresLine3",
    "Desc": "First Line of Contact Address",
    "Code": "Header.Contact.Address.AddresLine3",
    "Value": "Test City",
    "Type": "STRING"
  },
  {
    "ID": "Get_Customer_1234_Header_Contact_Address_Postcode",
    "Desc": "Postcode of Contact Address",
    "Code": "Header.Contact.Address.Postcode",
    "Value": "TT12 1TT",
    "Type": "STRING"
  },
  {
    "ID": "Get_Customer_1234_Header_Contact_FirstName",
    "Desc": "First Name of Contact",
    "Code": "Header.Contact.FirstName",
    "Value": "Billy",
    "Type": "STRING"
  },
  {
    "ID": "Get_Customer_1234_Header_Contact_LastName",
    "Desc": "Last Name of Contact",
    "Code": "Header.Contact.LastName",
    "Value": "Jones",
    "Type": "STRING"
  },
  {
    "ID": "Get_Customer_1234_Header_Contact_IsActive",
    "Desc": "Last Name of Contact",
    "Code": "Header.Contact.IsActive",
    "Value": "Y",
    "Type": "STRINGBOOL"
  },
  {
    "ID": "Get_Customer_1234_Header_Contact_DOB",
    "Desc": "Date of Birth of Contact",
    "Code": "Header.Contact.DOB",
    "Value": "1980-01-01 00:00:00",
    "Type": "TIMESTAMP"
  },
  {
    "ID": "Get_Customer_1234_Header_Contact_Age",
    "Desc": "Age of Contact",
    "Code": "Header.Contact.Age",
    "Value": "41",
    "Type": "NUMERIC"
  }
]
```

### Hierarchical Output

Based on the example input, the data can be represented in a hierarchical output format as follows:

```json
{
  "Header": {
    "Contact": {
      "Address": {
        "AddresLine1": "Test Street",
        "AddresLine2": "Test Town",
        "AddresLine3": "Test City",
        "Postcode": "TT12 1TT"
      },
      "FirstName": "Billy",
      "LastName": "Jones",
      "IsActive": "Y",
      "DOB": "1980-01-01 00:00:00",
      "Age": "41"
    }
  }
}
```

### Canonical Fields

The following table defines the fields used in the canonical format:

| Field Name  | Description                                | Code                                   | Value           | Type        |
|-------------|--------------------------------------------|----------------------------------------|-----------------|-------------|
| ID          | Unique identifier for the field             | Example: "Get_Customer_1234_Header_Contact_Address_AddresLine1" | -                | STRING      |
| Desc        | Description of the field                    | Example: "First Line of Contact Address" | -                | STRING      |
| Code        | Position of the field in the hierarchical structure | Example: "Header.Contact.Address.AddresLine1" | -                | STRING      |
| Value       | Value of the field                          | Example: "Test Street"                | Value of the field  | STRING           |
| Type        | Data type of the field                      | Example: "STRING"                      | STRINGBOOL, TIMESTAMP, NUMERIC, etc.                | STRING |

### Mapping of Input to Canonical using JSONata

To map the input fields to the canonical format, you can use JSONata expressions along with the provided JSONata functions. The following JSONata functions are available:

```json
$formatValue := function($value, $dType, $format){...}
$buildCustomAttribute := function($entityCode, $attributeId, $canonicalCode, $desc, $value, $dType, $dFormat){...}
```

The `$formatValue` function is used to standardize the mapping of canonical fields based on their data types and formats. The `$buildCustomAttribute` function is used to build custom attributes in the canonical format.

By applying the JSONata expressions and functions, you can transform the input data into the desired canonical format.

### Flexibility in Adding Data Fields

One of the advantages of the canonical format is its flexibility in adding data fields without requiring schema updates. With this data model, new fields can be seamlessly incorporated into the canonical format by simply including them in the input data and adding a canonical mapping. This means that there is no need to modify the existing database schema or perform schema updates when adding or removing fields. The data model handles the mapping and conversion process, ensuring compatibility and consistency in the canonical output.

### Conclusion
The data model presented here enables the conversion of data from various sources and formats into a standardized canonical JSON format. By following this data model, you can achieve data interoperability and easily integrate data from different systems. The canonical format provides a structured representation of the data, and the hierarchical output represents the transformed data in a hierarchical structure. The flexibility of adding new fields without schema updates makes it a versatile solution for handling evolving data requirements.

# XDM Data Dictionary

The XDM Data Dictionary is a comprehensive reference for the canonical data model. It contains detailed information about the fields, their descriptions, and their usage within the model. This section serves as a valuable resource for developers, data analysts, and integration teams who work with the canonical data model.

**[XDM Data Dictionary](https://github.com/xiatechs/xdm_modeller/blob/master/docs/README.md)**: Explore the Data Dictionary.
