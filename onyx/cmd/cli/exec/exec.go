package exec

import (
	"errors"
	"path/filepath"
	"strings"
	"time"

	onyx "github.com/B-S-F/onyx/internal/onyx/exec"
	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

const DefaultTimeout = 10 * 60

func ExecCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "exec [input-folder]",
		Short: "Executes the project",
		Long:  "If no input folder is specified the current directory is used",
		Args:  cobra.MaximumNArgs(1),
		RunE:  Run,
	}
	cmd.Flags().String("output-dir", ".", "output folder, defaults to the current directory")
	cmd.Flags().String("secrets-name", onyx.SECRETS_FILE, "Name of the secrets file in the input folder")
	cmd.Flags().String("vars-name", onyx.VARS_FILE, "Path to the variables file")
	cmd.Flags().String("config-name", "qg-config.yaml", "Path to the config file")
	cmd.Flags().Bool("strict", false, "If set to true, the autopilot will return a ERROR status if the JSON line output is not valid")
	cmd.Flags().Int("check-timeout", DefaultTimeout, "Timeout for a each check in seconds")
	cmd.Flags().StringP("check", "c", "", "Used with a value in the format <chapterId>_<requirementId>_<checkId> to select a single check to run, others will be skipped")
	return cmd
}

func Run(cmd *cobra.Command, args []string) error {
	inputFolder := "."
	if len(args) != 0 {
		inputFolder = args[0]
	}
	_ = viper.BindPFlag("output-dir", cmd.Flags().Lookup("output-dir"))
	_ = viper.BindPFlag("secrets-name", cmd.Flags().Lookup("secrets-name"))
	_ = viper.BindPFlag("vars-name", cmd.Flags().Lookup("vars-name"))
	_ = viper.BindPFlag("config-name", cmd.Flags().Lookup("config-name"))
	_ = viper.BindPFlag("strict", cmd.Flags().Lookup("strict"))
	_ = viper.BindPFlag("check-timeout", cmd.Flags().Lookup("check-timeout"))
	_ = viper.BindPFlag("check", cmd.Flags().Lookup("check"))

	execParams := parameter.ExecutionParameter{
		Strict:          viper.GetBool("strict"),
		InputFolder:     filepath.Clean(inputFolder),
		OutputFolder:    filepath.Clean(viper.GetString("output-dir")),
		ConfigName:      viper.GetString("config-name"),
		VarsName:        viper.GetString("vars-name"),
		SecretsName:     viper.GetString("secrets-name"),
		CheckIdentifier: viper.GetString("check"),
		CheckTimeout:    viper.GetDuration("check-timeout") * time.Second,
	}

	if !strings.HasPrefix(execParams.SecretsName, onyx.SECRETS_FILE) {
		return errors.New("secrets file name should start with '.secrets'")
	}
	if !strings.HasPrefix(execParams.VarsName, onyx.VARS_FILE) {
		return errors.New("vars file name should start with '.vars'")
	}
	if execParams.CheckTimeout <= 0 {
		return errors.New("check-timeout value should be a positive number")
	}
	return onyx.Exec(execParams)
}
