package curl

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/B-S-F/onyx/pkg/repository"
	"github.com/B-S-F/onyx/pkg/repository/app"
)

const DOWNLOAD_TIMEOUT = 30 * time.Second

type Repository struct {
	Config           Config
	RepoName         string
	InstallationPath string
}

func NewRepository(name string, installationPath string, config map[string]interface{}) (repository.Repository, error) {
	if config == nil {
		return nil, fmt.Errorf("config is nil")
	}
	parsed, err := newConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create config: %w", err)
	}
	return &Repository{
		Config:           parsed.(Config),
		RepoName:         name,
		InstallationPath: installationPath,
	}, nil
}

func (r *Repository) InstallApp(appReference *app.Reference) (app.App, error) {
	if r.InstallationPath == "" {
		return nil, fmt.Errorf("installation path is not set")
	}

	url, err := r.getAppURL(appReference.Name, appReference.Version)
	if err != nil {
		return nil, fmt.Errorf("failed to install app %s: %w", appReference, err)
	}

	outputPath := app.InstallationPath(r.InstallationPath, r.RepoName, appReference.Name, appReference.Version)
	outputDir := filepath.Dir(outputPath)
	err = os.MkdirAll(outputDir, os.ModePerm)
	if err != nil {
		return nil, fmt.Errorf("failed to install app %s: %w", appReference, err)
	}
	err = r.downloadFile(url, outputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to install app %s: %w", appReference, err)
	}

	checksum, err := app.CalculateFileChecksum(outputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to install app %s: %w", appReference, err)
	}

	return app.NewBinaryApp(r.RepoName, appReference.Name, appReference.Version, checksum, outputPath), nil
}

// Replace {name} and {version} in the URL with the actual app name and version
// TODO: define if we throw an error if there is no {name} or {version} in the URL
func (r *Repository) getAppURL(appName, appVersion string) (*url.URL, error) {
	configUrl := r.Config.URL
	if configUrl == "" {
		return nil, fmt.Errorf("repository URL is empty")
	}
	if !strings.Contains(configUrl, "{name}") || !strings.Contains(configUrl, "{version}") {
		return nil, fmt.Errorf("repository URL does not contain {name} or {version}")
	}
	configUrl = strings.ReplaceAll(configUrl, "{name}", appName)
	configUrl = strings.ReplaceAll(configUrl, "{version}", appVersion)
	parsed, err := url.Parse(configUrl)
	if err != nil {
		return nil, fmt.Errorf("error parsing replaced URL: %w", err)
	}
	return parsed, nil
}

// Download the file from the URL and save it in the outputPath
// TODO: Files are not verified after download they could be anything
// -> We should restrict our pods to not be able to access anything relevant
func (r *Repository) downloadFile(url *url.URL, outputPath string) error {

	header := http.Header{}
	if r.Config.Auth != nil {
		header.Add("Authorization", r.Config.Auth.Config.Header())
	}

	request := http.Request{
		Method: "GET",
		URL:    url,
		Header: header,
	}

	client := http.Client{
		Timeout: DOWNLOAD_TIMEOUT,
	}
	response, err := client.Do(&request)
	if err != nil {
		return fmt.Errorf("error downloading file: %w", err)
	}

	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("error downloading file: %s", response.Status)
	}

	defer response.Body.Close()
	file, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("error opening file: %w.", err)
	}
	defer file.Close()

	_, err = file.ReadFrom(response.Body)
	if err != nil {
		return fmt.Errorf("error writing file: %w", err)
	}

	err = file.Chmod(0755)
	if err != nil {
		return fmt.Errorf("error changing file permissions: %w", err)
	}
	return nil
}

func (r *Repository) Name() string {
	return r.RepoName
}
