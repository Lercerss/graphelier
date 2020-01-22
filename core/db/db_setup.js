conn = new Mongo();
db = conn.getDB('graphelier-db');

db.createCollection('orderbooks');
db.createCollection('messages');

db.orderbooks.createIndex({ instrument: 1, timestamp: 1 });

db.messages.createIndex({ instrument: 1, timestamp: 1 });
db.messages.createIndex({ instrument: 1, sod_offset: 1 });
db.messages.createIndex({ instrument: 1, sod_offset: -1 });
db.messages.createIndex({ instrument: 1, order_id: 1, timestamp: 1 })