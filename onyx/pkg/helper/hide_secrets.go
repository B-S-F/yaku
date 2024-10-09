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

func HideSecretsInArrayOfLines(lines []string, secrets map[string]string) []string {
	simpleSecrets, multilineSecrets := make(map[string]string), make(map[string][]string)
	for secretName, secretValue := range secrets {
		secretLines := strings.Split(secretValue, "\n")
		if len(secretLines) > 1 {
			multilineSecrets[secretName] = secretLines
		} else {
			simpleSecrets[secretName] = secretValue
		}
	}
	lines = HideSecretsInArrayOfStrings(lines, simpleSecrets)

	for secretName, secretLines := range multilineSecrets {
		start, mid, end := secretLines[0], secretLines[1:len(secretLines)-1], secretLines[len(secretLines)-1]
		for startIndex := 0; startIndex <= len(lines)-len(secretLines); startIndex++ {
			prefix, startOk := strings.CutSuffix(lines[startIndex], start)
			if !startOk {
				continue
			}
			endIndex := startIndex + 1
			midOk := true
			for _, midLine := range mid {
				if midLine != lines[endIndex] {
					midOk = false
					break
				}
				endIndex++
			}
			if !midOk {
				continue
			}
			suffix, endOk := strings.CutPrefix(lines[endIndex], end)
			if !endOk {
				continue
			}

			lines[startIndex] = fmt.Sprintf("%s***%s***", prefix, secretName)
			lines[endIndex] = suffix
			for i := startIndex + 1; i < endIndex; i++ {
				lines[i] = ""
			}
			startIndex = endIndex
		}
	}
	return lines
}
