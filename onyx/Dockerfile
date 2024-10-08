FROM golang:alpine AS build

WORKDIR /go/src

COPY go.mod ./
COPY go.sum ./
RUN go mod download
COPY cmd ./cmd
COPY pkg ./pkg
COPY internal ./internal
RUN go build -o onyx ./cmd/cli/main.go

FROM alpine:3 AS runtime
COPY --from=build --chmod=755 /go/src/onyx onyx
ENTRYPOINT [ "./onyx", "exec",  "qg-config.yaml", "--log-level", "debug" ]