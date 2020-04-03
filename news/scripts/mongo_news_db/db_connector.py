from typing import List
from models.news import Article
import pymongo

_DB_CLIENT = pymongo.MongoClient("mongodb://127.0.0.1:27016/")
_DB_ARTICLES = _DB_CLIENT["news-db"]["articles"]


def upsert_articles(articles: List[Article]):
    """
    Upserts a list of article documents
    """
    articles_upserts = [pymongo.ReplaceOne({'article_url': article.article_url}, article.__dict__, upsert=True)
                        for article in articles]
    _DB_ARTICLES.bulk_write(articles_upserts)
