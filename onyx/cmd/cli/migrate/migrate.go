// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package migrate

import (
	"path/filepath"

	onyx "github.com/B-S-F/yaku/onyx/internal/onyx/migrate"
	"github.com/B-S-F/yaku/onyx/pkg/logger"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func MigrateCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "migrate [config-file]",
		Short: "Migrates the config to a specific version",
		Args:  cobra.ExactArgs(1),
		RunE:  Run,
	}
	cmd.Flags().String("target-version", "v1", "target version of the configuration file")
	cmd.Flags().String("output", "stdout", "output file, defaults to stdout")
	return cmd
}

func Run(cmd *cobra.Command, args []string) error {
	_ = viper.BindPFlag("target-version", cmd.Flags().Lookup("target-version"))
	_ = viper.BindPFlag("output", cmd.Flags().Lookup("output"))
	version := viper.GetString("target-version")
	output := viper.GetString("output")
	filepath := filepath.Clean(args[0])
	logger.Set(logger.NewConsoleFileLogger(logger.Settings{
		Files: []string{"onyx.log"},
	}))
	return onyx.Migrate(version, filepath, output)
}
