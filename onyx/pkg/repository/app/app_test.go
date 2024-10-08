package app

import (
	"reflect"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAppReferenceString(t *testing.T) {
	appRef := &Reference{
		Repository: "repo",
		Name:       "app",
		Version:    "1.0.0",
	}

	expected := "repo::app@1.0.0"
	if appRef.String() != expected {
		t.Errorf("Expected %s, got %s", expected, appRef.String())
	}
}

func TestAppReferencePossibleReferences(t *testing.T) {
	appRef := &Reference{
		Repository: "repo",
		Name:       "app",
		Version:    "1.0.0",
	}

	expected := []string{"app@1.0.0", "app"}
	if !reflect.DeepEqual(appRef.PossibleReferences(), expected) {
		t.Errorf("Expected %v, got %v", expected, appRef.PossibleReferences())
	}
}

func TestAppInstallationPath(t *testing.T) {
	installationPath := "/path/to/install"
	cases := []struct {
		repositoryName string
		appName        string
		appVersion     string
		expected       string
	}{
		{"repo", "app", "1.0.0", "/path/to/install/repo/app/1.0.0"},
		{"repo-d", "app", "2.0.0", "/path/to/install/repo-d/app/2.0.0"},
		{"repo-d", "app-d", "3.0.0", "/path/to/install/repo-d/app-d/3.0.0"},
		{"repo-d", "app-d", "4.0.0-d", "/path/to/install/repo-d/app-d/4.0.0-d"},
		{"repo-d", "app-d#?~&", "5.0.0-d", "/path/to/install/repo-d/app-d_/5.0.0-d"},
	}

	for _, c := range cases {
		t.Run("test app installation path", func(t *testing.T) {
			if path := InstallationPath(installationPath, c.repositoryName, c.appName, c.appVersion); path != c.expected {
				assert.Equal(t, c.expected, path)
			}
		})
	}
}
