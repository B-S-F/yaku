package helper

import (
	"encoding/json"

	"github.com/pkg/errors"
)

func ParseJsonMap(content []byte) (map[string]string, error) {
	vs := make(map[string]string)
	if len(content) > 0 {
		if err := json.Unmarshal(content, &vs); err != nil {
			return nil, errors.Wrapf(err, "could not parse json data")
		}
	}
	return vs, nil
}
