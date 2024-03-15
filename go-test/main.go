package main

import (
	"encoding/json"
	"flag"
	"log"
	"os"
	"path/filepath"

	"github.com/xiatechs/XFuze/pkg/meta/lite"
)

func processFile(transformer *lite.Meta, inputPath string, outputPath string) {
	bytes, err := os.ReadFile(inputPath)
	if err != nil {
		log.Fatal(err)
	}

	var item interface{}
	err = json.Unmarshal(bytes, &item)
	if err != nil {
		log.Fatal(err)
	}

	var xdmTransformations []any
	_, err = transformer.Transform(item, &xdmTransformations)
	if err != nil {
		log.Fatal(err)
	}

	for index := range xdmTransformations {
		bytes, err = json.MarshalIndent(xdmTransformations[index], "", " ")
		if err != nil {
			log.Fatal(err)
		}

		err = os.WriteFile(outputPath, bytes, os.ModePerm)
		if err != nil {
			log.Fatal(err)
		}
	}
}

func main() {
	log.Println(`usage: app --t="./path/to/jsonata" --i="./path/to/input" --o="./path/to/outputjson"`)
	transformScriptPath := flag.String("t", "", "a string")
	inputPath := flag.String("i", "", "a string") // Renamed parameter
	outputFolderPath := flag.String("o", "", "a string")

	flag.Parse()

	if *inputPath == "" || *outputFolderPath == "" {
		log.Fatal("inputPath and outputFolderPath must be set")
	}

	jsonataScript, err := os.ReadFile(*transformScriptPath)
	if err != nil {
		log.Fatal(err)
	}

	_ = os.MkdirAll(*outputFolderPath, os.ModePerm)

	transformer, err := lite.NewMetaLite(string(jsonataScript))
	if err != nil {
		log.Fatal(err)
	}

	fileInfo, err := os.Stat(*inputPath)
	if err != nil {
		log.Fatal(err)
	}

	if fileInfo.IsDir() {
		items, err := os.ReadDir(*inputPath)
		if err != nil {
			log.Fatal(err)
		}

		for _, item := range items {
			if item.IsDir() {
				continue
			}

			fullPath := filepath.Join(*inputPath, item.Name())
			outputPath := filepath.Join(*outputFolderPath, item.Name())
			processFile(transformer, fullPath, outputPath)
		}
	} else {
		outputPath := filepath.Join(*outputFolderPath, filepath.Base(*inputPath))
		processFile(transformer, *inputPath, outputPath)
	}

	log.Println("done")
}
