import math


def order_book_to_dict(order_book):
    return {
        "instrument": order_book.instrument,
        "bids": [{
            "price": price,
            "orders": [order_to_dict(order) for order in orders]
        } for price, orders in sorted(order_book.bid_book.items(), reverse=True)],
        "asks": [{
            "price": price,
            "orders": [order_to_dict(order) for order in orders]
        } for price, orders in sorted(order_book.ask_book.items())],
        "timestamp": _round_up(order_book.last_time, 9)
    }


def order_to_dict(order):
    return {
        "id": order.id,
        "quantity": order.qty
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
