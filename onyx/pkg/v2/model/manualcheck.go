package model

import (
	conf "github.com/B-S-F/onyx/pkg/configuration"
)

type ManualCheck struct {
	Item
	Manual conf.Manual
}

type ManualResult struct {
	Status string
	Reason string
}
