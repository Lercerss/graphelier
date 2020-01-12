FROM golang:1.13-alpine AS base
WORKDIR /go/src/graphelier/core/graphelier-service

FROM base AS builder
RUN apk add --no-cache build-base git mercurial
COPY graphelier-service .
RUN go get graphelier/core/graphelier-service
RUN go build graphelier/core/graphelier-service

FROM builder AS test
CMD ["go", "test", "graphelier/core/graphelier-service/..."]

FROM builder AS dev
RUN go get github.com/gravityblast/fresh
EXPOSE 5050
CMD [ "fresh" ]

FROM base as prod
COPY --from=builder /go/src/graphelier/core/graphelier-service/graphelier-service /bin/graphelier-service
CMD [ "graphelier-service" ]