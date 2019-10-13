FROM golang:1.13-alpine AS base
WORKDIR /go/src/graphelier/core/graphelier-service

FROM base AS builder
RUN apk add --no-cache build-base git mercurial
COPY graphelier-service .
RUN go get graphelier/core/graphelier-service
RUN go install ...

FROM builder AS lint
RUN wget -O - -q https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh| sh -s v1.20.0 -b /bin
CMD [ "./bin/golangci-lint", "run" ]

FROM builder AS dev
RUN go get github.com/pilu/fresh
EXPOSE 5050
CMD [ "fresh" ]

FROM base as prod
COPY --from=builder /go/bin/graphelier-service ./graphelier-service
CMD [ "graphelier-service" ]