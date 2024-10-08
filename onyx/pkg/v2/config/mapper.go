package config

import (
	"fmt"
	"reflect"
	"regexp"
	"strings"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/logger"
	model "github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/pkg/errors"
)

func createItem(
	chapIndex string, chapter Chapter,
	reqIndex string, requirement Requirement,
	checkIndex string, check Check,
) model.Item {
	return model.Item{
		Chapter: configuration.Chapter{
			Id:    chapIndex,
			Title: chapter.Title,
			Text:  chapter.Text,
		},
		Requirement: configuration.Requirement{
			Id:    reqIndex,
			Title: requirement.Title,
			Text:  requirement.Text,
		},
		Check: configuration.Check{
			Id:    checkIndex,
			Title: check.Title,
		},
	}
}

func createManualCheck(
	chapIndex string, chapter Chapter,
	reqIndex string, requirement Requirement,
	checkIndex string, check Check,
) model.ManualCheck {
	return model.ManualCheck{
		Item: createItem(chapIndex, chapter, reqIndex, requirement, checkIndex, check),
		Manual: configuration.Manual{
			Status: check.Manual.Status,
			Reason: check.Manual.Reason,
		},
	}
}

func createAutopilotCheck(
	logger logger.Logger,
	chapIndex string, chapter Chapter,
	reqIndex string, requirement Requirement,
	checkIndex string, check Check,
	configAutopilots map[string]Autopilot,
	repositoryNames map[string]bool,
) (model.AutopilotCheck, error) {
	autopilotItem := model.AutopilotCheck{
		Item: createItem(chapIndex, chapter, reqIndex, requirement, checkIndex, check),
	}

	autopilot, ok := configAutopilots[check.Automation.Autopilot]
	if !ok {
		validationErr := errors.Errorf("referenced autopilot '%s' in check '%s' under requirement '%s' of chapter '%s' was not found in defined autopilots in config", check.Automation.Autopilot, checkIndex, reqIndex, chapIndex)
		autopilotItem.ValidationErrs = append(autopilotItem.ValidationErrs, validationErr)
		logger.Warn(validationErr.Error())
	}

	// map Apps
	if len(autopilot.Apps) > 0 {
		autopilotItem.AppReferences = make([]*configuration.AppReference, 0, len(autopilot.Apps))
		for _, app := range autopilot.Apps {
			appRef, err := configuration.NewAppReference(app)
			if err != nil {
				validationErr := fmt.Errorf("app reference '%s' is invalid: %w", app, err)
				autopilotItem.ValidationErrs = append(autopilotItem.ValidationErrs, validationErr)
				logger.Warn(validationErr.Error())
				continue
			}
			if appRef.Repository != "" {
				if !repositoryNames[appRef.Repository] {
					validationErr := errors.Errorf("repository '%s' referenced in app '%s' was not found", appRef.Repository, app)
					autopilotItem.ValidationErrs = append(autopilotItem.ValidationErrs, validationErr)
					logger.Warn(validationErr.Error())
					continue
				}
			}

			autopilotItem.AppReferences = append(autopilotItem.AppReferences, appRef)
		}
	}

	autopilotEnv, err := deepCopyMap(autopilot.Env)
	if err != nil {
		return model.AutopilotCheck{}, errors.Wrap(err, "failed to deep copy 'autopilot.Env'")
	}

	// map Evaluate
	evaluate := model.Evaluate{
		Run: autopilot.Evaluate.Run,
	}

	evaluate.Env, err = deepCopyMap(autopilot.Evaluate.Env)
	if err != nil {
		return model.AutopilotCheck{}, errors.Wrap(err, "failed to deep copy 'autopilot.Evaluate.Env'")
	}

	if autopilot.Evaluate.Config != nil {
		evaluate.Configs = make(map[string]string)
		for _, cfg := range autopilot.Evaluate.Config {
			evaluate.Configs[cfg] = ""
		}
	}

	// map Steps
	stepIDs := make(map[string]bool)
	for _, step := range autopilot.Steps {
		if step.ID != "" {
			stepIDs[step.ID] = true
		}
	}

	domainSteps := make([]model.Step, 0, len(autopilot.Steps))
	for idx, step := range autopilot.Steps {
		domainStep, err := convertStepToDomain(step, idx, stepIDs)
		if err != nil {
			return model.AutopilotCheck{}, errors.Wrapf(err, "failed to convert 'autopilot.Steps[%d]' to domain Step", idx)
		}
		domainSteps = append(domainSteps, domainStep)
	}

	graph := newStepGraph(domainSteps)

	hasCycle := graph.hasCycle()
	if hasCycle {
		validationErr := errors.Errorf("referenced autopilot '%s' in check '%s' under requirement '%s' of chapter '%s' has cyclic dependencies inside it's steps", check.Automation.Autopilot, checkIndex, reqIndex, chapIndex)
		autopilotItem.ValidationErrs = append(autopilotItem.ValidationErrs, validationErr)
		logger.Warn(validationErr.Error())
	}

	// map Autopilot
	autopilotItem.Autopilot = model.Autopilot{
		Name:     check.Automation.Autopilot,
		Env:      autopilotEnv,
		Evaluate: evaluate,
	}

	if !hasCycle {
		autopilotItem.Autopilot.Steps = graph.topologicalSort()
	}

	autopilotItem.CheckEnv, err = deepCopyMap(check.Automation.Env)
	if err != nil {
		return model.AutopilotCheck{}, errors.Wrap(err, "failed to deep copy 'check.Automation.Env'")
	}

	return autopilotItem, nil
}

