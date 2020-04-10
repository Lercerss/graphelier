import flask

app = flask.Flask(__name__)

with app.app_context():
    import views  # pylint: disable=W0611

if __name__ == '__main__':
    app.run()
