# **graphelier** Service

## Specifications

- Go version: `1.13`
- Python version: `3.5+`

## Runbook

All commands should be run from the `core/` directory. This repo should be placed within your go workspace.

### Install

Build and install the service executable inside your go `bin` directory:

```bash
go get -t graphelier/core/graphelier-service/...
```

### Launching graphelier-service

```bash
$GOPATH/bin/graphelier-service
```

### Testing

```bash
go test graphelier/core/graphelier-service/...
```

### Linting

```bash
go fmt graphelier/core/graphelier-service/...
```

### Golang ci bot
Run this command in the project's `root`
```bash
docker run --rm -v $(pwd):/goapp -e RUN=1 -e REPO=github.com/Lercerss/graphelier golangci/build-runner goenvbuild
```

## Scripts

All scripts should be run from the `core/scripts` directory.

### Loading Data

Load data from file containing messages

```bash
python -m importer <path_to_messages_file> <start_time> <instrument>
```

### Linting with docker

```sh
docker build --target=lint -t graphelier-scripts-lint ./core/scripts
docker run graphelier-scripts-lint
```

### Running tests with docker

```sh
docker build --target=test -t graphelier-scripts-test ./core/scripts
docker run graphelier-scripts-test
```
