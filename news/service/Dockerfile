FROM python:3.7.4 as builder
WORKDIR /graphelier-news
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

FROM builder AS dev
EXPOSE 8080
ENTRYPOINT [ "python" ]
CMD ["main.py"]
