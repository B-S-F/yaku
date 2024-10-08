package replacer

import (
	"fmt"

	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/replacer"
	"github.com/B-S-F/onyx/pkg/v2/model"
)

var PatternStart = `\${{`
var PatternEnd = `}}`
var PatternVariableType = []string{"vars", "secrets", "env"}
var DeprecatedVariableType = []string{"var", "secret", "envs"}

type Runner struct {
	ep        *model.ExecutionPlan
	variables *map[string]string
	replacer  replacer.Replacer
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

func New(ep *model.ExecutionPlan, vars *map[string]string, p ...replacer.Pattern) *Runner {
	r := replacer.NewReplacerImpl(p)
	variables := helper.MergeMaps(ep.DefaultVars, *vars)
	return &Runner{
		ep:        ep,
		variables: &variables,
		replacer:  r,
		logger:    logger.Get(),
	}
}

func Run(ep *model.ExecutionPlan, vars, secrets map[string]string, scope Scope) error {
	possibleTypes := PatternVariableType[:]
	possibleTypes = append(possibleTypes, DeprecatedVariableType...)
	for _, varType := range possibleTypes {
		switch varType {
		case "vars", "var":
			r := New(ep, &vars, replacer.NewPattern(varType, PatternStart, PatternEnd))
			r.replace("vars", scope)
		case "secrets", "secret":
			r := New(ep, &secrets, replacer.NewPattern(varType, PatternStart, PatternEnd))
			r.replace("secrets", scope)
		case "env", "envs":
			r := New(ep, &ep.Env, replacer.NewPattern(varType, PatternStart, PatternEnd))
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

	for i := range r.ep.AutopilotChecks {
		r.replaceAutopilotItem(&r.ep.AutopilotChecks[i], varType)
	}

	for i := range r.ep.ManualChecks {
		r.replaceManualItem(&r.ep.ManualChecks[i], varType)
	}

	if r.ep.Finalize != nil {
		r.replaceFinalizeItem(r.ep.Finalize, varType)
	}
}

func (r *Runner) replaceManualItem(item *model.ManualCheck, varType string) {
	r.replaceCommonItem(&item.Item, varType)
	if e := r.replacer.Struct(&item.Manual, *r.variables); e != nil {
		r.logger.Error(fmt.Errorf("error replacing variables in Manual: %s", e).Error())
	}
}

func (r *Runner) replaceAutopilotItem(item *model.AutopilotCheck, varType string) {
	r.replaceCommonItem(&item.Item, varType)
	var itemEnvList []map[string]string
	var autopilotEnvList []map[string]string
	if varType == "env" {
		// ${{ env.VAR }} variables do not get replaced by variables from the same level
		itemEnvList = buildEnvironmentList(*r.variables, item.Autopilot.Env, item.CheckEnv)
		autopilotEnvList = buildEnvironmentList(*r.variables)
	} else {
		itemEnvList = buildEnvironmentList(*r.variables)
		autopilotEnvList = itemEnvList
	}
	for _, appRef := range item.AppReferences {
		if e := r.replacer.Struct(appRef, *r.variables); e != nil {
			r.logger.Error(fmt.Errorf("error replacing '%s' in AppReference: %w", varType, e).Error())
		}
	}
	// replace Env
	if e := r.replacer.Env(&item.CheckEnv, itemEnvList); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Env: %w", varType, e).Error())
	}
	// replace Autopilot.Env
	if e := r.replacer.Env(&item.Autopilot.Env, autopilotEnvList); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Autopilot.Env: %w", varType, e).Error())
	}
	var autopilotEnv map[string]string
	if varType == "env" {
		autopilotEnv = buildEnvironment(*r.variables, item.Autopilot.Env, item.CheckEnv)
	} else {
		autopilotEnv = *r.variables
	}
	// replace Autopilot
	autopilot := &item.Autopilot
	autopilotName, e := r.replacer.String(autopilot.Name, autopilotEnv)
	if e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Autopilot: %w", varType, e).Error())
	}
	autopilot.Name = autopilotName
	var stepEnvList []map[string]string
	if varType == "env" {
		// autopilot.Env (check Env) has a higher priority than autopilot.Env (autopilot Env)
		stepEnvList = buildEnvironmentList(*r.variables, item.Autopilot.Env, item.CheckEnv)
	} else {
		stepEnvList = buildEnvironmentList(*r.variables)
	}
	for i := range autopilot.Steps {
		for j := range autopilot.Steps[i] {
			step := &autopilot.Steps[i][j]
			// replace Step.Env
			if e := r.replacer.Env(&step.Env, stepEnvList); e != nil {
				r.logger.Error(fmt.Errorf("error replacing '%s' in Step.Env: %w", varType, e).Error())
			}
			var stepEnv map[string]string
			if varType == "env" {
				// autopilot.Env (check Env) has a higher priority than autopilot.Env (autopilot Env) and step.Env
				stepEnv = buildEnvironment(*r.variables, item.Autopilot.Env, step.Env, item.CheckEnv)
			} else {
				stepEnv = autopilotEnv
			}
			// replace Step
			if e := r.replacer.Struct(step, stepEnv); e != nil {
				r.logger.Error(fmt.Errorf("error replacing '%s' in Step: %w", varType, e).Error())
			}
			// replace Step.Config keys
			if e := r.replaceKeys(varType, &step.Configs, autopilotEnv); e != nil {
				r.logger.Error(fmt.Errorf("error replacing '%s' in Step.Config keys: %w", varType, e).Error())
			}
		}
	}
	// replace Evaluate.Env
	if e := r.replacer.Env(&autopilot.Evaluate.Env, stepEnvList); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Evaluate.Env: %w", varType, e).Error())
	}
	// replace Evaluate
	var evaluateEnv map[string]string
	if varType == "env" {
		// autopilot.Env (check Env) has a higher priority than autopilot.Env (autopilot Env) and autopilot.Evaluate.Env
		evaluateEnv = buildEnvironment(*r.variables, item.Autopilot.Env, item.Autopilot.Evaluate.Env, item.CheckEnv)
	} else {
		evaluateEnv = autopilotEnv
	}
	if e := r.replacer.Struct(&autopilot.Evaluate, evaluateEnv); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Evaluate: %w", varType, e).Error())
	}
	// replace Evaluate.Config keys
	if e := r.replaceKeys(varType, &autopilot.Evaluate.Configs, evaluateEnv); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Evaluate.Config keys: %w", varType, e).Error())
	}

}

