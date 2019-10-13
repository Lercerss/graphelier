# Graphelier

[![CircleCI](https://circleci.com/gh/Lercerss/graphelier.svg?style=svg)](https://circleci.com/gh/Lercerss/graphelier)
Displays detailed exchange order book contents

## Running the Application

```sh
docker-compose up
```

## Running the frontend linter with docker

```sh
docker build --target=lint -t graphelier-app-lint ./app
docker run graphelier-app-lint
```

## Running the frontend tests with docker

```sh
docker build --target=test -t graphelier-app-test ./app
docker run graphelier-app-test
```

## Running the backend linter with docker

```sh
docker build --target=lint -t graphelier-service-test ./core
docker run graphelier-service-test
```

## Running the python scripts linter with docker

```sh
docker build --target=lint -t graphelier-scripts-lint ./core/scripts
docker run graphelier-scripts-lint
```

## Running the python scripts' tests with docker

```sh
docker build --target=test -t graphelier-scripts-test ./core/scripts
docker run graphelier-scripts-test
```
