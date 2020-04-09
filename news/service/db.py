from pymongo import MongoClient

_DB_CLIENT = MongoClient("mongodb://news-db:27017/news-db")
_DB_CLUSTERED_ARTICLES = _DB_CLIENT['news-db']['clusteredarticles']


def fetch_n_clusters_from_time(timestamp: int, n_clusters: int, direction: int):
    criteria = '$lt' if direction == -1 else '$gt'
    return _DB_CLUSTERED_ARTICLES \
        .find({'timestamp': {criteria: timestamp}}) \
        .sort([('timestamp', direction)]) \
        .limit(n_clusters)
