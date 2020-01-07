import pymongo

from mongo_db.db_utils import message_to_dict, order_book_to_dict

_DB_CLIENT = pymongo.MongoClient("mongodb://127.0.0.1:27017/")
_DB = {
    'orderbooks': _DB_CLIENT["graphelier-db"]["orderbooks"],
    'messages': _DB_CLIENT["graphelier-db"]["messages"],
    'meta': _DB_CLIENT["graphelier-db"]["meta"]
}


def save_order_book(order_book):
    """Save an order book snapshot"""
    order_book_dict = order_book_to_dict(order_book)
    _DB['orderbooks'].insert_one(order_book_dict)


def upsert_order_book(order_book):
    """Upsert an order book snapshot"""
    ob_dict = order_book_to_dict(order_book)
    _DB['orderbooks'].replace_one(
        {k: v for k, v in ob_dict.items() if k in ('instrument', 'timestamp')},
        ob_dict, upsert=True
    )


def save_messages(messages, instrument):
    """Save a list of messages"""
    messages_dict = [message_to_dict(m, instrument) for m in messages]
    _DB['messages'].insert_many(messages_dict)


def check_interval(interval, instrument):
    """Fetch or add the snapshot interval value for a given instrument"""
    exists = _DB['meta'].find_one(
        {"instrument": instrument}, {"interval": 1, "_id": 0})
    if exists:
        return exists["interval"]

    _DB['meta'].insert_one(
        {"interval": interval, "instrument": instrument})
    return interval
