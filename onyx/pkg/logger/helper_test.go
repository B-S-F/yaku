//go:build unit
// +build unit

package logger

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

func TestLogKeyValueIndented(t *testing.T) {
	testCases := map[string]struct {
		key         string
		value       string
		indentation int
		want        string
	}{
		"should print key-value pair with indentation 2": {
			"key1",
			"value1",
			2,
			"  key1 value1",
		},
		"should print key-value pair with indentation 4": {
			"key2",
			"value2",
			4,
			"    key2 value2",
		},
		"should print only key if value is empty": {
			"key2",
			"",
			4,
			"    key2",
		},
		"should not print empty key-value strings": {
			"",
			"",
			2,
			"",
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			//  arrange
			observedZapCore, observedLogs := observer.New(zap.InfoLevel)
			observedLogger := &Log{
				Logger: zap.New(observedZapCore),
			}

			// act
			helper := NewHelper(observedLogger)
			helper.LogKeyValueIndented(tc.key, tc.value, tc.indentation)

			// assert
			if len(tc.want) == 0 {
				assert.Equal(t, 0, len(observedLogs.All()))
			} else {
				log := observedLogs.All()[0].Message
				assert.Equal(t, tc.want, log)
			}
		})
	}
}

func TestLogFormatMapIndented(t *testing.T) {
	testCases := map[string]struct {
		key         string
		value       map[string]string
		indentation int
		want        []string
	}{
		"should print non-empty map": {
			"non-empty",
			map[string]string{"key1": "value1", "key2": "value2"},
			4,
			[]string{
				"    non-empty",
				"      key1: value1",
				"      key2: value2",
			},
		},
		"should print nil map": {
			"nil",
			nil,
			2,
			[]string{
				"  nil",
			},
		},
		"should print empty map": {
			"empty",
			map[string]string{},
			2,
			[]string{
				"  empty",
			},
		},
		"should not print empty key-value strings": {
			"",
			nil,
			2,
			[]string{},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			//  arrange
			observedZapCore, observedLogs := observer.New(zap.InfoLevel)
			observedLogger := &Log{
				Logger: zap.New(observedZapCore),
			}

			// act
			helper := NewHelper(observedLogger)
			helper.LogFormatMapIndented(tc.key, tc.value, tc.indentation)

			// assert
			if len(tc.want) == 0 {
				assert.Equal(t, 0, len(observedLogs.All()))
			} else {
				allLogs := observedLogs.All()
				for _, log := range allLogs {
					assert.Contains(t, tc.want, log.Message)
				}
			}
		})
	}
}
