from unittest.mock import patch

from sure import expect  # pylint: disable=W0611
from mamba import description, it
from server import app

app.testing = True

TESTING_CLIENT = app.test_client()

SAMPLE_DB_FETCH = [
    {
        "_id": "5e8e1d38686df85294dc9560",
        "articles": [
            {
                "_id": "5e878bd3cc004b91d22b012b",
                "article_url": "http://www.zacks.com/stock/news/719378/the-race-to-5g-%241-billion-subsidy-could-"
                               "propel-5g-stocks",
                "image_url": "https://cdn.snapi.dev/images/v1/w/k/mw-hb603-5g0108-20190108202027-zhjpguuidbf31dfd4-1"
                             "3ac-11e9-ab7c-ac162d7bc1f7.jpg",
                "title": "The Race To 5G: $1 Billion Subsidy Could Propel  5G Stocks",
                "text": "The race to integrated 5G networks and devices that leverage this technology is underway"
                        ", and China has the lead???. for now",
                "source_name": "Zacks Investment Research",
                "date": "Wed, 15 Jan 2020 12:31:00 -0500",
                "sentiment": "Positive",
                "tickers": [
                    "AAPL",
                    "AVGO",
                    "INTC",
                    "QCOM",
                    "QRVO",
                    "SWKS",
                    "T",
                    "VZ"
                ],
                "summary": "The race to integrated 5G networks and devices that leverage this technology is underwa"
                           "y, and China has the lead???.",
                "timestamp": "1579109460"
            }
        ],
        "timestamp": 1579109460,
        "size": 1
    }, {
        "_id": "5e8e1d38686df85294dc9563",
        "articles": [
            {
                "_id": "5e878bd3cc004b91d22b0127",
                "article_url": "https://deadline.com/2020/01/apple-sued-m-night-shyamalan-copyright-lawsuit-servant-"
                               "series-sundance-film-festival-1202831530/",
                "image_url": "https://cdn.snapi.dev/images/v1/a/p/apple-tv-servant.jpg",
                "title": "Apple & M. Night Shyamalan Hit With Copyright Suit Over ‘Servant’ Ripping Off Sundance Film",
                "text": "sample text",
                "source_name": "Deadline",
                "date": "Wed, 15 Jan 2020 13:31:57 -0500",
                "sentiment": "Negative",
                "tickers": [
                    "AAPL"
                ],
                "summary": "sample summary",
                "timestamp": "1579113117"
            }
        ],
        "timestamp": 1579113117,
        "size": 1
    }, {
        "_id": "5e8e1d38686df85294dc9564",
        "articles": [
            {
                "_id": "5e878bd3cc004b91d22b0126",
                "article_url": "https://www.geekwire.com/2020/exclusive-apple-acquires-xnor-ai-edge-ai-spin"
                               "-paul-allens-ai2-price-200m-range/",
                "image_url": "https://cdn.snapi.dev/images/v1/1/8/180506-xnor-768x432.jpg",

                "title": "Exclusive: Apple acquires Xnor.ai, edge AI spin-out from Paul Allen’s AI2, for "
                         "price in $200M range",
                "text": "sample text",
                "source_name": "GeekWire",
                "date": "Wed, 15 Jan 2020 13:44:26 -0500",
                "sentiment": "Positive",
                "tickers": [
                    "AAPL"
                ],
                "summary": "sample summary",
                "timestamp": "1579113866"
            },
            {
                "_id": "5e878bd3cc004b91d22b0123",
                "article_url": "https://www.cnbc.com/2020/01/15/apple-acquires-xnor-ai-startup-that-spun-out-of-"
                               "allen-ins"
                               "titute.html",
                "image_url": "https://cdn.snapi.dev/images/v1/1/0/103407475-gettyimages-146170267.jpg",
                "title": "Apple buys an A.I. start-up that came from Microsoft co-founder Paul Allen's research lab",
                "text": "sample text",
                "source_name": "CNBC",
                "date": "Wed, 15 Jan 2020 14:40:59 -0500",
                "sentiment": "Positive",
                "tickers": [
                    "AAPL"
                ],
                "summary": "sample summary",
                "timestamp": "1579117259"
            },
            {
                "_id": "5e878bd3cc004b91d22b0121",
                "article_url": "https://techcrunch.com/2020/01/15/apple-buys-edge-based-ai-startup-xnor-ai-for"
                               "-a-reported-200m/",
                "image_url": "https://cdn.snapi.dev/images/v1/a/i/ai-platforms1pngw711.jpg",
                "title": "Apple buys edge-based AI startup Xnor.ai for a reported $200M",
                "text": "sample text",
                "source_name": "TechCrunch",
                "date": "Wed, 15 Jan 2020 17:54:04 -0500",
                "sentiment": "Positive",
                "tickers": [
                    "AAPL"
                ],
                "summary": "sample summary",
                "timestamp": "1579128844"
            },
            {
                "_id": "5e878bd3cc004b91d22b0120",
                "article_url": "https://www.marketwatch.com/story/apple-snaps-up-artificial-intelligence-startup-xno"
                               "rai-for-about-200-million-reports-2020-01-15",
                "image_url": "https://cdn.snapi.dev/images/v1/m/0/m02d20191212t2i1463297092rlynxmpefbb1gyw640-2.jpg",
                "title": "Apple snaps up artificial-intelligence startup Xnor.ai for about $200 million: reports",
                "text": "sample text",
                "source_name": "Market Watch",
                "date": "Wed, 15 Jan 2020 21:19:15 -0500",
                "sentiment": "Positive",
                "tickers": [
                    "AAPL"
                ],
                "summary": "sample summary",
                "timestamp": "1579141155"
            }
        ],
        "timestamp": 1579125281,
        "size": 4
    }]

