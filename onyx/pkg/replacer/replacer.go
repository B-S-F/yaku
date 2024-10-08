package replacer

import (
	"fmt"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/logger"
)

var PatternStart = `\${{`
var PatternEnd = `}}`
var PatternVariableType = []string{"vars", "secrets", "env"}
var DeprecatedVariableType = []string{"var", "secret", "envs"}

type Runner struct {
	ep        *configuration.ExecutionPlan
	variables *map[string]string
	replacer  Replacer
	logger    logger.Logger
}

type Scope int

const (
	Initial Scope = iota
	ConfigValues
)

// Convert Scope to string
func (s Scope) String() string {
	return [...]string{"Initial", "ConfigValues"}[s]
}

func New(ep *configuration.ExecutionPlan, vars *map[string]string, p ...Pattern) *Runner {
	r := NewReplacerImpl(p)
	variables := helper.MergeMaps(ep.DefaultVars, *vars)
	return &Runner{
		ep:        ep,
		variables: &variables,
		replacer:  r,
		logger:    logger.Get(),
	}
}

func Run(ep *configuration.ExecutionPlan, vars, secrets map[string]string, scope Scope) error {
	possibleTypes := PatternVariableType[:]
	possibleTypes = append(possibleTypes, DeprecatedVariableType...)
	for _, varType := range possibleTypes {
		switch varType {
		case "vars", "var":
			r := New(ep, &vars, NewPattern(varType, PatternStart, PatternEnd))
			r.replace("vars", scope)
		case "secrets", "secret":
			r := New(ep, &secrets, NewPattern(varType, PatternStart, PatternEnd))
			r.replace("secrets", scope)
		case "env", "envs":
			r := New(ep, &ep.Env, NewPattern(varType, PatternStart, PatternEnd))
			r.replace("env", scope)
		}
	}
	return nil
}

func (r *Runner) replace(varType string, scope Scope) {
	if scope == Initial {
		r.replaceInitialExecutionPlan(varType)
	} else {
		r.replaceConfigValues(varType)
	}
}

func (r *Runner) replaceInitialExecutionPlan(varType string) {
	r.logger.Info(fmt.Sprintf("replacing '%s' variables in execution plan", varType))
	// replace global Env
	var variablesList []map[string]string
	if varType == "env" {
		variablesList = []map[string]string{} // global env should not contain ${{ env.VAR }} variables
	} else {
		variablesList = buildEnvironmentList(*r.variables)
	}

	if e := r.replacer.Env(&r.ep.Env, variablesList); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in global Env: %w", varType, e).Error())
	}
	// replace Metadata
	if e := r.replacer.Struct(&r.ep.Metadata, *r.variables); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Metadata: %w", varType, e).Error())
	}
	// replace Header
	if e := r.replacer.Struct(&r.ep.Header, *r.variables); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Header: %w", varType, e).Error())
	}
	// Replace Repositories
	for i := range r.ep.Repositories {
		if e := r.replacer.Struct(&r.ep.Repositories[i], *r.variables); e != nil {
			r.logger.Error(fmt.Errorf("error replacing '%s' in Repository: %w", varType, e).Error())
		}
	}
	// replace Items
	for i := range r.ep.Items {
		item := &r.ep.Items[i]
		// replace Chapter
		if e := r.replacer.Struct(&item.Chapter, *r.variables); e != nil {
			r.logger.Error(fmt.Errorf("error replacing '%s' in Chapter: %w", varType, e).Error())
		}
		// replace Requirement
		if e := r.replacer.Struct(&item.Requirement, *r.variables); e != nil {
			r.logger.Error(fmt.Errorf("error replacing '%s' in Requirement: %w", varType, e).Error())
		}
		// replace Check
		checkEnv := buildEnvironment(*r.variables, item.Env)
		if e := r.replacer.Struct(&item.Check, checkEnv); e != nil {
			r.logger.Error(fmt.Errorf("error replacing '%s' in Check: %w", varType, e).Error())
		}

		// replace AppReferences
		for _, appRef := range item.AppReferences {
			if e := r.replacer.Struct(appRef, *r.variables); e != nil {
				r.logger.Error(fmt.Errorf("error replacing '%s' in AppReference: %w", varType, e).Error())
			}
		}

		if item.Manual != (configuration.Manual{}) {
			// replace manual answer
			// replace Manual
			if e := r.replacer.Struct(&item.Manual, *r.variables); e != nil {
				r.logger.Error(fmt.Errorf("error replacing variables in Manual: %s", e).Error())
			}

		} else {
			// replace automation
			var itemEnvList []map[string]string
			var autopilotEnvList []map[string]string
			if varType == "env" {
				// ${{ env.VAR }} variables do not get replaced by variables from the same level
				itemEnvList = buildEnvironmentList(*r.variables, item.Autopilot.Env)
				autopilotEnvList = buildEnvironmentList(*r.variables)
			} else {
				itemEnvList = buildEnvironmentList(*r.variables)
				autopilotEnvList = itemEnvList
			}
			// replace Env
			if e := r.replacer.Env(&item.Env, itemEnvList); e != nil {
				r.logger.Error(fmt.Errorf("error replacing '%s' in Env: %w", varType, e).Error())
			}
			// replace Autopilot.Env
			if e := r.replacer.Env(&item.Autopilot.Env, autopilotEnvList); e != nil {
				r.logger.Error(fmt.Errorf("error replacing '%s' in Autopilot.Env: %w", varType, e).Error())
			}
			var autopilotEnv map[string]string
			if varType == "env" {
				autopilotEnv = buildEnvironment(*r.variables, item.Autopilot.Env, item.Env)
			} else {
				autopilotEnv = *r.variables
			}
			// replace Autopilot
			if e := r.replacer.Struct(&item.Autopilot, autopilotEnv); e != nil {
				r.logger.Error(fmt.Errorf("error replacing '%s' in Autopilot: %w", varType, e).Error())
			}
			// replace Config keys
			if e := r.replaceKeys(varType, &item.Config, autopilotEnv); e != nil {
				r.logger.Error(fmt.Errorf("error replacing '%s' in Config keys: %w", varType, e).Error())
			}
		}
	}

	// ${{ env.VAR }} variables do only get replaced by global env variables
	finalizeEnvList := buildEnvironmentList(*r.variables)
	// replace Finalize.Env
	if e := r.replacer.Env(&r.ep.Finalize.Autopilot.Env, finalizeEnvList); e != nil {
		r.logger.Error(fmt.Errorf("error replacing variables in Finalize.Env: %w", e).Error())
	}
	var finalizeEnv map[string]string
	if varType == "env" {
		finalizeEnv = buildEnvironment(*r.variables, r.ep.Finalize.Autopilot.Env)
	} else {
		finalizeEnv = *r.variables
	}
	// replace Finalize
	if e := r.replacer.Struct(&r.ep.Finalize.Autopilot, finalizeEnv); e != nil {
		r.logger.Error(fmt.Errorf("error replacing variables in Finalize: %w", e).Error())
	}
	// replace Config keys in Finalize
	if e := r.replaceKeys(varType, &r.ep.Finalize.Config, finalizeEnv); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Config keys: %w", varType, e).Error())
	}
}

