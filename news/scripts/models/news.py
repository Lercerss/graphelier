class Article:
    """
    Represents a single article with its own URL and source
    """

    def __init__(self, image_url, title, text, source_name, date, sentiment, tickers, **kwargs):
        self.article_url = kwargs['news_url']
        self.image_url = image_url
        self.title = title
        self.text = text
        self.source_name = source_name
        self.date = date
        self.sentiment = sentiment
        self.tickers = tickers
        self.summary = ''
        self.timestamp = ''

    def __eq__(self, other):
        return self.article_url == self.article_url

    def __str__(self):
        return '''
        Article title: {}
        Summary: {}'''.format(self.title, self.summary)

    def __repr__(self):
        return self.__str__()

class Cluster:
    """
    Represents a single cluster of news articles
    """
    def __init__(self, articles, timestamp):
        self.articles = articles
        self.timestamp = timestamp
        self.size = len(articles)
