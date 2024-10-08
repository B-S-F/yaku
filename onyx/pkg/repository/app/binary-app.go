package app

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"
)

type BinaryApp struct {
	// Name of the repository
	repository string
	// Name of the app
	name string
	// Version of the app
	version string
	// Checksum of the app
	checksum string
	// ExecutionPath of the app
	executionPath string
}

func NewBinaryApp(repository, name, version, checksum, executionPath string) App {
	return &BinaryApp{
		repository:    repository,
		name:          name,
		version:       version,
		checksum:      checksum,
		executionPath: executionPath,
	}
}

func (a *BinaryApp) Reference() *Reference {
	if a.repository == "" {
		panic("Repository is not set")
	}
	if a.name == "" {
		panic("Name is not set")
	}
	if a.version == "" {
		panic("Version is not set")
	}
	return &Reference{
		Repository: a.repository,
		Name:       a.name,
		Version:    a.version,
	}
}

func (a *BinaryApp) Checksum() string {
	if a.checksum == "" {
		panic("Checksum is not set")
	}
	return a.checksum
}

func (a *BinaryApp) ExecutablePath() string {
	if a.executionPath == "" {
		panic("ExecutionPath is not set")
	}
	return a.executionPath
}

func (a *BinaryApp) PossibleReferences() []string {
	return a.Reference().PossibleReferences()
}

func CalculateFileChecksum(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("error opening file: %w", err)
	}
	defer file.Close()

	sha256Hash := sha256.New()
	if _, err := io.Copy(sha256Hash, file); err != nil {
		return "", fmt.Errorf("error calculating checksum: %w", err)
	}

	return fmt.Sprintf("%x", sha256Hash.Sum(nil)), nil
}
