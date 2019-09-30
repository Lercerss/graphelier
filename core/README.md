# **graphelier** Service

## Specifications

- Go version: `1.13`
- Python version: `3.5+`

## Runbook

All commands should be run from the `core/` directory. This repo should be placed within your go workspace.

### Install

Build and install the service executable inside your go `bin` directory:

```bash
go install ...
```

### Launching graphelier-service

```bash
$GOPATH/bin/graphelier-service
```

### Testing

```bash
go test ...
```

## Scripts

All scripts should be run from the `core/scripts` directory.

### Loading Data

Load data from file containing messages

```bash
python -m importer <path_to_messages_file> <start_time>
```
