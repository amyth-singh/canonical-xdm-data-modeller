#!/bin/bash

cd ../go-test &&
go run . --t="../shared/JSONataRegistry/Crew/CrewInventoryLedgerLine.jsonata" --i="../shared/DataLibrary/inputs/Crew/Archaen/JSON" --o="../shared/DataLibrary/outputs/Crew/Inventory" &&
go run . --t="../shared/JSONataRegistry/Crew/CrewProductMap.jsonata" --i="../shared/DataLibrary/inputs/Crew/Product/JSON/document_1.json" --o="../shared/DataLibrary/outputs/Crew/Product" &&
go run . --t="../shared/JSONataRegistry/WHSmith/WHSProduct_Ingest.jsonata" --i="../shared/DataLibrary/inputs/WHS/Product" --o="../shared/DataLibrary/outputs/WHS/Product" &&

# Run JSONSchemaTransformer
cd ../node-apps/JSONSchemaTransformer &&
node app.cjs
