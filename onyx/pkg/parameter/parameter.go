package parameter

import (
	"strings"
	"time"
)

type ExecutionParameter struct {
	Strict          bool
	CheckTimeout    time.Duration
	InputFolder     string
	OutputFolder    string
	ConfigName      string
	VarsName        string
	SecretsName     string
	CheckIdentifier string
}

type CheckIdentifier struct {
	Chapter     string
	Requirement string
	Check       string
}

func (ep *ExecutionParameter) ParseCheckId() CheckIdentifier {
	idParts := strings.Split(ep.CheckIdentifier, "_")
	if len(idParts) != 3 {
		return CheckIdentifier{}
	}
	return CheckIdentifier{
		Chapter:     idParts[0],
		Requirement: idParts[1],
		Check:       idParts[2],
	}
}
