FROM node:10.16.3 AS base
WORKDIR /app
COPY package*.json /app/

FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

FROM builder AS dev
CMD [ "npm", "start" ]

FROM nginx:alpine AS prod
COPY --from=builder /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]