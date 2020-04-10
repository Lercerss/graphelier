FROM python:3.7.4 as builder
WORKDIR /news/service
COPY . .
RUN pip install -r requirements.txt

FROM builder AS dev
ENV FLASK_APP=server.py
ENV FLASK_DEBUG=1
ENV FLASK_ENV=development
EXPOSE 8080
CMD [ "python", "-m", "flask", "run", "--host", "0.0.0.0", "--port", "8080" ]

FROM dev AS prod
ENV FLASK_DEBUG=0
ENV FLASK_ENV=production
