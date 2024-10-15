package runner

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/B-S-F/yaku/onyx/pkg/helper"
	"github.com/B-S-F/yaku/onyx/pkg/logger"
	"github.com/B-S-F/yaku/onyx/pkg/v2/model"
	"github.com/netflix/go-iomux"
	errs "github.com/pkg/errors"
	"go.uber.org/zap"
)

type Subprocess struct {
	logger logger.Logger
}

func NewSubprocess(logger logger.Logger) *Subprocess {
	return &Subprocess{
		logger: logger,
	}
}

func (s *Subprocess) Execute(input *Input, timeout time.Duration) (*Output, error) {
	cmd, ctx, cancel := s.initCommand(input, timeout)
	defer cancel()
	// start command
	s.logger.Debug("Starting command", zap.String("cmd", input.Cmd), zap.Strings("args", input.Args))
	mux := iomux.NewMuxUnixGram[string]()
	defer mux.Close()
	cmd.Stdout, _ = mux.Tag(stdOutSourceType)
	cmd.Stderr, _ = mux.Tag(stdErrSourceType)

	out := &Output{WorkDir: input.WorkDir}
	chunks, err := mux.ReadWhile(func() error {
		out.ExitCode = s.runCommand(cmd, ctx)
		return nil
	})
	if err != nil {
		return nil, errs.Wrap(err, "Failed to read command response")
	}

	s.demuxLogs(input, out, chunks)

	if out.ExitCode == 124 {
		out.Logs = append(out.Logs, model.LogEntry{Source: stdErrSourceType, Text: fmt.Sprintf("Command timed out after %s", timeout)})
	}

	return out, nil
}

type streamParser struct {
	buf []byte
}

func (p *streamParser) parse(chunk []byte) []string {
	lines := bytes.Split(chunk, []byte("\n"))
	if len(p.buf) > 0 {
		lines[0] = append(p.buf, lines[0]...)
	}
	lines, rest := lines[:len(lines)-1], lines[len(lines)-1]
	p.buf = rest

	var entries []string
	for _, line := range lines {
		entries = append(entries, string(line))
	}
	return entries
}

func (p *streamParser) end() (bool, string) {
	if len(p.buf) > 0 {
		line := string(p.buf)
		p.buf = []byte{}
		return true, line
	}
	return false, ""
}

func (s *Subprocess) demuxLogs(in *Input, out *Output, chunks []*iomux.TaggedData[string]) {
	demuxed := map[string][]string{
		stdOutSourceType: {},
		stdErrSourceType: {},
	}
	parsers := make(map[string]*streamParser)
	order := []string{}

	for stream := range demuxed {
		parsers[stream] = &streamParser{}
	}

	for _, chunk := range chunks {
		parser := parsers[chunk.Tag]
		lines := parser.parse(chunk.Data)
		demuxed[chunk.Tag] = append(demuxed[chunk.Tag], lines...)
		for range lines {
			order = append(order, chunk.Tag)
		}
	}

	for _, stream := range []string{stdOutSourceType, stdErrSourceType} {
		if ok, leftover := parsers[stream].end(); ok {
			demuxed[stream] = append(demuxed[stream], leftover)
			order = append(order, stream)
		}
	}

	for stream, lines := range demuxed {
		demuxed[stream] = helper.HideSecretsInArrayOfLines(lines, in.Secrets)
	}

	for _, stream := range order {
		line := demuxed[stream][0]
		demuxed[stream] = demuxed[stream][1:]
		if line == "" {
			continue
		}
		entry := model.LogEntry{Source: stream}
		if json.Valid([]byte(line)) {
			decoder := json.NewDecoder(strings.NewReader(line))
			decoder.UseNumber()
			_ = decoder.Decode(&entry.Json)
			if stream == stdOutSourceType {
				out.JsonData = append(out.JsonData, entry.Json)
			}
		} else {
			entry.Text = line
		}
		out.Logs = append(out.Logs, entry)
	}
}

func (s *Subprocess) initCommand(input *Input, timeout time.Duration) (*exec.Cmd, context.Context, context.CancelFunc) {
	// context with timeout
	if timeout <= 0 {
		s.logger.Warnf("Timeout is set to '%s'. Please make sure this is intended.", timeout)
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	// init command
	cmd := exec.CommandContext(ctx, input.Cmd, input.Args...)
	if input.WorkDir != "" {
		cmd.Dir = input.WorkDir
	}
	cmd.Env = append(cmd.Env, os.Environ()...)
	for k, v := range input.Env {
		cmd.Env = append(cmd.Env, []string{fmt.Sprintf("%s=%s", k, v)}...)
	}
	return cmd, ctx, cancel
}

func (s *Subprocess) runCommand(cmd *exec.Cmd, ctx context.Context) int {
	s.logger.Debug("Starting command", zap.String("cmd", cmd.String()))
	err := cmd.Run()
	if ctx.Err() == context.DeadlineExceeded {
		s.logger.Debug("Command timed out", zap.String("cmd", cmd.String()))
		return 124
	}
	s.logger.Debug("Command finished", zap.String("cmd", cmd.String()), zap.Error(err))
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			return exitError.ExitCode()
		} else {
			s.logger.Errorf("Unknown error while executing command: %s", err)
			return -1
		}
	}
	return 0
}
