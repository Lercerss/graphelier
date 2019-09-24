FROM golang:1.13

WORKDIR /go/src/graphelier-service

RUN go get github.com/pilu/fresh

COPY graphelier-service .

RUN go install ...

CMD [ "fresh" ]
