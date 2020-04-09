import flask

NEWS_SERVER_PORT = 8080

app = flask.Flask(__name__)

with app.app_context():
    import views  # pylint: disable=W0611

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=NEWS_SERVER_PORT)
