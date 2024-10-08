package app

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBinaryApp(t *testing.T) {
	t.Run("NewBinaryApp", func(t *testing.T) {
		t.Run("Reference", func(t *testing.T) {
			t.Run("Valid", func(t *testing.T) {
				app := NewBinaryApp("testRepo", "testApp", "1.0.0", "abc123", "/path/to/testApp")
				ref := app.Reference()
				assert.Equal(t, "testRepo", ref.Repository)
				assert.Equal(t, "testApp", ref.Name)
				assert.Equal(t, "1.0.0", ref.Version)
			})

			t.Run("MissingRepository", func(t *testing.T) {
				app := NewBinaryApp("", "testApp", "1.0.0", "abc123", "/path/to/testApp")
				assert.PanicsWithValue(t, "Repository is not set", func() {
					app.Reference()
				})
			})

			t.Run("MissingName", func(t *testing.T) {
				app := NewBinaryApp("testRepo", "", "1.0.0", "abc123", "/path/to/testApp")
				assert.PanicsWithValue(t, "Name is not set", func() {
					app.Reference()
				})
			})

			t.Run("MissingVersion", func(t *testing.T) {
				app := NewBinaryApp("testRepo", "testApp", "", "abc123", "/path/to/testApp")
				assert.PanicsWithValue(t, "Version is not set", func() {
					app.Reference()
				})
			})
		})

		t.Run("Checksum", func(t *testing.T) {
			t.Run("Valid", func(t *testing.T) {
				app := NewBinaryApp("testRepo", "testApp", "1.0.0", "abc123", "/path/to/testApp")
				assert.Equal(t, "abc123", app.Checksum())
			})

			t.Run("MissingChecksum", func(t *testing.T) {
				app := NewBinaryApp("testRepo", "testApp", "1.0.0", "", "/path/to/testApp")
				assert.PanicsWithValue(t, "Checksum is not set", func() {
					app.Checksum()
				})
			})
		})

		t.Run("ExecutablePath", func(t *testing.T) {
			t.Run("Valid", func(t *testing.T) {
				app := NewBinaryApp("testRepo", "testApp", "1.0.0", "abc123", "/path/to/testApp")
				assert.Equal(t, "/path/to/testApp", app.ExecutablePath())
			})

			t.Run("MissingExecutionPath", func(t *testing.T) {
				app := NewBinaryApp("testRepo", "testApp", "1.0.0", "abc123", "")
				assert.PanicsWithValue(t, "ExecutionPath is not set", func() {
					app.ExecutablePath()
				})
			})
		})

		t.Run("PossibleReferences", func(t *testing.T) {
			app := NewBinaryApp("testRepo", "testApp", "1.0.0", "abc123", "/path/to/testApp")
			possibleRefs := app.PossibleReferences()
			assert.Equal(t, []string{"testApp@1.0.0", "testApp"}, possibleRefs)
		})
	})
}

func TestCalculateFileChecksum(t *testing.T) {
	// Create a temporary file with known content.
	content := []byte("test content")
	tmpfilePath := filepath.Join(t.TempDir(), "tempfile")
	tmpfile, err := os.Create(tmpfilePath)
	assert.NoError(t, err)

	_, err = tmpfile.Write(content)
	assert.NoError(t, err)

	err = tmpfile.Close()
	assert.NoError(t, err)

	// Calculate the checksum of the file.
	checksum, err := CalculateFileChecksum(tmpfile.Name())

	assert.NoError(t, err)
	expectedChecksum := "6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72"
	assert.Equal(t, expectedChecksum, checksum)
}
