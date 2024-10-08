package helper

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func MergeMaps(maps ...map[string]string) map[string]string {
	result := map[string]string{}
	for _, m := range maps {
		for k, v := range m {
			result[k] = v
		}
	}
	return result
}

func CollectNonEmtpyMaps(maps ...map[string]string) []map[string]string {
	result := []map[string]string{}
	for _, e := range maps {
		if len(e) > 0 {
			result = append(result, e)
		}
	}
	return result
}

func Contains(arr []string, s string) bool {
	for _, v := range arr {
		if v == s {
			return true
		}
	}
	return false
}

func GetOsEnv() map[string]string {
	env := os.Environ()
	envMap := map[string]string{}
	for _, e := range env {
		split := strings.SplitN(e, "=", 2)
		envMap[split[0]] = split[1]
	}
	return envMap
}

func Join(errs ...error) error {
	var relevantErrors []any
	var formatArray []string
	for _, err := range errs {
		if err != nil {
			relevantErrors = append(relevantErrors, err)
			formatArray = append(formatArray, "%w")
		}
	}
	if len(relevantErrors) == 0 {
		return nil
	}
	return fmt.Errorf(strings.Join(formatArray, "; "), relevantErrors...)
}

func CopyStringMap(m map[string]string) map[string]string {
	result := map[string]string{}
	for k, v := range m {
		result[k] = v
	}
	return result
}

var ToolVersion string

func CreateSymlinks(src string, dst string, names []string) error {
	for _, name := range names {
		dstPath := filepath.Join(dst, name)
		if _, err := os.Lstat(dstPath); err == nil {
			if err := os.Remove(dstPath); err != nil {
				return err
			}
		} else if !os.IsNotExist(err) {
			return err
		}
		if err := os.Symlink(src, dstPath); err != nil {
			return err
		}
	}
	return nil
}
