package schema

import (
	onyx "github.com/B-S-F/onyx/internal/onyx/schema"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func SchemaCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:       "schema [config|result]",
		Short:     "Get the schema of the config",
		ValidArgs: []string{"config", "result"},
		Args:      validateArgs,
		RunE:      Run,
	}
	cmd.Flags().String("version", "v1", "version of the config to generate the schema for")
	cmd.Flags().String("output", "stdout", "output file, defaults to stdout")
	return cmd
}

func Run(cmd *cobra.Command, args []string) error {
	if len(args) == 0 {
		args = append(args, "config")
	}
	kind := args[0]
	_ = viper.BindPFlag("version", cmd.Flags().Lookup("version"))
	_ = viper.BindPFlag("output", cmd.Flags().Lookup("output"))
	version := viper.GetString("version")
	output := viper.GetString("output")
	logger.Set(logger.NewCommon(logger.Settings{
		File: "onyx.log",
	}))
	return onyx.Schema(kind, version, output)
}

func validateArgs(cmd *cobra.Command, args []string) error {
	if len(args) > 1 {
		return cobra.MaximumNArgs(1)(cmd, args)
	}
	return cobra.OnlyValidArgs(cmd, args)
}
