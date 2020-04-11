/* eslint-disable camelcase */

export interface NewsItem {
    title: string,
    summary: string,
    article_url: string,
    image_url: string,
    tickers: Array<string>,
    timestamp: string,
    sentiment: string,
    source_name: string,
}

export interface NewsCluster {
    articles: Array<NewsItem>,
    timestamp: string,
    size: number
}
