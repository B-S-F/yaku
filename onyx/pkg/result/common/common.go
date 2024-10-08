package common

import (
	"strings"

	"gopkg.in/yaml.v3"
)

type StringMap map[string]string

func (m StringMap) MarshalYAML() (interface{}, error) {
	node := yaml.Node{
		Kind: yaml.MappingNode,
	}

	for k, v := range m {
		node.Content = append(node.Content, &yaml.Node{
			Kind:  yaml.ScalarNode,
			Tag:   "!!str",
			Value: k,
		})
		node.Content = append(node.Content, &yaml.Node{
			Kind:  yaml.ScalarNode,
			Tag:   "!!str",
			Value: trimLeftSpace(v),
			Style: yaml.DoubleQuotedStyle,
		})
	}

	return &node, nil
}

type MultilineString string

func (m MultilineString) MarshalYAML() (interface{}, error) {
	node := yaml.Node{
		Kind:  yaml.ScalarNode,
		Tag:   "!!str",
		Value: trimLeftSpace(string(m)),
	}

	return &node, nil
}

func trimLeftSpace(s string) string {
	return strings.TrimLeft(s, " \t")
}
