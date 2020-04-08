from mamba import description, it, before
from requests import Request, Response, Session
from models.news import Article
from news_fetcher import Fetcher, ArticlesEnhancer, _clean_text, _should_fetch_text
from sure import expect  # pylint: disable=W0611
from unittest.mock import MagicMock

with description('News Fetcher:') as self:
    with before.all:
        self.fetcher = Fetcher("02202020", "03012020", 50, 30,
                               MagicMock(),
                               MagicMock(),
                               ArticlesEnhancer(MagicMock()))  # date '-' stripped by argparser
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

    with it('should clean a text and strip it of line breaks, tabs, and unwanted chars'):
        sample_text = "\tWe have highlighted three large-cap tech stocks that investors might " \
                      "want to \tconsider buying right now on the back of solid longer-term g" \
                      "rowth outlooks.\n"
        cleaned_text = _clean_text(sample_text)
        cleaned_text.should.equal('We have highlighted three large-cap tech stocks '  # pylint: disable=E1101
                                  'that investors might want to '
                                  'consider buying right now on the back of solid longer-term growth outlooks.')

    with it('should run the fetcher with correct API calls'):
        resp_mock = Response()
        resp_mock.json = MagicMock(return_value={
            'data': [{
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
            }],
            'total_pages': 1
        })
        resp_mock.raise_for_status = MagicMock()
        session_mock = Session()
        session_mock.send = MagicMock(return_value=resp_mock)
        article_enhancer_mock = ArticlesEnhancer(MagicMock())
        article_enhancer_mock._fetch_full_texts = MagicMock()  # pylint: disable=W0212
        article_enhancer_mock._add_nlp_summaries = MagicMock()  # pylint: disable=W0212
        article_enhancer_mock._dates_to_epoch = MagicMock()  # pylint: disable=W0212
        self.fetcher = Fetcher("02202020", "03012020", 50, 30,
                               session_mock,
                               MagicMock(),
                               article_enhancer_mock)
        self.fetcher.tickers = ['SPY', 'AMZN', 'TSLA']
        self.fetcher.set_api_key_for_testing("FAKE")
        self.fetcher.request_url = 'http://localhost/endpoint/'
        self.fetcher.run()
        session_mock.send.assert_called()
        article_enhancer_mock._fetch_full_texts.assert_called()  # pylint: disable=W0212
        article_enhancer_mock._add_nlp_summaries.assert_called()  # pylint: disable=W0212
        article_enhancer_mock._dates_to_epoch.assert_called()  # pylint: disable=W0212
        self.fetcher.count.should.equal(1)
        self.fetcher.cur_page.should.equal(2)

    with it('should run the fetcher with a StockNewsAPI response with no data'):
        resp_mock = Response()
        resp_mock.json = MagicMock(return_value={})
        resp_mock.raise_for_status = MagicMock()
        session_mock = Session()
        session_mock.send = MagicMock(return_value=resp_mock)
        article_enhancer_mock = ArticlesEnhancer(MagicMock())
        article_enhancer_mock._fetch_full_texts = MagicMock()  # pylint: disable=W0212
        article_enhancer_mock._add_nlp_summaries = MagicMock()  # pylint: disable=W0212
        article_enhancer_mock._dates_to_epoch = MagicMock()  # pylint: disable=W0212
        self.fetcher = Fetcher("02202020", "03012020", 50, 30,
                               session_mock,
                               MagicMock(),
                               article_enhancer_mock)
        self.fetcher.tickers = ['SPY', 'AMZN', 'TSLA']
        self.fetcher.set_api_key_for_testing("FAKE")

        self.fetcher.request_url = 'http://localhost/endpoint/'
        self.fetcher.run()
        session_mock.send.assert_called()
        article_enhancer_mock._fetch_full_texts.assert_not_called()  # pylint: disable=W0212
        article_enhancer_mock._add_nlp_summaries.assert_not_called()  # pylint: disable=W0212
        article_enhancer_mock._dates_to_epoch.assert_not_called()  # pylint: disable=W0212

with description('Articles Enhancer:') as self:
    with before.all:
        self.raw_articles = [{
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
        self.articles_enhancer = ArticlesEnhancer(MagicMock())
        self.articles_enhancer.set_articles(self.raw_articles)

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

    with it('should not fetch text from blacklisted sources'):
        article = Article(**self.raw_articles[0])
        should_fetch = _should_fetch_text(article)
        should_fetch.should.equal(False)  # pylint: disable=E1101
        article.article_url = 'notthatblacklistedwebsite.com'
        should_fetch = _should_fetch_text(article)
        should_fetch.should.equal(True)  # pylint: disable=E1101
