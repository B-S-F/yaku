//go:build unit
// +build unit

package replacer

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestReplacerNewReplacerStruct(t *testing.T) {
	p := []Pattern{NewPattern("env", PatternStart, PatternEnd)}
	r := NewReplacerImpl(p)
	assert.NotNil(t, r, "replacer should not be nil")
}

func TestReplacerStruct(t *testing.T) {
	p := []Pattern{NewPattern("vars", PatternStart, PatternEnd)}
	r := NewReplacerImpl(p)

	s := struct {
		Field1 string
		Field2 int
	}{
		Field1: "${{vars.VAR1}}",
		Field2: 123,
	}

	err := r.Struct(&s, map[string]string{
		"VAR1": "value1",
	})
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	assert.Equal(t, "value1", s.Field1, "field1 should be modified")
	assert.Equal(t, 123, s.Field2, "field2 should not be modified")
}

func TestReplacerMap(t *testing.T) {
	p := []Pattern{NewPattern("env", PatternStart, PatternEnd)}
	r := NewReplacerImpl(p)

	t.Run("should replace map", func(t *testing.T) {
		m := map[string]string{
			"foo": "${{env.bar}}",
			"baz": "qux",
		}
		env := map[string]string{
			"bar": "qux",
		}
		err := r.Map(&m, env)
		assert.NoError(t, err, "error should be nil")
		assert.Equal(t, "qux", m["foo"], "foo should be replaced")
	})
	t.Run("should throw error only at the end", func(t *testing.T) {
		m := map[string]string{
			"foo": "${{env.bar}}",
			"bar": "${{env.baz}}",
			"baz": "qux",
		}
		env := map[string]string{
			"bar": "qux",
		}
		err := r.Map(&m, env)
		assert.Error(t, err, "error should be thrown")
		assert.Equal(t, "qux", m["foo"], "foo should be replaced")

	})
}

func TestReplacerString(t *testing.T) {
	p := []Pattern{NewPattern("env", PatternStart, PatternEnd)}
	r := NewReplacerImpl(p)

	env := map[string]string{
		"foo": "bar",
		"baz": "qux",
	}
	input := "foo: ${{env.foo}}, baz: ${{env.baz}}"
	expected := "foo: bar, baz: qux"
	actual, err := r.String(input, env)
	assert.Equal(t, expected, actual, "expected string to be replaced")
	assert.NoError(t, err, "error should be nil")
}

func TestReplacerMatch(t *testing.T) {
	p := []Pattern{NewPattern("env", PatternStart, PatternEnd)}
	r := NewReplacerImpl(p)

	env := map[string]string{
		"foo": "bar",
		"baz": "${{ env.qux }}",
		"qux": "${{ env.baz }}",
	}
	t.Run("should replace match", func(t *testing.T) {
		input := "${{env.foo}}"
		expected := "bar"
		actual, err := r.match(input, env, make(map[string]bool))
		assert.Equal(t, expected, actual, "expected string to be replaced")
		assert.NoError(t, err, "error should be nil")
	})
	t.Run("should replace match with spaces in between the pattern", func(t *testing.T) {
		input := "${{ env.foo }}"
		expected := "bar"
		actual, err := r.match(input, env, make(map[string]bool))
		assert.Equal(t, expected, actual, "expected string to be replaced")
		assert.NoError(t, err, "error should be nil")
	})
	t.Run("should throw error for circular reference", func(t *testing.T) {
		input := "${{env.baz}}"
		expected := ""
		actual, err := r.match(input, env, make(map[string]bool))
		assert.Error(t, err, "expected error for circular reference")
		assert.Equal(t, expected, actual, "expected empty string")
	})
}

func TestListMatches(t *testing.T) {
	type testCase struct {
		name  string
		input string
		want  []string
	}
	testCases := []testCase{
		{
			name:  "should return nil if there are no matches",
			input: "hello world",
			want:  nil,
		},
		{
			name:  "should return a single match",
			input: "hello ${{ env.name }}",
			want:  []string{"${{ env.name }}"},
		},
		{
			name:  "should return multiple matches",
			input: "hello ${{ env.name }}, my email is ${{ env.email }}",
			want:  []string{"${{ env.name }}", "${{ env.email }}"},
		},
	}

	p := []Pattern{NewPattern("env", PatternStart, PatternEnd)}
	r := NewReplacerImpl(p)
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actual := r.ListMatches(tc.input)
			assert.Equal(t, tc.want, actual, "expected list of matches")
		})
	}
}