func convertStepToDomain(step Step, stepIndex int, stepIDs map[string]bool) (model.Step, error) {
	domainStep := model.Step{
		Title: step.Title,
		Run:   step.Run,
	}

	var err error
	domainStep.Env, err = deepCopyMap(step.Env)
	if err != nil {
		return model.Step{}, errors.Wrap(err, "failed to deep copy 'step.Env'")
	}

	if step.Depends != nil {
		depends, err := deepCopyValue(step.Depends)
		if err != nil {
			return model.Step{}, errors.Wrap(err, "failed to deep copy 'step.Depends'")
		}

		var ok bool
		domainStep.Depends, ok = depends.([]string)
		if !ok {
			return model.Step{}, errors.Errorf("deep copied 'step.Depends' is of unexpected type")
		}
	}

	if step.Config != nil {
		domainStep.Configs = make(map[string]string)
		for _, cfg := range step.Config {
			domainStep.Configs[cfg] = ""
		}
	}

	// validation and ensuring uniqueness of step.ID should happen at earlier stage
	domainStep.ID = step.ID

	if domainStep.ID == "" {
		domainStep.ID, err = generateUniqueStepID(step.Title, stepIndex, stepIDs)
		if err != nil {
			return model.Step{}, errors.Wrap(err, "failed to generate unique ID for step")
		}
	}

	return domainStep, nil
}

func generateUniqueStepID(stepTitle string, stepIndex int, stepIDs map[string]bool) (string, error) {
	var uniqueID string

	if stepTitle != "" {
		sanitizedTitle, err := sanitize(stepTitle)
		if err != nil {
			return "", errors.Wrapf(err, "failed to sanitize title '%s'", stepTitle)
		}
		// use sanitized step title as ID if present and unique across existing step identifiers
		if !stepIDs[sanitizedTitle] {
			uniqueID = sanitizedTitle
		}

		// if step title is present but not unique across existing step identifiers, add suffix to sanitized title to ensure uniqueness and use as ID
		if stepIDs[sanitizedTitle] {
			var uniqueTitle string
			for i := 1; i < 9999; i++ { // TODO: better idea for setting the max value here?
				uniqueTitle = fmt.Sprintf("%s_%d", sanitizedTitle, i)
				if !stepIDs[uniqueTitle] {
					break
				}
			}

			// still not unique, throw error
			if stepIDs[uniqueTitle] {
				return "", errors.Errorf("generated step ID '%s' is not unique", uniqueTitle)
			}

			uniqueID = uniqueTitle
		}
	}

	if stepTitle == "" {
		uniqueIndexID := fmt.Sprintf("step-%d", stepIndex+1)

		// if step + stepIndex is unique across existing identifiers, use as ID
		if !stepIDs[uniqueIndexID] {
			uniqueID = uniqueIndexID
		}

		// if step + stepIndex is not unique across existing identifiers, add suffix to ensure uniqueness and use as ID
		if stepIDs[uniqueIndexID] {
			var uniqueWithSuffix string
			for i := 1; i < 9999; i++ { // TODO: better idea for setting the max value here?
				uniqueWithSuffix = fmt.Sprintf("%s_%d", uniqueIndexID, i)
				if !stepIDs[uniqueWithSuffix] {
					break
				}
			}

			// still not unique, throw error
			if stepIDs[uniqueWithSuffix] {
				return "", errors.Errorf("generated step ID '%s' is not unique", uniqueWithSuffix)
			}

			uniqueID = uniqueWithSuffix
		}

	}

	stepIDs[uniqueID] = true
	return uniqueID, nil
}

