package replacer

import (
	"fmt"
)

type SelfReferenceError struct {
	Value string
}

func (e *SelfReferenceError) Error() string {
	return fmt.Sprintf("self reference detected in '%s'", e.Value)
}

type CircularReferenceError struct {
	Value string
}

func (e *CircularReferenceError) Error() string {
	return fmt.Sprintf("circular reference detected in '%s'", e.Value)
}

type NotFoundError struct {
	Value string
}

func (e *NotFoundError) Error() string {
	return fmt.Sprintf("variable '%s' not found", e.Value)
}