func TestEnvVariable(t *testing.T) {
	type testCase struct {
		name   string
		v      string
		envs   []map[string]string
		want   string
		errMsg string
	}

	testCases := []testCase{
		{
			name:   "empty input",
			v:      "",
			envs:   []map[string]string{},
			want:   "",
			errMsg: "",
		},
		{
			name: "single map with variable",
			v:    "${{ env.FOO }}",
			envs: []map[string]string{
				{"FOO": "bar"},
			},
			want:   "bar",
			errMsg: "",
		},
		{
			name: "multiple maps with variable",
			v:    "${{ env.FOO }}",
			envs: []map[string]string{
				{"FOO": "baz"},
				{"FOO": "bar"},
			},
			want:   "bar",
			errMsg: "",
		},
		{
			name: "multiple maps with self-referencing variable",
			v:    "${{ env.FOO }}",
			envs: []map[string]string{
				{"FOO": "baz"},
				{"FOO": "${{ env.FOO }}"},
			},
			want:   "baz",
			errMsg: "",
		},
		{
			name: "circular-reference error",
			v:    "${{ env.FOO }}",
			envs: []map[string]string{
				{
					"FOO": "${{ env.BAR }}",
					"BAR": "${{ env.FOO }}",
				},
			},
			want:   "",
			errMsg: "circular reference detected",
		},
		{
			name: "self-reference error",
			v:    "${{ env.FOO }}",
			envs: []map[string]string{
				{"FOO": "${{ env.FOO }}"},
			},
			want:   "",
			errMsg: "self reference detected",
		},
		{
			name: "not-found error with single map",
			v:    "${{ env.FOO }}",
			envs: []map[string]string{
				{"BAR": "baz"},
			},
			want:   "",
			errMsg: "not found",
		},
		{
			name:   "not-found error with empty array",
			v:      "${{ env.FOO }}",
			envs:   []map[string]string{},
			want:   "",
			errMsg: "not found",
		},
	}
	p := []Pattern{NewPattern("env", PatternStart, PatternEnd)}
	r := NewReplacerImpl(p)
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actual, err := r.envVariable(tc.v, tc.envs)
			assert.Equal(t, tc.want, actual, "expected variable to be replaced")
			if tc.errMsg != "" {
				assert.ErrorContainsf(t, err, tc.errMsg, "expected error to contain message")
			}
		})
	}
}

func TestEnv(t *testing.T) {
	type testCase struct {
		name   string
		m      map[string]string
		envs   []map[string]string
		want   map[string]string
		errMsg string
	}

	testCases := []testCase{
		{
			name:   "empty input",
			m:      map[string]string{},
			envs:   []map[string]string{},
			want:   map[string]string{},
			errMsg: "",
		},
		{
			name: "single map with variable",
			m: map[string]string{
				"FOO": "${{ env.BAR }}",
			},
			envs: []map[string]string{
				{"BAR": "baz"},
			},
			want: map[string]string{
				"FOO": "baz",
			},
			errMsg: "",
		},
		{
			name: "multiple maps with variable",
			m: map[string]string{
				"FOO": "${{ env.BAR }}",
				"BAZ": "${{ env.QUX }}",
			},
			envs: []map[string]string{
				{"BAR": "baz"},
				{"QUX": "quux"},
			},
			want: map[string]string{
				"FOO": "baz",
				"BAZ": "quux",
			},
			errMsg: "",
		},
		{
			name: "multiple maps with self-referencing variable",
			m: map[string]string{
				"FOO": "${{ env.FOO }}",
			},
			envs: []map[string]string{
				{"FOO": "bar"},
				{"FOO": "baz"},
				{"FOO": "${{ env.FOO }}"},
			},
			want: map[string]string{
				"FOO": "baz",
			},
			errMsg: "",
		},
		{
			name: "self-reference error",
			m: map[string]string{
				"FOO": "${{ env.FOO }}",
			},
			envs: []map[string]string{
				{"FOO": "${{ env.FOO }}"},
			},
			errMsg: "self reference detected",
		},
		{
			name: "not-found error",
			m: map[string]string{
				"FOO": "${{ env.BAR }}",
			},
			envs:   []map[string]string{},
			errMsg: "not found",
		},
	}

	p := []Pattern{NewPattern("env", PatternStart, PatternEnd)}
	r := NewReplacerImpl(p)
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := r.Env(&tc.m, tc.envs)
			if tc.errMsg != "" {
				assert.ErrorContainsf(t, err, tc.errMsg, "expected error to contain message")
			} else {
				assert.NoError(t, err, "error should be nil")
				assert.Equal(t, tc.want, tc.m, "expected map to be replaced")
			}
		})
	}
}

func TestFindAllReplacePatterns(t *testing.T) {
	testCases := map[string]struct {
		input string
		want  [][]string
	}{
		"Test with no matches": {
			input: "Hello, world!",
			want:  [][]string(nil),
		},
		"Test with one match": {
			input: "Hello, ${{ test.world}}!",
			want:  [][]string{{"${{ test.world}}"}},
		},
		"Test with multiple matches": {
			input: "Hello, ${{ test.world }}! Today is ${{ test.day }}.",
			want:  [][]string{{"${{ test.world }}"}, {"${{ test.day }}"}},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			got := FindAllReplacePatterns(tc.input)
			// assert
			assert.Equal(t, tc.want, got)
		})
	}
}

func TestIsValidReplacePattern(t *testing.T) {
	testCases := map[string]struct {
		input string
		want  bool
	}{
		"Test with valid pattern": {
			input: "${{ env.name }}",
			want:  true,
		},
		"Test with invalid pattern": {
			input: "${{ invalid.name }}",
			want:  false,
		},
		"Test with deprecated pattern": {
			input: "${{ envs.name }}",
			want:  false,
		},
		"Test with no pattern": {
			input: "Hello, world!",
			want:  false,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			got := IsValidReplacePattern(tc.input)
			// assert
			assert.Equal(t, tc.want, got)
		})
	}
}

func TestIsDeprecatedReplacePattern(t *testing.T) {
	testCases := map[string]struct {
		input string
		want  bool
	}{
		"Test with valid pattern": {
			input: "${{ env.name }}",
			want:  false,
		},
		"Test with invalid pattern": {
			input: "${{ invalid.name }}",
			want:  false,
		},
		"Test with deprecated pattern": {
			input: "${{ envs.name }}",
			want:  true,
		},
		"Test with no pattern": {
			input: "Hello, world!",
			want:  false,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			got := IsDeprecatedReplacePattern(tc.input)
			// assert
			assert.Equal(t, tc.want, got)
		})
	}
}