func (r *Runner) replaceConfigValues(varType string) {
	r.logger.Info(fmt.Sprintf("replacing '%s' variables in execution plan", varType))

	// iterated over Items
	for i := range r.ep.Items {
		item := &r.ep.Items[i]

		if item.Manual == (configuration.Manual{}) {
			var autopilotEnv map[string]string
			if varType == "env" {
				autopilotEnv = buildEnvironment(*r.variables, item.Autopilot.Env, item.Env)
			} else {
				autopilotEnv = *r.variables
			}

			// replace Config values
			if e := r.replaceConfig(varType, &item.Config, autopilotEnv); e != nil {
				r.logger.Error(fmt.Errorf("error replacing '%s' in Config: %w", varType, e).Error())
			}

		}
	}

	var finalizeEnv map[string]string
	if varType == "env" {
		finalizeEnv = buildEnvironment(*r.variables, r.ep.Finalize.Autopilot.Env)
	} else {
		finalizeEnv = *r.variables
	}

	// replace Config values in Finalize
	if e := r.replaceConfig(varType, &r.ep.Finalize.Config, finalizeEnv); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Finalize.Config: %w", varType, e).Error())
	}
}

func (r *Runner) replaceConfig(varType string, config *map[string]string, env map[string]string) error {
	if varType == "secrets" {
		for k, v := range *config {
			matches := r.replacer.ListMatches(v)
			if len(matches) > 0 {
				return fmt.Errorf("secrets are not allowed in config files: found %d secrets in file '%s'", len(matches), k)
			}
		}
	} else {
		return r.replacer.Map(config, env)
	}
	return nil
}

func (r *Runner) replaceKeys(varType string, m *map[string]string, env map[string]string) error {
	for k, v := range *m {
		newKey, err := r.replacer.String(k, env)
		if err != nil {
			return err
		}
		delete(*m, k)
		(*m)[newKey] = v
	}
	return nil
}

func buildEnvironment(envs ...map[string]string) map[string]string {
	return helper.MergeMaps(envs...)
}

func buildEnvironmentList(envs ...map[string]string) []map[string]string {
	return helper.CollectNonEmtpyMaps(envs...)
}
