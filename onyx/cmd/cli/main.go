package main

import (
	"errors"
	"os"
	"strings"

	"github.com/B-S-F/yaku/onyx/cmd/cli/exec"
	"github.com/B-S-F/yaku/onyx/cmd/cli/migrate"
	"github.com/B-S-F/yaku/onyx/cmd/cli/schema"
	"github.com/B-S-F/yaku/onyx/pkg/helper"
	"github.com/B-S-F/yaku/onyx/pkg/logger"
	"github.com/B-S-F/yaku/onyx/pkg/v2/model"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

const version = "0.12.0"

var (
	logLevel = "log-level"
)

func rootCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "onyx",
		Short:   "The onyx cli tool",
		Version: version,
		Run: func(cmd *cobra.Command, args []string) {
			_ = cmd.Help()
		},
	}
	cobra.OnInitialize(initViper)
	initFlags(cmd)
	return cmd
}

func initViper() {
	viper.SetConfigType("yaml")
	viper.SetConfigName("onyx")
	viper.AddConfigPath(".")
	viper.AddConfigPath("$HOME/.onyx")
	viper.AddConfigPath("/etc/onyx")
	viper.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))
	viper.SetEnvPrefix("ONYX")
	viper.AutomaticEnv()
}

func initFlags(cmd *cobra.Command) {
	cmd.PersistentFlags().StringP(logLevel, "", "info", "log level, one of: debug, info, warn, error, fatal, panic")
	_ = viper.BindPFlag(logLevel, cmd.PersistentFlags().Lookup(logLevel))
	cmd.AddCommand(exec.ExecCommand())
	cmd.AddCommand(migrate.MigrateCommand())
	cmd.AddCommand(schema.SchemaCommand())
	cmd.SilenceErrors = true
}

func Execute(cmd *cobra.Command) {
	log := logger.Get()
	helper.ToolVersion = version // do not delete this line
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Debug("no viper config file found, using defaults")
		} else {
			log.Error(err.Error())
			os.Exit(2)
		}
	}
	if err := cmd.Execute(); err != nil {
		var userErr model.UserError
		if errors.As(err, &userErr) {
			log.Warn(userErr.Reason())
			os.Exit(1)
		}

		log.Error(err.Error())
		os.Exit(1)
	}
}

func main() {
	Execute(rootCmd())
}
