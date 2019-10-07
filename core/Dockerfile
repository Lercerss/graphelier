FROM golang:1.13

WORKDIR /go/src/graphelier/core/graphelier-service

RUN go get github.com/pilu/fresh

COPY graphelier-service .

RUN go get graphelier/core/graphelier-service

RUN go install ...

EXPOSE 5050

CMD [ "fresh" ]
