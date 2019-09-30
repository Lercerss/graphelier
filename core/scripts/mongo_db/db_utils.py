import math


def order_book_to_dict(order_book):

    flattened_ask_book = [
        item for sublist in order_book.ask_book.values() for item in sublist]
    flattened_bid_book = [
        item for sublist in order_book.ask_book.values() for item in sublist]

    return {
        "instrument": order_book.instrument,
        "bids": [order_to_dict(bid) for bid in sorted(flattened_bid_book, key=lambda x: -x.price)],
        "asks": [order_to_dict(ask) for ask in sorted(flattened_ask_book, key=lambda x: x.price)],
        "timestamp": _round_up(order_book.last_time, 9)
    }


def order_to_dict(order):
    return {
        "id": order.id,
        "quantity": order.qty,
        "price": order.price
    }


def message_to_dict(message, instrument):
    return {
        "instrument": instrument,
        "timestamp": message.time,
        "message_type": int(message.message_type),
        "order_id": message.id,
        "share_quantity": message.share_quantity,
        "price": message.price,
        "direction": message.direction
    }


def _round_up(timestamp, digits):
    return math.ceil(timestamp / 10**digits) * 10**digits
