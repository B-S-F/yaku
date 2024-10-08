package v0

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

var oldConfigBytes = []byte(`header:
    name: External dependencies
    version: 1.16.0
components:
    webApp:
        version: 1.16.5
globals:
    VAR_1: global1_var_1
dependencies:
    '@grow/jira-fetcher': '^0.1.0'
    typescript-app: git+https://${GITHUB_PRIVATE_ACCESSTOKEN}@github.com/B-S-F/typescript-app-template
    typescript-app-master: git+https://${GITHUB_PRIVATE_ACCESSTOKEN}@github.com/B-S-F/typescript-app-template#master
autopilots:
    dummy-autopilot:
        run: |
            echo "{\"status\":\"GREEN\"}"
        env:
            VAR_2: autopilot1_var_2
reports:
    dummy-report: dummy-autopilot
finalize:
    run: |
        html-finalizer
        zip-finalizer
allocations:
    "1":
        title: Title
        text: Text
        requirements:
            "1.1":
                title: Title
                text: Text
                checks:
                    "1.1":
                        title: Title
                        components:
                            - webApp
                        reports:
                            - dummy-report
                            - dummy-report:
                                autopilot: dummy-autopilot
                                env:
                                    VAR_2: autopilot1_var_2
            "1.2":
                title: Title
                text: Text
                manualStatus: "GREEN"
                reason: "This is a reason"
            "1.3":
                title: Title
                text: Text
`)

func TestNew(t *testing.T) {
	config, err := New(oldConfigBytes)
	assert.NoError(t, err)
	assert.NotNil(t, config)
	assert.Equal(t, "1.16.0", config.(*Config).Header.Version)
	assert.Equal(t, "External dependencies", config.(*Config).Header.Name)
	assert.Equal(t, "1.16.5", config.(*Config).Components["webApp"].Version)
	assert.Equal(t, "global1_var_1", config.(*Config).Globals["VAR_1"])
	assert.Equal(t, "^0.1.0", config.(*Config).Dependencies["@grow/jira-fetcher"])
	assert.Equal(t, "git+https://${GITHUB_PRIVATE_ACCESSTOKEN}@github.com/B-S-F/typescript-app-template", config.(*Config).Dependencies["typescript-app"])
	assert.Equal(t, "git+https://${GITHUB_PRIVATE_ACCESSTOKEN}@github.com/B-S-F/typescript-app-template#master", config.(*Config).Dependencies["typescript-app-master"])
	assert.Contains(t, config.(*Config).Autopilots["dummy-autopilot"].Run, "echo")
	assert.Equal(t, "autopilot1_var_2", config.(*Config).Autopilots["dummy-autopilot"].Env["VAR_2"])
	assert.Equal(t, "dummy-autopilot", config.(*Config).Reports["dummy-report"])
	assert.Contains(t, config.(*Config).Finalize.Run, "html-finalizer")
	assert.Contains(t, config.(*Config).Finalize.Run, "zip-finalizer")
	assert.Equal(t, "Title", config.(*Config).Allocations["1"].Title)
	assert.Equal(t, "Text", config.(*Config).Allocations["1"].Requirements["1.1"].Text)
	assert.Equal(t, "Title", config.(*Config).Allocations["1"].Requirements["1.1"].Checks["1.1"].Title)
	assert.Equal(t, "webApp", config.(*Config).Allocations["1"].Requirements["1.1"].Checks["1.1"].Components[0])
	assert.Equal(t, "dummy-report", config.(*Config).Allocations["1"].Requirements["1.1"].Checks["1.1"].Reports[0])
	assert.Equal(t, "GREEN", config.(*Config).Allocations["1"].Requirements["1.2"].ManualStatus)
	assert.Equal(t, "This is a reason", config.(*Config).Allocations["1"].Requirements["1.2"].Reason)
	assert.Equal(t, "Title", config.(*Config).Allocations["1"].Requirements["1.3"].Title)
	assert.Equal(t, "Text", config.(*Config).Allocations["1"].Requirements["1.3"].Text)
}

func TestMigrate(t *testing.T) {
	expectedNewConfigBytes := []byte(`metadata:
    version: v1
header:
    name: External dependencies
    version: 1.16.0
env:
    VAR_1: global1_var_1
autopilots:
    dummy-autopilot:
        run: |
            echo "{\"status\":\"GREEN\"}"
        env:
            VAR_2: autopilot1_var_2
finalize:
    run: |
        html-finalizer
        zip-finalizer
chapters:
    "1":
        title: Title
        text: Text
        requirements:
            "1.1":
                title: Title
                text: Text
                checks:
                    1.1--0:
                        title: Title--0
                        automation:
                            autopilot: dummy-autopilot
                    1.1--1:
                        title: Title--1
                        automation:
                            autopilot: dummy-autopilot
                            env:
                                VAR_2: autopilot1_var_2
            "1.2":
                title: Title
                text: Text
                checks:
                    "1":
                        title: Title_check
                        manual:
                            status: GREEN
                            reason: This is a reason
            "1.3":
                title: Title
                text: Text
                checks:
                    "1":
                        title: Title_check
                        manual:
                            status: UNANSWERED
                            reason: Not answered
`)

	config, err := New(oldConfigBytes)
	assert.NoError(t, err)
	newConfigBytes, err := config.Migrate()
	assert.NoError(t, err)
	assert.Equal(t, string(expectedNewConfigBytes), string(newConfigBytes))
}

func TestParse(t *testing.T) {
	config := Config{}
	_, err := config.Parse()
	assert.Error(t, err)
}
