/* eslint-disable camelcase */

export interface NewsItem {
    _id: string,
    title: string,
    summary: string,
    article_url: string,
    image_url: string,
    tickers: Array<string>,
    timestamp: string,
}

export interface NewsCluster {
    _id: string,
    articles: Array<NewsItem>,
    timestamp: string,
    size: number
}
