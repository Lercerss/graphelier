import pymongo

from mongo_db.db_utils import message_to_dict, order_book_to_dict

_db = pymongo.MongoClient("mongodb://127.0.0.1:27017/")
_order_book_collection = _db["graphelier-db"]["orderbooks"]
_message_collection = _db["graphelier-db"]["messages"]
_meta_collection = _db["graphelier-db"]["meta"]


def save_order_book(order_book):
    order_book_dict = order_book_to_dict(order_book)
    _order_book_collection.insert_one(order_book_dict)


def save_messages(messages, instrument):
    messages_dict = [message_to_dict(m, instrument) for m in messages]
    _message_collection.insert_many(messages_dict)


def check_interval(interval, instrument):
    exists = _meta_collection.find_one(
        {"instrument": instrument}, {"interval": 1, "_id": 0})
    if exists:
        return exists["interval"]

    _meta_collection.insert_one(
        {"interval": interval, "instrument": instrument})
    return interval
