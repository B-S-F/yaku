//go:build unit
// +build unit

package schema

import (
	"testing"

	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockSchema struct {
	mock.Mock
}

func (s *mockSchema) Load(config interface{}) error {
	args := s.Called(config)
	return args.Error(0)
}

func (s *mockSchema) JSON() []byte {
	args := s.Called()
	return args.Get(0).([]byte)
}

func (s *mockSchema) Validate(content []byte) error {
	args := s.Called(content)
	return args.Error(0)
}

type mockConfigCreator struct {
	mock.Mock
}

func (c *mockConfigCreator) Empty(version string) (interface{}, error) {
	args := c.Called(version)
	return args.Get(0), args.Error(1)
}

func (c *mockConfigCreator) New(version string, content []byte) (interface{}, error) {
	args := c.Called(version, content)
	return args.Get(0), args.Error(1)
}

func TestRunConfigSchema(t *testing.T) {
	configCreator := &mockConfigCreator{}
	schema := &mockSchema{}
	emptyMock := configCreator.On("Empty", mock.Anything)
	loadMock := schema.On("Load", mock.Anything)
	schema.On("JSON").Return([]byte("test"))

	t.Run("should return JSON schema", func(t *testing.T) {
		emptyMock.Return(nil, nil).Once()
		loadMock.Return(nil).Once()
		expected := []byte("test")

		got, err := runConfigSchema(mock.Anything, configCreator, schema)
		assert.NoError(t, err)
		assert.Equal(t, expected, got)

	})
	t.Run("should return error if config creator returns error", func(t *testing.T) {
		emptyMock.Return(nil, assert.AnError).Once()

		_, err := runConfigSchema(mock.Anything, configCreator, schema)
		assert.Error(t, err)
	})
	t.Run("should return error if schema load returns error", func(t *testing.T) {
		emptyMock.Return(nil, nil).Once()
		loadMock.Return(errors.New("test")).Once()
		_, err := runConfigSchema(mock.Anything, configCreator, schema)
		assert.Error(t, err)
	})
}

func TestRunResultSchema(t *testing.T) {
	schema := &mockSchema{}
	loadMock := schema.On("Load", mock.Anything)
	schema.On("JSON").Return([]byte("test"))

	t.Run("should return JSON schema", func(t *testing.T) {
		loadMock.Return(nil).Once()
		expected := []byte("test")
		got, err := runResultSchema("v1", schema)
		assert.NoError(t, err)
		assert.Equal(t, expected, got)

	})
	t.Run("should return error if schema load returns error", func(t *testing.T) {
		loadMock.Return(errors.New("test")).Once()
		_, err := runResultSchema("v1", schema)
		assert.Error(t, err)
	})
}