with description('Graphelier News:') as self:
    with it('should make sure the root url is exposed'):
        root_response = TESTING_CLIENT.get('/')
        response_data = root_response.get_json()
        expect(root_response.status_code).should.equal(200)
        response_data['message'].should.equal('Graphelier News')

    with it('should make sure the news clusters url is exposed'):
        with patch('server.views.fetch_n_clusters_from_time') as mock_fetch:
            mock_fetch.return_value = []
            nc_response = TESTING_CLIENT.get('/news_clusters/123')

    with it('should return a 400 on a non-int timestamp'):
        with patch('server.views.fetch_n_clusters_from_time') as mock_fetch:
            mock_fetch.return_value = []
            nc_response = TESTING_CLIENT.get('/news_clusters/12asdf3')
            response_data = nc_response.get_json()
            expect(nc_response.status_code).should.equal(400)
            expect(response_data['message']).should.equal('Given timestamp is badly formed: 12asdf3')

    with it('should return initial timestamps if nothing is found'):
        with patch('server.views.fetch_n_clusters_from_time') as mock_fetch:
            mock_fetch.return_value = []
            nc_response = TESTING_CLIENT.get('/news_clusters/123')
            response_data = nc_response.get_json()
            expect(nc_response.status_code).should.equal(200)
            expect(response_data['timestamp']).should.equal(123)
            expect(response_data['next_timestamp']).should.equal(123)

    with it('should call correct db function given forward direction'):
        with patch('server.views.fetch_n_clusters_from_time') as mock_fetch:
            mock_fetch.return_value = []
            nc_response = TESTING_CLIENT.get('/news_clusters/123?direction=1')
            mock_fetch.assert_called_with(123, 10, 1)

    with it('should call correct db function given backwards direction'):
        with patch('server.views.fetch_n_clusters_from_time') as mock_fetch:
            mock_fetch.return_value = []
            TESTING_CLIENT.get('/news_clusters/123?direction=-1')
            mock_fetch.assert_called_with(123, 10, -1)

    with it('should call correct db function with correct quantity'):
        with patch('server.views.fetch_n_clusters_from_time') as mock_fetch:
            mock_fetch.return_value = []
            TESTING_CLIENT.get('/news_clusters/123?direction=-1&quantity=30')
            mock_fetch.assert_called_with(123, 30, -1)

    with it('should give back correct news clusters'):
        with patch('server.views.fetch_n_clusters_from_time') as mock_fetch:
            mock_fetch.return_value = SAMPLE_DB_FETCH
            nc_response = TESTING_CLIENT.get('/news_clusters/123?direction=1&quantity=3')
            response_data = nc_response.get_json()
            mock_fetch.assert_called()
            expect(nc_response.status_code).should.equal(200)
            expect(response_data['timestamp']).should.equal(123)
            expect(response_data['next_timestamp']).should.equal(1579125281)
            expect(len(response_data['clusters'])).should.equal(3)
            expect(len(response_data['clusters'][0]['articles'])).should.equal(1)
            expect(len(response_data['clusters'][1]['articles'])).should.equal(1)
            expect(len(response_data['clusters'][2]['articles'])).should.equal(4)
            expect(response_data['clusters'][0]['articles'][0]['title']).should.equal('The Race To 5G: $1 Billion '
                                                                                      'Subsidy Could Propel  5G'
                                                                                      ' Stocks')
            expect(response_data['clusters'][1]['articles'][0]['title']).should.equal('Apple & M. Night Shyamalan Hit '
                                                                                      'With Copyright Suit Over ‘Serva'
                                                                                      'nt’ Ripping Off Sundance Film')
