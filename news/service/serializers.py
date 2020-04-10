def article_cursor_to_dict(cursor):
    return {
        'article_url': cursor['article_url'],
        'image_url': cursor['image_url'],
        'title': cursor['title'],
        'source_name': cursor['source_name'],
        'date': cursor['date'],
        'sentiment': cursor['sentiment'],
        'timestamp': int(cursor['timestamp']),
        'tickers': cursor['tickers'],
        'summary': cursor['summary']
    }


def cluster_cursor_to_dict(cursor):
    return {
        'timestamp': cursor['timestamp'],
        'size': cursor['size'],
        'articles': [article_cursor_to_dict(article_cursor) for article_cursor in cursor['articles']]
    }
