package replacer

import (
	"reflect"
	"regexp"
	"strings"

	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/pkg/errors"
)

type Replacer interface {
	Env(m *map[string]string, envs []map[string]string) error
	Map(m *map[string]string, env map[string]string) error
	MapStringInterface(m *map[string]interface{}, env map[string]string) error
	Struct(s interface{}, env map[string]string) error
	ListMatches(s string) []string
	envVariable(v string, envs []map[string]string) (string, error)
	String(s string, env map[string]string) (string, error)
	match(m string, env map[string]string, visited map[string]bool) (string, error)
}

type Pattern struct {
	varType string
	start   string
	end     string
	re      *regexp.Regexp
}

func NewPattern(varType, start, end string) Pattern {
	combinedRegexPattern := start + " *" + varType + `\.[a-zA-Z0-9_]+ *` + end
	return Pattern{
		varType: varType,
		start:   start,
		end:     end,
		re:      regexp.MustCompile(combinedRegexPattern),
	}
}

type ReplacerImpl struct {
	pattern []Pattern
}

func NewReplacerImpl(p []Pattern) Replacer {
	r := ReplacerImpl{
		pattern: p,
	}
	return &r
}

func (replace *ReplacerImpl) envVariable(v string, envs []map[string]string) (string, error) {
	var err error
	var newV string
	var selfRefErr *SelfReferenceError
	var notFoundErr *NotFoundError
	if len(envs) == 0 {
		return replace.String(v, nil)
	}
	for i := len(envs) - 1; i >= 0; i-- {
		newV, err = replace.String(v, envs[i])
		if err != nil {
			if errors.As(err, &selfRefErr) || errors.As(err, &notFoundErr) {
				continue
			}
		}
		return newV, err
	}
	return newV, err
}

func (replace *ReplacerImpl) Env(m *map[string]string, envs []map[string]string) error {
	var err error
	for k, v := range *m {
		newV, e := replace.envVariable(v, envs)
		if e != nil {
			e = errors.Wrapf(e, "error replacing '%s' entry in map", k)
			err = helper.Join(err, e)
		}
		(*m)[k] = newV
	}
	return err
}

func (replace *ReplacerImpl) Map(m *map[string]string, env map[string]string) error {
	var err error
	for k, v := range *m {
		newV, e := replace.String(v, env)
		if e != nil {
			e = errors.Wrapf(e, "error replacing '%s' entry in map", k)
			err = helper.Join(err, e)
		}
		(*m)[k] = newV
	}
	return err
}

func (replace *ReplacerImpl) MapStringInterface(m *map[string]interface{}, env map[string]string) error {
	var err error
	for k, v := range *m {
		if str, ok := v.(string); ok {
			newV, e := replace.String(str, env)
			if e != nil {
				e = errors.Wrapf(e, "error replacing '%s' entry in map", k)
				err = helper.Join(err, e)
			}
			(*m)[k] = newV
		}
		if m, ok := v.(map[string]interface{}); ok {
			e := replace.MapStringInterface(&m, env)
			if e != nil {
				e = errors.Wrapf(e, "error replacing '%s' entry in map", k)
				err = helper.Join(err, e)
			}
		}
		if a, ok := v.(map[string]string); ok {
			e := replace.Map(&a, env)
			if e != nil {
				e = errors.Wrapf(e, "error replacing '%s' entry in map", k)
				err = helper.Join(err, e)
			}
		}
		if a, ok := v.([]interface{}); ok {
			e := replace.SliceInterface(&a, env)
			if e != nil {
				e = errors.Wrapf(e, "error replacing '%s' entry in map", k)
				err = helper.Join(err, e)
			}
		}
		if a, ok := v.([]string); ok {
			e := replace.SliceString(&a, env)
			if e != nil {
				e = errors.Wrapf(e, "error replacing '%s' entry in map", k)
				err = helper.Join(err, e)
			}
		}
	}
	return err
}

