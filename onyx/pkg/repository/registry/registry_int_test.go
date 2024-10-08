//go:build integration
// +build integration

package registry

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/B-S-F/onyx/pkg/repository"
	"github.com/B-S-F/onyx/pkg/repository/app"
	"github.com/B-S-F/onyx/pkg/repository/types/curl"
	"github.com/stretchr/testify/assert"
)

func serveApps(directory string) *httptest.Server {
	handler := http.FileServer(http.Dir(directory))
	server := httptest.NewServer(handler)
	return server
}

func TestInstall(t *testing.T) {
	server := serveApps("testdata")
	defer server.Close()

	tmpdir := t.TempDir()

	repo1 := curl.Repository{
		RepoName:         "repo1",
		InstallationPath: filepath.Join(tmpdir, "repo1"),
		Config: curl.Config{
			URL: server.URL + "/repository1/{name}-{version}",
		},
	}

	repo2 := curl.Repository{
		RepoName:         "repo2",
		InstallationPath: filepath.Join(tmpdir, "repo2"),
		Config: curl.Config{
			URL: server.URL + "/repository2/{name}-{version}",
		},
	}

	registry := NewRegistry([]repository.Repository{&repo1, &repo2})

	t.Run("test install with defined repository", func(t *testing.T) {
		appRef := &app.Reference{
			Repository: "repo1",
			Name:       "app",
			Version:    "1.0.0",
		}

		err := registry.Install(appRef)
		assert.NoError(t, err)

		app, err := registry.Get(appRef)
		assert.NoError(t, err)
		assert.NotNil(t, app)

		assert.Equal(t, "repo1", app.Reference().Repository)
	})

	t.Run("test install with undefined repository", func(t *testing.T) {
		appRef := &app.Reference{
			Name:    "app",
			Version: "1.2.0",
		}

		err := registry.Install(appRef)
		assert.NoError(t, err)

		app, err := registry.Get(appRef)
		assert.NoError(t, err)
		assert.NotNil(t, app)

		assert.Equal(t, "repo1", app.Reference().Repository)
	})

	t.Run("test install with non-existing app", func(t *testing.T) {
		appRef := &app.Reference{
			Repository: "repo1",
			Name:       "non-existing-app",
			Version:    "1.0.0",
		}

		err := registry.Install(appRef)
		assert.Error(t, err)
	})

	t.Run("test install with same app reference in multiple repositories", func(t *testing.T) {
		appRef := &app.Reference{
			Name:    "app",
			Version: "1.0.0",
		}

		err := registry.Install(appRef)
		assert.Contains(t, err.Error(), "found in multiple repositories")
		assert.Contains(t, err.Error(), "repo1")
		assert.Contains(t, err.Error(), "repo2")
		assert.Contains(t, err.Error(), "app@1.0.0")
	})
}
