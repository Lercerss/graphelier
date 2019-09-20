FROM golang:1.13

WORKDIR /go/src/graphelier-service

COPY . .

RUN go install ...

CMD [ "graphelier-service" ]
