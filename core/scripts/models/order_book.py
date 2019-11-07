from collections import defaultdict
from datetime import datetime
from typing import Dict, List

from models.message import Message, MessageType


class Order:
    def __init__(self, id_, qty, price, direction):
        self.id = id_
        self.qty = qty
        self.direction = direction
        self.price = price

    def __eq__(self, other):
        return self.id == other.id


class OrderBook:
    def __init__(self, instrument):
        self.instrument = instrument
        self.bid_book: Dict[int, List[Order]] = defaultdict(list)
        self.ask_book: Dict[int, List[Order]] = defaultdict(list)
        self.bid = 0
        self.ask = float('inf')
        self.id_map: Dict[int, Order] = {}
        self.last_time = 0
        self.msg_handlers = {
            MessageType.NEW_ORDER: self._do_new,
            MessageType.MODIFY: self._do_modify,
            MessageType.DELETE: self._do_delete,
            MessageType.EXECUTE: self._do_execute,
            MessageType.IGNORE: lambda x: None
        }
        self.last_sod_offset = 0

    def _do_new(self, msg: Message):
        o = Order(msg.id, msg.share_quantity, msg.price, msg.direction)
        if msg.direction == -1:
            self.ask_book[msg.price].append(o)
            self.ask = min(self.ask, msg.price)
        elif msg.direction == 1:
            self.bid_book[msg.price].append(o)
            self.bid = max(self.bid, msg.price)
        else:
            return

        self.id_map[msg.id] = o

    def _do_modify(self, msg: Message):
        o = self.id_map.get(msg.id)
        if not o:
            return

        if 0 <= msg.share_quantity < o.qty:
            # Partial cancel, keep priority and reduce quantity
            o.qty -= msg.share_quantity
        else:
            self._do_delete(Message(msg.time, MessageType.DELETE,
                                    o.id, o.qty, o.price, o.direction))
            if msg.share_quantity < 0:
                # Increasing order size, reset its priority
                self._do_new(Message(msg.time, MessageType.NEW_ORDER,
                                     o.id, o.qty - msg.share_quantity, msg.price, msg.direction))

    def _do_delete(self, msg: Message):
        o = self.id_map.get(msg.id)
        if not o:
            return

        if o.direction == -1:
            self.ask_book[o.price].remove(o)
            del self.id_map[o.id]
            if len(self.ask_book[o.price]) == 0:
                del self.ask_book[o.price]
                self.ask = min(self.ask_book.keys()) if len(
                    self.ask_book) > 0 else 0
        elif o.direction == 1:
            self.bid_book[o.price].remove(o)
            del self.id_map[o.id]
            if len(self.bid_book[o.price]) == 0:
                del self.bid_book[o.price]
                self.bid = max(self.bid_book.keys()) if len(
                    self.bid_book) > 0 else 0

    def _do_execute(self, msg: Message):
        if msg.id == 0:
            return

        o = self.id_map.get(msg.id)
        if not o:
            return

        if o.qty > msg.share_quantity:
            o.qty -= msg.share_quantity
        else:
            self._do_delete(msg)

    def send(self, msg: Message):
        self.msg_handlers[msg.message_type](msg)
        self.last_time = msg.time
        self.last_sod_offset = msg.sod_offset

    def conflicts(self, msg: Message) -> List[Order]:
        """Returns all orders which would conflict with the given message.
        Only NEW_ORDER messages can cause a conflict by altering the top-of-book.

        In the case of a new ask, return all existing bids with a higher price.
        In the case of a new bid, return all existing asks with a lower price.
        """
        ret = []
        if msg.message_type != MessageType.NEW_ORDER:
            return ret

        if msg.direction == -1:
            if msg.price <= self.bid:
                for price in sorted(self.bid_book, reverse=True):
                    if price < msg.price:
                        break
                    ret += self.bid_book[price]
        elif msg.direction == 1:
            if msg.price >= self.ask:
                for price in sorted(self.ask_book):
                    if price > msg.price:
                        break
                    ret += self.ask_book[price]
        return ret

    def has_order(self, msg: Message):
        return (msg.direction == -1 and
                msg.price in self.ask_book and msg in self.ask_book[msg.price]) \
            or (msg.direction == 1 and
                msg.price in self.bid_book and msg in self.bid_book[msg.price])

    def __str__(self):
        return '<OrderBook bids={bids} asks={asks} time="{time}">'.format(
            bids='(count={}, best={})'.format(sum(len(l) for l
                                                  in self.bid_book.values()), self.bid / 10000),
            asks='(count={}, best={})'.format(sum(len(l) for l
                                                  in self.ask_book.values()), self.ask / 10000),
            time=datetime.fromtimestamp(
                self.last_time // 10**9).strftime('%Y-%m-%d %H:%M:%S')
        )
