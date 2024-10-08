package app

import (
	"path/filepath"
	"regexp"
)

// App is an interface that represents an application within the repository.
// It provides methods to access the app's reference, checksum, executable path,
// and possible references.
type App interface {
	// Reference returns the reference of the app.
	Reference() *Reference
	// Checksum returns the checksum of the app.
	Checksum() string
	// ExecutablePath returns the path to the executable.
	ExecutablePath() string
	// PossibleReferences returns a list of possible references for the app.
	PossibleReferences() []string
}

type Reference struct {
	Repository string
	Name       string
	Version    string
}

// String returns a string representation of the AppReference.
// The format is "repository::name@version" if all fields are present,
// or just "name@version" if the repository is not specified.
func (a *Reference) String() string {
	s := ""
	if a.Repository != "" {
		s += a.Repository + "::"
	}
	if a.Name != "" {
		s += a.Name
	}
	if a.Version != "" {
		s += "@" + a.Version
	}
	return s
}

// String returns a string representation of the AppReference.
// The format is "repository::name@version" if all fields are present,
// or just "name@version" if the repository is not specified.
func (a *Reference) PossibleReferences() []string {
	var aliases []string
	aliases = append(aliases, a.Name+"@"+a.Version)
	aliases = append(aliases, a.Name)
	return aliases
}

// InstallationPath returns the path where the app should be installed.
// The path is constructed as "<installationPath>/<repository-name>/<app-name>/<app-version>".
func InstallationPath(installationPath, repositoryName, appName, appVersion string) string {
	invalidCharacters := regexp.MustCompile(`[^a-zA-Z0-9\s\:\_\.\-]+`)
	cleanedRepositoryName := invalidCharacters.ReplaceAllString(repositoryName, "_")
	cleanedAppName := invalidCharacters.ReplaceAllString(appName, "_")
	cleanedAppVersion := invalidCharacters.ReplaceAllString(appVersion, "_")
	return filepath.Join(installationPath, cleanedRepositoryName, cleanedAppName, cleanedAppVersion)
}
