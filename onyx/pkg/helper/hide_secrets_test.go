package helper

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHideValuesInJsonObject(t *testing.T) {
	type testCase struct {
		name  string
		input string
		want  string
		err   bool
	}

	testCases := []testCase{
		{
			name:  "should return empty input",
			input: "",
			want:  "",
			err:   false,
		},
		{
			name:  "should return hidden values",
			input: `{"username": "john", "password": "secret"}`,
			want:  `{"password":"*****","username":"*****"}`,
			err:   false,
		},
		{
			name:  "should return error on invalid json",
			input: "invalid json",
			want:  "",
			err:   true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actual, err := HideValuesInJsonObject([]byte(tc.input))
			if tc.err {
				assert.Error(t, err)
				assert.Nil(t, actual)
			} else {
				assert.Nil(t, err)
				assert.Equal(t, tc.want, string(actual))
			}
		})
	}
}

func TestHideValuesInMap(t *testing.T) {
	type testCase struct {
		name  string
		input map[string]string
		want  map[string]string
	}

	testCases := []testCase{
		{
			name:  "should return empty input map",
			input: map[string]string{},
			want:  map[string]string{},
		},
		{
			name: "should return map with hidden value",
			input: map[string]string{
				"username": "john",
				"password": "secret",
			},
			want: map[string]string{
				"username": "*****",
				"password": "*****",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			HideValuesInMap(&tc.input)
			assert.Equal(t, tc.want, tc.input)
		})
	}
}

func TestHideSecretsInJsonObject(t *testing.T) {
	testCases := []struct {
		name           string
		content        []byte
		secretsContent []byte
		want           []byte
		wantErr        bool
	}{
		{
			name:           "should return empty input",
			content:        []byte{},
			secretsContent: []byte{},
			want:           []byte{},
			wantErr:        false,
		},
		{
			name:           "should return same object if no secrets are provided",
			content:        []byte(`{"foo": "bar","baz": "qux"}`),
			secretsContent: []byte{},
			want:           []byte(`{"foo": "bar","baz": "qux"}`),
			wantErr:        false,
		},
		{
			name:           "should return masked value for one secret",
			content:        []byte(`{"foo": "bar","baz": "qux"}`),
			secretsContent: []byte(`{"password": "qux"}`),
			want:           []byte(`{"foo": "bar","baz": "***password***"}`),
			wantErr:        false,
		},
		{
			name:           "should return masked value for multiple secrets",
			content:        []byte(`{"foo": "bar","baz": "qux","qax": "qix"}`),
			secretsContent: []byte(`{"password": "qux","secret": "bar"}`),
			want:           []byte(`{"foo": "***secret***","baz": "***password***","qax": "qix"}`),
			wantErr:        false,
		},
		{
			name: "Invalid JSON",
			content: []byte(`{
                "foo": "bar",
                "baz": "qux"
            `),
			secretsContent: []byte(`{
                "password": "bar"
            }`),
			want:    nil,
			wantErr: true,
		},
		{
			name: "Invalid secrets JSON",
			content: []byte(`{
                "foo": "bar",
                "baz": "qux"
            }`),
			secretsContent: []byte(`{
                "password": "bar"
            `),
			want:    nil,
			wantErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := HideSecretsInJsonObject(tc.content, tc.secretsContent)
			if tc.wantErr {
				assert.Error(t, err)
				return
			}
			if len(tc.want) == 0 {
				assert.Equal(t, tc.want, got)
				return
			}
			assert.NoError(t, err)
			assert.JSONEq(t, string(tc.want), string(got))
		})
	}
}

func TestHideSecretsInMap(t *testing.T) {
	type testCase struct {
		name    string
		object  map[string]string
		secrets map[string]string
		want    map[string]string
	}

	testCases := []testCase{
		{
			name: "should return same object if no secrets are provided",
			object: map[string]string{
				"foo": "bar",
				"baz": "qux",
			},
			secrets: map[string]string{},
			want: map[string]string{
				"foo": "bar",
				"baz": "qux",
			},
		},
		{
			name: "should return masked value for one secret",
			object: map[string]string{
				"foo": "bar",
				"baz": "qux",
			},
			secrets: map[string]string{
				"password": "qux",
			},
			want: map[string]string{
				"foo": "bar",
				"baz": "***password***",
			},
		},
		{
			name: "sshould return masked value for multiple secrets",
			object: map[string]string{
				"foo": "bar",
				"baz": "qux",
				"qax": "qix",
			},
			secrets: map[string]string{
				"password": "qux",
				"secret":   "bar",
			},
			want: map[string]string{
				"foo": "***secret***",
				"baz": "***password***",
				"qax": "qix",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			HideSecretsInMap(&tc.object, tc.secrets)
			assert.Equal(t, tc.want, tc.object)
		})
	}
}

func TestHideSecretsInArrayOfStrings(t *testing.T) {
	testCases := []struct {
		name    string
		array   []string
		secrets map[string]string
		want    []string
	}{
		{
			name:    "should return input array if no secrets are provided",
			array:   []string{"foo bar baz", "qux qex qix"},
			secrets: map[string]string{},
			want:    []string{"foo bar baz", "qux qex qix"},
		},
		{
			name:    "should mask value for one secret in one line",
			array:   []string{"foo bar baz", "qux qex qix"},
			secrets: map[string]string{"password": "bar"},
			want:    []string{"foo ***password*** baz", "qux qex qix"},
		},
		{
			name:    "should mask values for multiple secrets in multiple lines",
			array:   []string{"foo bar baz", "qux qex qix"},
			secrets: map[string]string{"password": "bar", "token": "qix"},
			want:    []string{"foo ***password*** baz", "qux qex ***token***"},
		},
		{
			name:    "should return input array if secret value is not present",
			array:   []string{"foo bar baz", "qux qex qix"},
			secrets: map[string]string{"password": "not present"},
			want:    []string{"foo bar baz", "qux qex qix"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := HideSecretsInArrayOfStrings(tc.array, tc.secrets)
			assert.Equal(t, tc.want, got)
		})
	}
}

func TestHideSecretsInString(t *testing.T) {
	testCases := []struct {
		name    string
		content string
		secrets map[string]string
		want    string
	}{
		{
			name:    "should return input string if no secrets are provided",
			content: "foo bar baz",
			secrets: map[string]string{},
			want:    "foo bar baz",
		},
		{
			name:    "should return masked value for one secret",
			content: "foo bar baz",
			secrets: map[string]string{
				"password": "baz",
			},
			want: "foo bar ***password***",
		},
		{
			name:    "should return masked value for multiple secrets",
			content: "foo bar baz",
			secrets: map[string]string{
				"password": "baz",
				"token":    "bar",
			},
			want: "foo ***token*** ***password***",
		},
		{
			name:    "should return input string if secret value is not present",
			content: "foo bar baz",
			secrets: map[string]string{
				"password": "qux",
			},
			want: "foo bar baz",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := HideSecretsInString(tc.content, tc.secrets)
			assert.Equal(t, tc.want, got)
		})
	}
}
