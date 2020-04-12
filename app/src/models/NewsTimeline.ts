/* eslint-disable camelcase */

export interface Article {
    title: string,
    summary: string,
    article_url: string,
    image_url: string,
    tickers: Array<string>,
    timestamp: string,
    sentiment: string,
    source_name: string,
}

export interface ArticleCluster {
    articles: Array<Article>,
    timestamp: string,
    size: number
}
