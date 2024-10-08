package curl

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewRepository(t *testing.T) {
	config := map[string]interface{}{
		"url": "http://example.com/{name}/{version}",
	}
	repo, err := NewRepository("testRepo", "/path/to/install", config)
	assert.NoError(t, err)
	assert.Equal(t, "testRepo", repo.(*Repository).RepoName)
}

func TestGetAppURL(t *testing.T) {

	t.Run("with valid url", func(t *testing.T) {
		config := map[string]interface{}{
			"url": "http://example.com/{name}/{version}",
		}

		tempDir := t.TempDir()

		repo, err := NewRepository("testRepo", tempDir, config)
		assert.NoError(t, err)

		concreteRepo, ok := repo.(*Repository)
		assert.True(t, ok)

		url, err := concreteRepo.getAppURL("testApp", "1.0.0")
		assert.NoError(t, err)
		assert.Equal(t, "http://example.com/testApp/1.0.0", url.String())
	})

	t.Run("without {name} in url", func(t *testing.T) {
		config := map[string]interface{}{
			"url": "http://example.com/{version}",
		}

		tempDir := t.TempDir()

		repo, err := NewRepository("testRepo", tempDir, config)
		assert.NoError(t, err)

		concreteRepo, ok := repo.(*Repository)
		assert.True(t, ok)

		_, err = concreteRepo.getAppURL("testApp", "1.0.0")
		assert.Error(t, err)
	})

	t.Run("without {version} in url", func(t *testing.T) {
		config := map[string]interface{}{
			"url": "http://example.com/{name}",
		}

		tempDir := t.TempDir()

		repo, err := NewRepository("testRepo", tempDir, config)
		assert.NoError(t, err)

		concreteRepo, ok := repo.(*Repository)
		assert.True(t, ok)

		_, err = concreteRepo.getAppURL("testApp", "1.0.0")
		assert.Error(t, err)
	})
}
