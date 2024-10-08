package helper

import (
	"regexp"
	"strings"
)

func MapsEqual(m1, m2 map[string]interface{}, ignoreKeys []string, ignorePattern string) bool {
	if len(m1) != len(m2) {
		return false
	}
	for k, v1 := range m1 {
		if ContainsEntry(ignoreKeys, k) {
			continue
		}
		v2, ok := m2[k]
		if !ok {
			return false
		}
		if !ValuesEqual(v1, v2, ignoreKeys, ignorePattern) {
			return false
		}
	}
	return true
}

func ValuesEqual(v1, v2 interface{}, ignoreKeys []string, ignorePattern string) bool {
	switch v1 := v1.(type) {
	case map[string]interface{}:
		v2, ok := v2.(map[string]interface{})
		if !ok {
			return false
		}
		return MapsEqual(v1, v2, ignoreKeys, ignorePattern)
	case []interface{}:
		v2, ok := v2.([]interface{})
		if !ok {
			return false
		}
		return SlicesEqual(v1, v2, ignoreKeys, ignorePattern)
	case string:
		v2, ok := v2.(string)
		if !ok {
			return false
		}
		return StringsEqual(v1, v2, ignorePattern)

	default:
		return v1 == v2
	}
}

func SlicesEqual(s1, s2 []interface{}, ignoreKeys []string, ignorePattern string) bool {
	if len(s1) != len(s2) {
		return false
	}
	for i, v1 := range s1 {
		if !ValuesEqual(v1, s2[i], ignoreKeys, ignorePattern) {
			return false
		}
	}
	return true
}

func StringsEqual(s1, s2, ignorePattern string) bool {
	if ignorePattern == "" {
		return s1 == s2
	}
	re := regexp.MustCompile(ignorePattern)
	s1 = re.ReplaceAllString(s1, "")
	s2 = re.ReplaceAllString(s2, "")
	s1 = strings.TrimSpace(s1)
	s2 = strings.TrimSpace(s2)
	return s1 == s2
}

func ContainsEntry(list []string, entry string) bool {
	for _, item := range list {
		if item == entry {
			return true
		}
	}
	return false
}
