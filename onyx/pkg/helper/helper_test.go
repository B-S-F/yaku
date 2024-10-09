//go:build unit
// +build unit

package helper

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMergeMaps(t *testing.T) {
	type testCase struct {
		name  string
		input []map[string]string
		want  map[string]string
	}

	testCases := []testCase{
		{
			name:  "empty input",
			input: []map[string]string{},
			want:  map[string]string{},
		},
		{
			name: "single map",
			input: []map[string]string{
				{"foo": "bar"},
			},
			want: map[string]string{
				"foo": "bar",
			},
		},
		{
			name: "multiple maps",
			input: []map[string]string{
				{"foo": "bar"},
				{"baz": "qux"},
			},
			want: map[string]string{
				"foo": "bar",
				"baz": "qux",
			},
		},
		{
			name: "overlapping keys",
			input: []map[string]string{
				{"foo": "bar"},
				{"foo": "baz"},
			},
			want: map[string]string{
				"foo": "baz",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actual := MergeMaps(tc.input...)
			assert.Equal(t, tc.want, actual)
		})
	}
}

func TestCreateArrayOfMaps(t *testing.T) {
	type testCase struct {
		name  string
		input []map[string]string
		want  []map[string]string
	}

	testCases := []testCase{
		{
			name:  "empty input",
			input: []map[string]string{},
			want:  []map[string]string{},
		},
		{
			name: "single non-empty map",
			input: []map[string]string{
				{"foo": "bar"},
			},
			want: []map[string]string{
				{"foo": "bar"},
			},
		},
		{
			name: "single empty map",
			input: []map[string]string{
				{},
			},
			want: []map[string]string{},
		},
		{
			name: "multiple maps",
			input: []map[string]string{
				{"foo": "bar"},
				{},
				{"baz": "qux"},
			},
			want: []map[string]string{
				{"foo": "bar"},
				{"baz": "qux"},
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actual := CollectNonEmtpyMaps(tc.input...)
			assert.Equal(t, tc.want, actual)
		})
	}
}

func TestContains(t *testing.T) {
	cases := []struct {
		name string
		arr  []string
		s    string
		want bool
	}{
		{
			name: "should return false for an empty array",
			arr:  []string{},
			s:    "foo",
			want: false,
		},
		{
			name: "should return false if string is not found",
			arr:  []string{"bar", "baz"},
			s:    "foo",
			want: false,
		},
		{
			name: "should reutrn true if string is found",
			arr:  []string{"foo", "bar", "baz"},
			s:    "bar",
			want: true,
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := Contains(c.arr, c.s)
			assert.Equal(t, c.want, got)
		})
	}
}

func TestJoin(t *testing.T) {
	text1 := "TestError1"
	text2 := "TestError2"
	err1 := errors.New(text1)
	var err2 error = nil
	err3 := errors.New(text2)

	err := Join(err1, err2, err3)
	assert.Equal(t, fmt.Errorf("%w; %w", err1, err3), err)

	err = Join(nil, nil, nil, nil)
	assert.Nil(t, err)
}

func TestMapsEqual(t *testing.T) {
	cases := []struct {
		name          string
		m1            map[string]interface{}
		m2            map[string]interface{}
		ignoreKeys    []string
		ignorePattern string
		expected      bool
	}{
		{
			name: "Equal maps without ignored keys",
			m1: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			m2: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      true,
		},
		{
			name: "Unequal maps without ignored keys",
			m1: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			m2: map[string]interface{}{
				"key1": "value1",
				"key2": 456,
			},
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      false,
		},
		{
			name: "Equal maps with ignored keys",
			m1: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			m2: map[string]interface{}{
				"key1": "value1",
				"key2": 456,
			},
			ignoreKeys:    []string{"key2"},
			ignorePattern: "",
			expected:      true,
		},
		{
			name: "Unequal maps with ignored keys",
			m1: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			m2: map[string]interface{}{
				"key1": "value1",
				"key2": 456,
			},
			ignoreKeys:    []string{"key1"},
			ignorePattern: "",
			expected:      false,
		},
		{
			name: "Maps of different length",
			m1: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			m2: map[string]interface{}{
				"key1": "value1",
			},
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      false,
		},
		{
			name: "Maps of different keys",
			m1: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			m2: map[string]interface{}{
				"key1": "value1",
				"key3": 123,
			},
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      false,
		},
		{
			name: "Equal maps with ignored pattern",
			m1: map[string]interface{}{
				"key1": "value1",
				"key2": "value2",
			},
			m2: map[string]interface{}{
				"key1": "value1",
				"key2": "value2IGNORE",
			},
			ignoreKeys:    []string{},
			ignorePattern: "IGNORE",
			expected:      true,
		},
		{
			name: "Unequal maps with ignored pattern",
			m1: map[string]interface{}{
				"key1": "value1",
				"key2": "value2",
			},
			m2: map[string]interface{}{
				"key1": "value1",
				"key2": "value3IGNORE",
			},
			ignoreKeys:    []string{},
			ignorePattern: "IGNORE",
			expected:      false,
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, MapsEqual(tt.m1, tt.m2, tt.ignoreKeys, tt.ignorePattern))
		})
	}
}

