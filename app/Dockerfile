FROM node:10.16.3 AS base
WORKDIR /app
COPY package*.json /app/

FROM base AS builder
RUN npm install
COPY . .

FROM builder AS dev
CMD [ "npm", "start" ] 

FROM builder AS test
ENV CI true
CMD [ "npm", "test" ]

FROM builder AS lint
CMD [ "npm", "run", "lint", "src/" ]