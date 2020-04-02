import flask
from flask import request, jsonify
from pymongo import MongoClient

app = flask.Flask(__name__)
app.config['DEBUG'] = True
db_client = MongoClient('localhost', 27016)
db = db_client['news-db']


@app.route('/', methods=['GET'])
def hello():
    return 'Hello Graphelier :)'

# TODO: remove example route contract
@app.route('/sample/1', methods=['GET'])
def sample1():
    cats = [
        {
            'id': 1,
            'name': 'jazz',
            'nickname': 'the cat'
        },
        {
            'id': 2,
            'name': 'tiger',
            'nickname': 'beans'
        },
        {
            'id': 3,
            'name': 'momo',
            'nickname': 'long boy'
        }
    ]
    return jsonify(cats)

# TODO: remove example route with query parameter
@app.route('/sample/2', methods=['GET'])
def sample2():
    num = int(request.args['num'])
    return jsonify(num)


app.run(host='0.0.0.0', port=8080)
