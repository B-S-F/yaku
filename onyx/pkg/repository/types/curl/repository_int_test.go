//go:build integration
// +build integration

package curl

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"

	"github.com/B-S-F/onyx/pkg/repository/app"
)

func TestInstallApp(t *testing.T) {
	// This test requires a mock HTTP server to simulate downloading a file.
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("mock file content"))
	}))
	defer server.Close()

	config := map[string]interface{}{
		"url": server.URL + "/{name}/{version}",
	}

	// Create a temporary directory for the test.
	tempDir, err := ioutil.TempDir("", "testRepo")
	if err != nil {
		t.Fatalf("Failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir) // Clean up the temporary directory after the test.

	repo, err := NewRepository("testRepo", tempDir, config)
	if err != nil {
		t.Fatalf("NewRepository failed: %v", err)
	}

	appRef := &app.Reference{
		Name:    "testApp",
		Version: "1.0.0",
	}
	app, err := repo.InstallApp(appRef)
	if err != nil {
		t.Fatalf("InstallApp failed: %v", err)
	}
	if app.Reference().Name != "testApp" || app.Reference().Version != "1.0.0" {
		t.Errorf("Expected app name 'testApp' and version '1.0.0', got '%s' and '%s'", app.Reference().Name, app.Reference().Version)
	}
}

func TestDownloadFile(t *testing.T) {
	// This test requires a mock HTTP server to simulate downloading a file.
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("mock file content"))
	}))
	defer server.Close()

	config := map[string]interface{}{
		"url": server.URL + "/{name}/{version}",
	}

	// Create a temporary directory for the test.
	tempDir, err := ioutil.TempDir("", "testRepo")
	if err != nil {
		t.Fatalf("Failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir) // Clean up the temporary directory after the test.

	repo, err := NewRepository("testRepo", tempDir, config)
	if err != nil {
		t.Fatalf("NewRepository failed: %v", err)
	}

	concreteRepo, ok := repo.(*Repository)
	if !ok {
		t.Fatalf("Failed to assert type of repo to ConcreteRepository")
	}

	parsedURL, err := url.Parse(server.URL + "/testApp/1.0.0")
	if err != nil {
		t.Fatalf("Failed to parse URL: %v", err)
	}

	err = concreteRepo.downloadFile(parsedURL, tempDir+"/testApp-1.0.0")
	if err != nil {
		t.Fatalf("downloadFile failed: %v", err)
	}

	// Verify the file was downloaded by checking its existence.
	if _, err := os.Stat(tempDir); os.IsNotExist(err) {
		t.Errorf("File was not downloaded")
	}
}
