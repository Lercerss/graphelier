from mamba import description, it, before
from requests import Request
from news_fetcher import Fetcher, ArticlesEnhancer
from sure import expect  # pylint: disable=W0611

with description('News Fetcher:') as self:
    with before.all:
        self.fetcher = Fetcher("02202020", "03012020", 50, 30)  # date '-' stripped by argparser
        self.fetcher.tickers = ['SPY', 'AMZN', 'TSLA']
        self.fetcher.set_api_key_for_testing("FAKE")

    with it('should correctly build query dict'):
        self.fetcher.request_url = "http://localhost/endpoint/"
        query_dict = self.fetcher._prepare_query_dict()  # pylint: disable=W0212
        query_dict.should.equal({
            'items': '50',
            'type': 'article',
            'tickers': 'SPY,AMZN,TSLA',
            'date': '02202020-03012020',
            'token': 'FAKE',
            'page': '1'
        })

    with it('should build a complete request url'):
        self.fetcher.request_url = 'http://localhost/endpoint/'
        query_dict = self.fetcher._prepare_query_dict()  # pylint: disable=W0212
        prepared_request = Request('GET', self.fetcher.request_url, params=query_dict).prepare()
        prepared_request.url.should.equal('http://localhost/endpoint/?items=50&type=article&tickers=SPY%2CAMZN%2CTSLA'
                                          '&date=02202020-03012020&token=FAKE&page=1')

with description('Articles Enhancer:') as self:
    with before.all:
        raw_articles = [{
            "news_url": "http://www.zacks.com/stock/news/368687/3-large-cap-tech-stocks-for-"
                        "growth-investors-to-buy",
            "image_url": "https://cdn.snapi.dev/images/v1/a/m/amaz23.jpg",
            "title": "3 Large-Cap Tech Stocks for Growth Investors to Buy: Amazon",
            "text": "We have highlighted three large-cap tech stocks that investors might "
                    "want to consider buying right now on the back of solid longer-term g"
                    "rowth outlooks.",
            "source_name": "Zacks Investment Research",
            "date": "Mon, 01 Apr 2019 19:09:00 -0400",
            "topics": [],
            "sentiment": "Positive",
            "type": "Article",
            "tickers": [
                "AMZN"
            ]
        }, {
            "news_url": "http://feeds.marketwatch.com/~r/marketwatch/internet/~3/ogBOL"
                        "a7cpJQ/story.asp",
            "image_url": "https://cdn.snapi.dev/images/v1/w/h/whf6.jpg",
            "title": "The Wall Street Journal: Amazon plans broad price cuts at Whole Foods "
                     "\this week",
            "text": "Amazon.com Inc. is planning to cut prices on hundreds of items at Whole"
                    "Foods stores this week, as the e-commerce giant seeks to change the "
                    "chain\u2019s high-cost image amid intense competition among grocers.",
            "source_name": "Market Watch",
            "date": "Mon, 01 Apr 2019 16:35:36 -0400",
            "topics": [],
            "sentiment": "Positive",
            "type": "Article",
            "tickers": [
                "AMZN"
            ]
        }]
        self.articles_enhancer = ArticlesEnhancer(raw_articles)

    with it('should populate well formed Article objects as its member'):
        articles = self.articles_enhancer.articles
        articles[0].article_url.should.equal("http://www.zacks.com/stock/news/368687/3-large-cap-tech-stocks-for-"
                                             "growth-investors-to-buy")
        articles[1].article_url.should.equal("http://feeds.marketwatch.com/~r/marketwatch/internet/~3/"
                                             "ogBOLa7cpJQ/story.asp")
        len(articles).should.equal(2)
        for article in articles:
            article.summary.should.equal('')
            article.timestamp.should.equal('')

    with it('should add a timestamp attribute to the object'):
        self.articles_enhancer._dates_to_epoch()  # pylint: disable=W0212

        self.articles_enhancer.articles[0].timestamp.should.equal("1554160140")
        self.articles_enhancer.articles[1].timestamp.should.equal("1554150936")
