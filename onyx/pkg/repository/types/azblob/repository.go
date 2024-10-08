package azblob

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/B-S-F/onyx/pkg/repository"
	"github.com/B-S-F/onyx/pkg/repository/app"
)

type Repository struct {
	Config                  Config
	Token                   azcore.TokenCredential
	StorageAccountSignature string
	RepoName                string
	InstallationPath        string
}

func NewRepository(name string, installationPath string, config map[string]interface{}) (repository.Repository, error) {
	if config == nil {
		return nil, fmt.Errorf("config is nil")
	}
	parsed, err := newConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create config: %w", err)
	}

	var token azcore.TokenCredential
	var storageAccountSignature string
	if parsed.(*Config).Auth.Type == SharedAccessSignatureAuthType {
		storageAccountSignature, err = parsed.(*Config).Auth.Config.StorageAccountSignature()
		if err != nil {
			return nil, fmt.Errorf("failed to get storage account signature: %w", err)
		}
	} else {
		ctx := context.Background()
		token, err = parsed.(*Config).Auth.Config.Token(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get token: %w", err)
		}
	}

	return &Repository{
		Config:                  *parsed.(*Config),
		Token:                   token,
		StorageAccountSignature: storageAccountSignature,
		RepoName:                name,
		InstallationPath:        installationPath,
	}, nil
}

// InstallApp downloads the app from the azure blob storage, saves it to the installation path and makes it executable
func (r *Repository) InstallApp(appReference *app.Reference) (app.App, error) {
	appPath, err := r.getAppPath(appReference.Name, appReference.Version)
	if err != nil {
		return nil, fmt.Errorf("failed to install app %s: %w", appReference, err)
	}

	ouputPath := app.InstallationPath(r.InstallationPath, r.RepoName, appReference.Name, appReference.Version)
	outputDir := filepath.Dir(ouputPath)
	err = os.MkdirAll(outputDir, os.ModePerm)
	if err != nil {
		return nil, fmt.Errorf("failed to install app %s: %w", appReference, err)
	}

	err = r.downloadFile(appPath, ouputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to install app %s: %w", appReference, err)
	}

	checksum, err := app.CalculateFileChecksum(ouputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to install app %s: %w", appReference, err)
	}

	return app.NewBinaryApp(r.RepoName, appReference.Name, appReference.Version, checksum, ouputPath), nil
}

// Download the file from the azure blob storage, save it in the outputPath and make it executable
func (r *Repository) downloadFile(appPath, outputPath string) error {
	client, err := r.initClient()
	if err != nil {
		return fmt.Errorf("failed to create blob client: %w", err)
	}
	ctx := context.Background()
	outputFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	_, err = client.DownloadFile(ctx, r.Config.StorageAccountContainer, appPath, outputFile, nil)
	if err != nil {
		return fmt.Errorf("failed to download file: %w", err)
	}
	err = outputFile.Chmod(0755)
	if err != nil {
		return fmt.Errorf("error changing file permissions: %w", err)
	}
	err = outputFile.Close()
	if err != nil {
		return fmt.Errorf("error closing file: %w", err)
	}
	return nil
}

// Initialize the azure blob storage client
func (r *Repository) initClient() (*azblob.Client, error) {
	serviceUrl := r.serviceUrl()
	if r.Token == nil && r.StorageAccountSignature == "" {
		return nil, fmt.Errorf("no authorization options provided")
	}
	if r.Token != nil {
		return azblob.NewClient(serviceUrl, r.Token, nil)
	}
	connectionString := fmt.Sprintf("BlobEndpoint=%s;SharedAccessSignature=%s", serviceUrl, r.StorageAccountSignature)
	return azblob.NewClientFromConnectionString(connectionString, nil)
}

// Replace {name} and {version} in the storage account path with the actual app name and version
func (r *Repository) getAppPath(appName, appVersion string) (string, error) {
	configPath := r.Config.StorageAccountPath
	if configPath == "" {
		return "", fmt.Errorf("storage account path is not set")
	}
	if !strings.Contains(configPath, "{name}") {
		return "", fmt.Errorf("storage account path does not contain {name} placeholder")
	}
	if !strings.Contains(configPath, "{version}") {
		return "", fmt.Errorf("storage account path does not contain {version} placeholder")
	}
	configPath = strings.ReplaceAll(configPath, "{name}", appName)
	configPath = strings.ReplaceAll(configPath, "{version}", appVersion)
	return filepath.Clean(configPath), nil
}

func (r *Repository) serviceUrl() string {
	return fmt.Sprintf("https://%s.blob.core.windows.net", r.Config.StorageAccountName)
}

func (r *Repository) Name() string {
	return r.RepoName
}
