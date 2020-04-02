import argparse
import datetime

import pandas as pd
from sklearn.cluster import AgglomerativeClustering
from sklearn.feature_extraction.text import TfidfVectorizer

from models.news import Cluster
from mongo_news_db.db_connector import (delete_clusters, fetch_all,
                                        upsert_cluster)

SECONDS_IN_DAY = 24 * 3600


def main():
    delete_clusters()

    parser = script_args()
    args = parser.parse_args()
    pipeline = ArticleClustering(args.threshold)
    pipeline.run()


def script_args():
    parser = argparse.ArgumentParser(
        description='Articles fetcher for StockNewsAPI', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('--threshold', help='The maximum distance between articles that will be accepted in the cluster. Increasing this number decreases the size of clusters (Default=1.4)',
                        type=float, default=1.4)
    return parser


class ArticleClustering:
    def __init__(self, threshold):
        self.threshold = threshold


    def _extract(self):
        """Fetches all the data from the db
        
        Returns:
            pdf.DataFrame -- DataFrame representation of articles
        """
        return pd.DataFrame(list(fetch_all()))

    def _transform(self, articles_df):

        """Clusters related articles
        
        Arguments:
            articles_df {pd.DataFrame} -- DataFrame representation of articles
    
        Returns:
            pdf.DataFrame -- DataFrame representation of a clusters
        """
        
        articles_df['datetime'] = articles_df['timestamp'].apply(
            lambda x: datetime.datetime.fromtimestamp(int(x)))
        articles_df = articles_df.sort_values(by=['datetime'])
        vectorizer = TfidfVectorizer(
            stop_words='english')
        tfidf = vectorizer.fit_transform(articles_df['text'])
        clustering = AgglomerativeClustering(
            n_clusters=None, distance_threshold=self.threshold).fit(tfidf.todense())
        articles_df['n_cluster'] = clustering.labels_
        return articles_df

    def _load(self, clusters_df):
        """Saves the clusters in the database
        
        Arguments:
            clusters_df {pd.DataFrame} -- DataFrame representation of clusters
        """
        grouped_articles = [g.reset_index(drop=True) for i, g in clusters_df.groupby(
            pd.Grouper(key='datetime', freq='{}s'.format(SECONDS_IN_DAY)))]
        for group in grouped_articles:
            clusters = [g.reset_index(drop=True) for i, g in group.groupby(
                pd.Grouper(key='n_cluster'))]
            for cluster in clusters:
                average_timestamp = int(cluster['timestamp'].apply(int).mean())
                del cluster['n_cluster'], cluster['datetime']
                articles = list(cluster.T.to_dict().values())
                clustered_articles = Cluster(
                    articles, average_timestamp)
                upsert_cluster(clustered_articles)

    def run(self):
        articles_df = self._extract()
        clusters_df = self._transform(articles_df)
        self._load(clusters_df)


if __name__ == '__main__':
    main()
