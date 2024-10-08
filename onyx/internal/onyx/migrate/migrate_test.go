//go:build unit
// +build unit

package migrate

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRunMigrate(t *testing.T) {
	t.Run("should run sucessfully when migrating to v1", func(t *testing.T) {
		currentVersion := "v0"
		targetVersion := "v1"
		content := []byte{}

		got, err := runMigrate(currentVersion, targetVersion, content)

		assert.NoError(t, err)
		assert.NotNil(t, got)
		assert.Contains(t, string(got), "v1")
	})
	t.Run("should use v0 if current version is not recognized", func(t *testing.T) {
		currentVersion := "invalid version"
		targetVersion := "v1"
		content := []byte{}

		got, err := runMigrate(currentVersion, targetVersion, content)

		assert.NoError(t, err)
		assert.NotNil(t, got)
	})
	t.Run("should return error when migrating to v3", func(t *testing.T) {
		currentVersion := "v2"
		targetVersion := "v3"
		content := []byte{}

		got, err := runMigrate(currentVersion, targetVersion, content)

		assert.Error(t, err)
		assert.Nil(t, got)
	})
	t.Run("should return error when current version is the same as target version", func(t *testing.T) {
		currentVersion := "v0"
		targetVersion := "v0"
		content := []byte{}

		got, err := runMigrate(currentVersion, targetVersion, content)

		assert.Error(t, err)
		assert.Nil(t, got)
	})
}