func TestValuesEqual(t *testing.T) {
	cases := []struct {
		name          string
		v1            interface{}
		v2            interface{}
		ignoreKeys    []string
		ignorePattern string
		expected      bool
	}{
		{
			name:          "Equal string values",
			v1:            "value1",
			v2:            "value1",
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      true,
		},
		{
			name:          "Unequal string values",
			v1:            "value1",
			v2:            "value2",
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      false,
		},
		{
			name:          "Equal string values with ignored pattern",
			v1:            "value1",
			v2:            "value1IGNORE",
			ignoreKeys:    []string{},
			ignorePattern: "IGNORE",
			expected:      true,
		},
		{
			name:          "Unequal string values with ignored pattern",
			v1:            "value1",
			v2:            "value2IGNORE",
			ignoreKeys:    []string{},
			ignorePattern: "IGNORE",
			expected:      false,
		},
		{
			name: "Equal map values",
			v1: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			v2: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      true,
		},
		{
			name: "Unequal map values",
			v1: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			v2: map[string]interface{}{
				"key1": "value1",
				"key2": 456,
			},
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      false,
		},
		{
			name:          "Equal slice values",
			v1:            []interface{}{"value1", 123},
			v2:            []interface{}{"value1", 123},
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      true,
		},
		{
			name:          "Unequal slice values",
			v1:            []interface{}{"value1", 123},
			v2:            []interface{}{"value1", 456},
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      false,
		},
		{
			name:          "Map and different type",
			v1:            map[string]interface{}{},
			v2:            "value1",
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      false,
		},
		{
			name:          "Slice and different type",
			v1:            []interface{}{},
			v2:            "value1",
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      false,
		},
		{
			name:          "String and different type",
			v1:            "value1",
			v2:            1,
			ignoreKeys:    []string{},
			ignorePattern: "",
			expected:      false,
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			result := ValuesEqual(tt.v1, tt.v2, tt.ignoreKeys, tt.ignorePattern)
			if result != tt.expected {
				t.Errorf("Expected %v, got %v", tt.expected, result)
			}
		})
	}
}
func TestCreateSymlinks(t *testing.T) {
	t.Run("should create symlinks in the destination folder with names for a given file", func(t *testing.T) {
		// arrange
		tempDir := t.TempDir()
		src := filepath.Join(tempDir, "config.yaml")
		file, err := os.Create(src)
		if err != nil {
			t.Fatalf("Failed to create file: %v", err)
		}
		defer func() {
			if err := file.Close(); err != nil {
				t.Errorf("Failed to close file: %v", err)
			}
		}()
		names := []string{"config2.yaml"}

		// act
		err = CreateSymlinks(src, tempDir, names)

		// assert
		assert.NoError(t, err)
		for _, name := range names {
			symlink := filepath.Join(tempDir, name)
			_, err := os.Stat(symlink)
			assert.NoError(t, err)
		}
	})

	t.Run("should overwrite existing symlinks", func(t *testing.T) {
		// arrange
		tempDir := t.TempDir()
		src := filepath.Join(tempDir, "config.yaml")
		file, err := os.Create(src)
		if err != nil {
			t.Fatalf("Failed to create file: %v", err)
		}
		defer func() {
			if err := file.Close(); err != nil {
				t.Errorf("Failed to close file: %v", err)
			}
		}()
		names := []string{"config2.yaml"}

		// act
		err = CreateSymlinks(src, tempDir, names)

		// assert
		assert.NoError(t, err)
		for _, name := range names {
			symlink := filepath.Join(tempDir, name)
			_, err := os.Stat(symlink)
			assert.NoError(t, err)
		}
	})
}

func TestGenerateCheckResultIdHash(t *testing.T) {
	cases := []struct {
		name   string
		fields HashFields
		want   string
	}{{
		name: "should return a hash of the fields as the current api implementation",
		fields: HashFields{
			Chapter:       "1",
			Requirement:   "1",
			Check:         "1",
			Criterion:     "This is a test criterion",
			Justification: "The criterion was not met",
		},
		want: "562a22e934fbcad59b1de359cbd914ea810e57b7d04f2c0487e39a89ffaa05dd",
	},
		{
			name: "should support whitespaces in all fields",
			fields: HashFields{
				Chapter:       "Chapter 1",
				Requirement:   "Requirement 1",
				Check:         "Check 1",
				Criterion:     "This is a test criterion",
				Justification: "The criterion was not met",
			},
			want: "9319a093d48e7488ef34cd74ccfe5e2f23a00b32eede2ba30d39676f2029a528",
		}}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			got := GenerateCheckResultIdHash(tt.fields)
			assert.Equal(t, tt.want, got)
		})
	}
}
