FROM python:3.7.4 as builder
WORKDIR /scripts
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

FROM builder as lint
CMD [ "pylint", "scripts" ]

FROM builder as test
CMD [ "python", "-m", "unittest", "-b" ]
