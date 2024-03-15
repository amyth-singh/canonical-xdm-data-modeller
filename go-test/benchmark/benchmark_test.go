package benchmark_test

import (
	"log"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/xiatechs/XFuze/pkg/meta/lite"
)

func BenchmarkOldMapper(b *testing.B) {
	jsonataScript, err := os.ReadFile("test_script.jsonata")
	if err != nil {
		log.Fatal(err)
	}

	transformer, err := lite.NewMetaLite(string(jsonataScript))
	if err != nil {
		log.Fatal(err)
	}

	exampleData := map[string]interface {
	}{
		"timeStamp": "2023-08-06T00:23:41Z",
	}

	for i := 0; i < b.N; i++ {
		var xdmTransformations []any
		_, err := transformer.Transform(exampleData, &xdmTransformations)
		assert.NoError(b, err)
	}
}

func BenchmarkNewMapper(b *testing.B) {
	jsonataScript, err := os.ReadFile("new_test_script.jsonata")
	if err != nil {
		log.Fatal(err)
	}

	transformer, err := lite.NewMetaLite(string(jsonataScript))
	if err != nil {
		log.Fatal(err)
	}

	exampleData := map[string]interface {
		}{
			"timeStamp": "2023-08-06T00:23:41Z",
		}

	for i := 0; i < b.N; i++ {
		var xdmTransformations []any
		_, err := transformer.Transform(exampleData, &xdmTransformations)
		assert.NoError(b, err)
	}
}