func sanitize(s string) (string, error) {
	s = replaceUmlauts(s)
	// Define a regex pattern to match any character that is not alphanumeric, dash, or underscore
	re, err := regexp.Compile(`[^a-zA-Z0-9-_]`)
	if err != nil {
		return "", errors.Wrap(err, "failed to compile regex")
	}
	// Replace all matches with an empty string
	s = re.ReplaceAllString(s, "")
	return s, nil
}

func replaceUmlauts(s string) string {
	replacements := map[string]string{
		"ä": "ae",
		"ö": "oe",
		"ü": "ue",
		"Ä": "Ae",
		"Ö": "Oe",
		"Ü": "Ue",
		"ß": "ss",
	}

	for umlaut, replacement := range replacements {
		s = strings.ReplaceAll(s, umlaut, replacement)
	}

	return s
}

// deepCopyMap creates a deep copy of a map with string keys and any value type.
// Supported types for the map values include:
// - Primitive types: int, string, float64, bool, int64, int32, float32, uint, uint32, uint64
// - Composite types: slices, arrays, maps
// Unsupported types, including structs and complex types, will result in an error being returned.
func deepCopyMap[V any](original map[string]V) (map[string]V, error) {
	if original == nil {
		return nil, nil
	}

	target := make(map[string]V)
	for key, value := range original {
		deepCopiedValue, err := deepCopyValue(value)
		if err != nil {
			return nil, fmt.Errorf("error copying key %s: %v", key, err)
		}

		if deepCopiedValue == nil {
			var zero V
			target[key] = zero
			continue
		}

		target[key] = deepCopiedValue.(V)
	}

	return target, nil
}

// deepCopyValue returns a deep copy of a value or an error if the type is unsupported.
// Supported types include:
// - Maps: Recursively deep copies map keys and values.
// - Slices: Recursively deep copies slice elements.
// - Arrays: Recursively deep copies array elements.
// - Primitive types: int, string, float64, bool, int64, int32, float32, uint, uint32, uint64.
// - Interfaces: Deep copies the underlying value.
// Unsupported types, including structs, complex numbers, functions, channels, etc., will result in an error.
func deepCopyValue(value any) (any, error) {
	// Check if the value is nil
	if value == nil {
		return nil, nil
	}

	val := reflect.ValueOf(value)

	switch val.Kind() {
	case reflect.Map:
		copyMap := reflect.MakeMap(val.Type())
		for _, key := range val.MapKeys() {
			copiedKey := key.Interface()
			copiedValue, err := deepCopyValue(val.MapIndex(key).Interface())
			if err != nil {
				return nil, err
			}

			copyMap.SetMapIndex(reflect.ValueOf(copiedKey), reflect.ValueOf(copiedValue))
		}
		return copyMap.Interface(), nil

	case reflect.Slice:
		sliceCopy := reflect.MakeSlice(val.Type(), val.Len(), val.Cap())
		for i := 0; i < val.Len(); i++ {
			copiedElem, err := deepCopyValue(val.Index(i).Interface())
			if err != nil {
				return nil, err
			}

			sliceCopy.Index(i).Set(reflect.ValueOf(copiedElem))
		}
		return sliceCopy.Interface(), nil

	case reflect.Array:
		arrayCopy := reflect.New(val.Type()).Elem()
		for i := 0; i < val.Len(); i++ {
			copiedElem, err := deepCopyValue(val.Index(i).Interface())
			if err != nil {
				return nil, err
			}

			arrayCopy.Index(i).Set(reflect.ValueOf(copiedElem))
		}
		return arrayCopy.Interface(), nil

	case reflect.Int, reflect.String, reflect.Float64, reflect.Bool, reflect.Int64, reflect.Int32, reflect.Float32, reflect.Uint, reflect.Uint32, reflect.Uint64:
		return value, nil

	case reflect.Interface:
		// Deep copy the underlying value of an interface
		if val.IsNil() {
			return nil, nil
		}
		return deepCopyValue(val.Elem().Interface())

	default:
		return nil, fmt.Errorf("unsupported type: %s", val.Kind().String())
	}
}