func (r *Runner) replaceCommonItem(item *model.Item, varType string) {
	if e := r.replacer.Struct(&item.Chapter, *r.variables); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Chapter: %w", varType, e).Error())
	}
	if e := r.replacer.Struct(&item.Requirement, *r.variables); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Requirement: %w", varType, e).Error())
	}
	checkEnv := buildEnvironment(*r.variables)
	if e := r.replacer.Struct(&item.Check, checkEnv); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Check: %w", varType, e).Error())
	}
}

func (r *Runner) replaceFinalizeItem(item *model.Finalize, varType string) {
	// ${{ env.VAR }} variables do only get replaced by global env variables
	finalizeEnvList := buildEnvironmentList(*r.variables)
	// replace Finalize.Env
	if e := r.replacer.Env(&item.Env, finalizeEnvList); e != nil {
		r.logger.Error(fmt.Errorf("error replacing variables in Finalize.Env: %w", e).Error())
	}
	var finalizeEnv map[string]string
	if varType == "env" {
		finalizeEnv = buildEnvironment(*r.variables, item.Env)
	} else {
		finalizeEnv = *r.variables
	}
	// replace Finalize
	if e := r.replacer.Map(&item.Env, finalizeEnv); e != nil {
		r.logger.Error(fmt.Errorf("error replacing variables in Finalize: %w", e).Error())
	}
	run, e := r.replacer.String(item.Run, finalizeEnv)
	if e != nil {
		r.logger.Error(fmt.Errorf("error replacing variables in Finalize: %w", e).Error())
	}
	item.Run = run

	// replace Config keys in Finalize
	if e := r.replaceKeys(varType, &item.Configs, finalizeEnv); e != nil {
		r.logger.Error(fmt.Errorf("error replacing '%s' in Config keys: %w", varType, e).Error())
	}
}

// TODO(YANI): until now config contents were replaced at this point. I will continue it for the ease but we may rework this.
func (r *Runner) replaceConfigValues(varType string) {
	r.logger.Info(fmt.Sprintf("replacing '%s' variables in execution plan", varType))

	for i := range r.ep.AutopilotChecks {
		autopilotItem := r.ep.AutopilotChecks[i]
		var autopilotEnv map[string]string
		// replace autopilot Env
		if varType == "env" {
			// autopilotItem.Env (check Env) has a higher priority than autopilotItem.Autopilot.Env (autopilot Env)
			autopilotEnv = buildEnvironment(*r.variables, autopilotItem.Autopilot.Env, autopilotItem.CheckEnv)
		} else {
			autopilotEnv = *r.variables
		}
		// replace Steps Config values
		for i := range autopilotItem.Autopilot.Steps {
			for j := range autopilotItem.Autopilot.Steps[i] {
				step := &autopilotItem.Autopilot.Steps[i][j]
				var stepEnv map[string]string
				if varType == "env" {
					// autopilotItem.Env (check Env) has a higher priority than autopilotItem.Autopilot.Env (autopilot Env) and step.Env
					stepEnv = buildEnvironment(*r.variables, autopilotItem.Autopilot.Env, step.Env, autopilotItem.CheckEnv)
				} else {
					stepEnv = autopilotEnv
				}
				if e := r.replaceConfig(varType, &step.Configs, stepEnv); e != nil {
					r.logger.Error(fmt.Errorf("error replacing '%s' in Step.Env: %w", varType, e).Error())
				}
			}
		}
		// replace Evaluate Config values
		var evaluateEnv map[string]string
		if varType == "env" {
			// autopilotItem.Env (check Env) has a higher priority than autopilotItem.Autopilot.Env (autopilot Env) and autopilotItem.Autopilot.Evaluate.Env
			evaluateEnv = buildEnvironment(*r.variables, autopilotItem.Autopilot.Env, autopilotItem.Autopilot.Evaluate.Env, autopilotItem.CheckEnv)
		} else {
			evaluateEnv = autopilotEnv
		}
		if e := r.replaceConfig(varType, &autopilotItem.Autopilot.Evaluate.Configs, evaluateEnv); e != nil {
			r.logger.Error(fmt.Errorf("error replacing '%s' in Config: %w", varType, e).Error())
		}
	}

	if r.ep.Finalize != nil {
		var finalizeEnv map[string]string
		if varType == "env" {
			finalizeEnv = buildEnvironment(*r.variables, r.ep.Finalize.Env)
		} else {
			finalizeEnv = *r.variables
		}

		// replace Config values in Finalize
		if e := r.replaceConfig(varType, &r.ep.Finalize.Configs, finalizeEnv); e != nil {
			r.logger.Error(fmt.Errorf("error replacing '%s' in Finalize.Config: %w", varType, e).Error())
		}
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
