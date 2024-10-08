//go:build integration
// +build integration

package reader

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

var nopLoggerInt = &logger.Log{
	Logger: zap.NewNop(),
}

func TestReaderIntegration(t *testing.T) {
	t.Run("should read a yaml file", func(t *testing.T) {
		// arrange
		r := New()

		// act
		content, err := r.Read("testdata/config.yaml")

		// assert
		assert.NoError(t, err)
		assert.Equal(t, []byte("metadata:\n  version: v1"), content)
	})
	t.Run("should read a json file and parse it to a map", func(t *testing.T) {
		// arrange
		r := New()

		// act
		content, err := r.ReadJsonMap("testdata/vars.json")

		// assert
		assert.NoError(t, err)
		assert.Equal(t, map[string]string{"VAR": "var"}, content)
	})
}