func (r *ReplacerImpl) SliceInterface(m *[]interface{}, env map[string]string) error {
	var err error
	for _, v := range *m {
		if m, ok := v.(map[string]interface{}); ok {
			e := r.MapStringInterface(&m, env)
			if e != nil {
				err = helper.Join(err, e)
			}
		}
		if a, ok := v.([]interface{}); ok {
			e := r.SliceInterface(&a, env)
			if e != nil {
				err = helper.Join(err, e)
			}
		}
	}
	return err
}

func (r *ReplacerImpl) SliceString(m *[]string, env map[string]string) error {
	var err error
	for i, v := range *m {
		newV, e := r.String(v, env)
		if e != nil {
			err = helper.Join(err, e)
		}
		(*m)[i] = newV
	}
	return err
}

func (r *ReplacerImpl) Struct(s interface{}, env map[string]string) error {
	var err error
	v := reflect.ValueOf(s).Elem()
	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		if field.Kind() == reflect.String {
			oldStr := field.String()
			newStr, e := r.String(oldStr, env)
			if e != nil {
				err = helper.Join(err, e)
			}
			if oldStr != newStr {
				field.SetString(newStr)
			}
		}
		if field.Kind() == reflect.Map {
			iface := field.Interface()
			if m, ok := iface.(map[string]string); ok {
				e := r.Map(&m, env)
				if e != nil {
					err = helper.Join(err, e)
				}
			}
			if iface, ok := iface.(map[string]interface{}); ok {
				e := r.MapStringInterface(&iface, env)
				if e != nil {
					err = helper.Join(err, e)
				}
			}
		}
		if field.Kind() == reflect.Slice {
			iface := field.Interface()
			if a, ok := iface.([]interface{}); ok {
				e := r.SliceInterface(&a, env)
				if e != nil {
					err = helper.Join(err, e)
				}
			}
		}
	}
	return err
}

func (r *ReplacerImpl) String(s string, env map[string]string) (string, error) {
	var err error
	matches := r.ListMatches(s)
	for _, match := range matches {
		visited := map[string]bool{}
		new, e := r.match(match, env, visited)
		if e != nil {
			err = helper.Join(err, e)
		}
		s = strings.ReplaceAll(s, match, new)
	}
	return s, err
}

func (r *ReplacerImpl) match(m string, env map[string]string, visited map[string]bool) (string, error) {
	pattern := *r.selectMatchingPattern(m)
	contentPattern := regexp.MustCompile(pattern.start + `(.*?)` + pattern.end)
	v := contentPattern.FindStringSubmatch(m)[1]
	v = strings.TrimSpace(v)
	v = strings.TrimPrefix(v, pattern.varType+".")
	if visited[v] {
		if len(visited) == 1 {
			return "", &SelfReferenceError{Value: m}
		}
		return "", &CircularReferenceError{Value: m}
	}
	visited[v] = true
	if pattern.re.MatchString(env[v]) {
		return r.match(env[v], env, visited)
	}
	if env[v] == "" {
		return "", &NotFoundError{Value: v}
	}
	return env[v], nil
}

func (r *ReplacerImpl) selectMatchingPattern(m string) *Pattern {
	for _, p := range r.pattern {
		if p.re.MatchString(m) {
			return &p
		}
	}
	return nil
}

func (r *ReplacerImpl) ListMatches(s string) []string {
	var matches []string
	for _, p := range r.pattern {
		matches = append(matches, p.re.FindAllString(s, -1)...)
	}
	return matches
}

func FindAllReplacePatterns(s string) [][]string {
	p := NewPattern(`\S+`, PatternStart, PatternEnd)
	matches := p.re.FindAllStringSubmatch(s, -1)
	return matches
}

func IsValidReplacePattern(s string) bool {
	validPatterns := "(" + strings.Join(PatternVariableType, "|") + ")"
	p := NewPattern(validPatterns, PatternStart, PatternEnd)
	return p.re.MatchString(s)
}

func IsDeprecatedReplacePattern(s string) bool {
	deprecatedPatterns := "(" + strings.Join(DeprecatedVariableType, "|") + ")"
	p := NewPattern(deprecatedPatterns, PatternStart, PatternEnd)
	return p.re.MatchString(s)
}
