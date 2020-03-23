conn = new Mongo();
db = conn.getDB('news-db');

db.createCollection('articles');
 
db.articles.createIndex({article_url: 1}, {unique: true});
