from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

with app.app_context():
    import views  # pylint: disable=W0611

if __name__ == '__main__':
    app.run()
