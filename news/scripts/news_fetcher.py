import argparse
from datetime import datetime, timezone
from mongo_news_db.db_connector import upsert_articles
from models.news import Article
from newspaper import Article as NewsArticle
from newspaper.article import ArticleException
from summarizer import summarize
from typing import List

import requests
import sys

try:
    from keys import API_KEY  # pylint: disable=E0401
except ModuleNotFoundError:
    API_KEY = ''

STOCK_NEWS_API_URL = 'https://stocknewsapi.com/api/v1'
GRAPHELIER_SERVICE_URL = 'http://localhost:5050/'
NUM_ITEMS_PER_RESPONSE = 50
MAX_API_PAGE_REQUEST = 40
NUM_OF_SUMMARIZED_SENTENCES = 7

parser = argparse.ArgumentParser(
    description='Articles fetcher for StockNewsAPI', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('start_date', help='Starting date interval, e.g. "06-21-2012"',
                    type=lambda x: datetime.strptime(x, '%m-%d-%Y'))
parser.add_argument('end_date', help='Ending date interval, e.g. "06-24-2012"',
                    type=lambda x: datetime.strptime(x, '%m-%d-%Y'))
parser.add_argument('-n', '--num_items',
                    help='Number of elements received in response of API request',
                    type=int,
                    default=NUM_ITEMS_PER_RESPONSE)
parser.add_argument('-m', '--max_req',
                    help='Maximum number of requests to be sent to StockNewsAPI',
                    type=int,
                    default=MAX_API_PAGE_REQUEST)


class Fetcher:
    """
    Exhaustive stock news articles fetcher for StockNewsAPI
    """

    def __init__(self, start_date, end_date, num_items, max_req):
        self.tickers: List[str] = []
        self.request_url: str = STOCK_NEWS_API_URL
        self.num_items: int = num_items
        self.tot_pgs_api: int = -1
        self.cur_page: int = 1
        self.start_date: str = start_date
        self.end_date: str = end_date
        self.max_req: int = max_req
        self.count = 0
        self.api_key = API_KEY

    def _prepare_tickers(self):
        """
        Fetches instrument tickers for which news articles are needed
        """
        instr_req: requests.Response = requests.get('{}instruments/'.format(GRAPHELIER_SERVICE_URL))
        try:
            instr_req.raise_for_status()
        except requests.exceptions.HTTPError as e:
            print('Could not retrieve instruments from graphelier service: {}'.format(str(e)))
            sys.exit(1)
        tickers: List[str] = instr_req.json()
        self.tickers = tickers

    def _prepare_query_dict(self):
        """
        Builds request params dictionary
        """
        return {
            'items': str(self.num_items),
            'type': 'article',
            'tickers': ','.join(self.tickers),
            'date': '{}-{}'.format(self.start_date, self.end_date),
            'token': self.api_key,
            'page': str(self.cur_page)
        }

    def run(self):
        """
        Execute requests and write to db for every page
        """
        self._prepare_tickers()

        while self.cur_page <= self.tot_pgs_api or self.tot_pgs_api == -1:
            query_dict = self._prepare_query_dict()
            pg_req: requests.Response = requests.get(self.request_url, query_dict)
            try:
                pg_req.raise_for_status()
            except requests.exceptions.HTTPError as e:
                print('Error retrieving news from StockNewsAPI: {}'.format(str(e)))
                return
            resp_body = pg_req.json()
            if 'data' not in resp_body or len(resp_body['data']) == 0:
                # additional error check
                print('No articles found for specified tickers')
                break
            if 'total_pages' in resp_body and self.tot_pgs_api == -1:
                self.tot_pgs_api = resp_body['total_pages'] if resp_body['total_pages'] < self.max_req \
                    else self.max_req

            article_enhancer: ArticlesEnhancer = ArticlesEnhancer(resp_body['data'])
            article_enhancer.enhance()
            paged_articles: List[Article] = article_enhancer.articles
            upsert_articles(paged_articles)

            self.count += (len(paged_articles))
            self.cur_page += 1

    def stats(self):
        """
        Once run() has been called, this returns session statistics
        """
        return """
        Requested pages: \t{}
        Articles fetched: \t{}
        Tickers: \t\t{}
        """.format(self.cur_page - 1,
                   self.count,
                   ','.join(self.tickers)
                   )

    def set_api_key_for_testing(self, api_key):
        self.api_key = api_key


class ArticlesEnhancer:
    """
    Enhances news articles with its full text and summary
    """

    def __init__(self, raw_articles):
        self.articles = [Article(**article) for article in raw_articles]

    def _fetch_full_texts(self):
        """
        Fetches full text from the articles' url
        """
        article: Article
        for article in self.articles:
            news_article: NewsArticle = NewsArticle(article.article_url)
            try:
                news_article.download()
                news_article.parse()
                article.text = _clean_text(news_article.text)
            except ArticleException:
                # text retrieval failed
                pass

    def _add_nlp_summaries(self):
        """
        Uses in-house text-summarizer to add a summary to the Article object
        """
        article: Article
        for article in self.articles:
            article.summary = summarize(article.text, NUM_OF_SUMMARIZED_SENTENCES)

    def _dates_to_epoch(self):
        """
        Changes the date from original data to epoch
        """
        api_datetime_format = '%a %d %b %Y %H:%M:%S %z'
        article: Article
        for article in self.articles:
            cleaned_raw_date: str = article.date.replace(',', '')
            datetime_obj: datetime = datetime.strptime(cleaned_raw_date, api_datetime_format)
            epoch: str = str(int((datetime_obj - datetime(1970, 1, 1, tzinfo=timezone.utc)).total_seconds()))
            article.timestamp = epoch

    def enhance(self):
        self._fetch_full_texts()
        self._add_nlp_summaries()
        self._dates_to_epoch()


def _clean_text(full_text_str: str):
    """
    Returns a full text string free of line breaks, tabs, and unwanted chars
    """
    return ' '.join(full_text_str.split())


def main():
    if API_KEY == '':
        print("Specify your API_KEY in keys.py")
        return

    args = parser.parse_args()
    start_date: str = args.start_date.strftime('%m%d%Y')
    end_date: str = args.end_date.strftime('%m%d%Y')

    stock_news_fetcher: Fetcher = Fetcher(start_date, end_date, args.num_items, args.max_req)
    stock_news_fetcher.run()
    print(stock_news_fetcher.stats())


if __name__ == '__main__':
    main()
