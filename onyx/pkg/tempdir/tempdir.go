package tempdir

import (
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"time"
)

var tempDir string

func init() {
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	timestamp := time.Now().Format("2006-01-02T15-04-01")
	tempDir = filepath.Join(os.TempDir(), fmt.Sprintf("onyx-%s-%d", timestamp, seededRand.Intn(10000)))
}

func Get() string {
	return tempDir
}

func GetPath(path string) string {
	return filepath.Join(tempDir, path)
}
