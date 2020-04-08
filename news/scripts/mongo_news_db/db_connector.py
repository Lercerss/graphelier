from typing import List

import pymongo

from models.news import Article, Cluster

_DB_CLIENT = pymongo.MongoClient("mongodb://127.0.0.1:27016/")
_DB_ARTICLES = _DB_CLIENT["news-db"]["articles"]
_DB_CLUSTERED_ARTICLES = _DB_CLIENT["news-db"]["clusteredarticles"]

def upsert_articles(articles: List[Article]):
    """
    Upserts a list of article documents
    """
    articles_upserts = [pymongo.ReplaceOne({'article_url': article.article_url}, article.__dict__, upsert=True)
                        for article in articles]
    _DB_ARTICLES.bulk_write(articles_upserts)

def fetch_all():
    """Gets all articles in the database
    """
    return _DB_ARTICLES.find()

def insert_cluster(cluster: Cluster):
    _DB_CLUSTERED_ARTICLES.insert(cluster.__dict__)

def delete_clusters():
    _DB_CLUSTERED_ARTICLES.delete_many({})
