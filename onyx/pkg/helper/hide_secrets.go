package helper

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/pkg/errors"
)

func HideSecretsInJsonObject(content, secretsContent []byte) ([]byte, error) {
	if len(content) == 0 || len(secretsContent) == 0 {
		return content, nil
	}
	object := map[string]string{}
	err := json.Unmarshal(content, &object)
	if err != nil {
		return nil, errors.Wrap(err, "failed to unmarshal json object")
	}
	secrets := map[string]string{}
	err = json.Unmarshal(secretsContent, &secrets)
	if err != nil {
		return nil, errors.Wrap(err, "failed to unmarshal secrets")
	}
	HideSecretsInMap(&object, secrets)
	return json.Marshal(object)
}

func HideSecretsInMap(m *map[string]string, secrets map[string]string) {
	for k, v := range *m {
		for secretName, secretValue := range secrets {
			if strings.TrimSpace(v) == strings.TrimSpace(secretValue) {
				(*m)[k] = fmt.Sprintf("***%s***", secretName)
			}
		}
	}
}

func HideValuesInJsonObject(content []byte) ([]byte, error) {
	if len(content) == 0 {
		return content, nil
	}
	object := map[string]string{}
	err := json.Unmarshal(content, &object)
	if err != nil {
		return nil, errors.Wrap(err, "failed to unmarshal secrets")
	}
	HideValuesInMap(&object)
	return json.Marshal(object)
}

func HideValuesInMap(m *map[string]string) {
	for k := range *m {
		(*m)[k] = "*****"
	}
}

func HideSecretsInArrayOfStrings(array []string, secrets map[string]string) []string {
	if len(secrets) == 0 {
		return array
	}
	for i, line := range array {
		array[i] = HideSecretsInString(line, secrets)
	}
	return array
}

func HideSecretsInString(content string, secrets map[string]string) string {
	if len(secrets) == 0 {
		return content
	}
	for secretName, secretValue := range secrets {
		content = strings.ReplaceAll(content, secretValue, fmt.Sprintf("***%s***", secretName))
	}
	return content
}
