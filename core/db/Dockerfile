FROM mongo:4.2

COPY db_setup.js /docker-entrypoint-initdb.d/

EXPOSE 27017

CMD [ "mongod" ]