import unittest

from models.message import Message, MessageType
from models.order_book import Order, OrderBook


class TestOrderbook(unittest.TestCase):

    def test_new_order(self):
        orderbook = OrderBook("testInstrument")
        new_order = Message(1, MessageType.NEW_ORDER, 11, 10, 1, -1)
        new_order_2 = Message(1, MessageType.NEW_ORDER, 12, 10, 1, -1)
        orderbook.send(new_order)
        orderbook.send(new_order_2)
        self.assertEqual(len(orderbook.ask_book[1]), 2)

        # Making sure they are ordered correctly
        actual_order_1 = orderbook.ask_book[1][0]
        actual_order_2 = orderbook.ask_book[1][1]
        self.assertEqual(actual_order_1.price, 1)
        self.assertEqual(actual_order_1.qty, 10)
        self.assertEqual(actual_order_1.id, 11)

        self.assertEqual(actual_order_2.price, 1)
        self.assertEqual(actual_order_2.qty, 10)
        self.assertEqual(actual_order_2.id, 12)

    def test_delete_order(self):
        orderbook = OrderBook("testInstrument")
        order_to_be_removed = Order(1, 10, 10, 1)
        orderbook.id_map[1] = order_to_be_removed
        orderbook.bid_book[10].append(order_to_be_removed)
        # Deleting order with id 1
        delete_message = Message(1, MessageType.DELETE, 1, 10, 10, 1)
        orderbook.send(delete_message)
        self.assertEqual(len(orderbook.bid_book[10]), 0)

    def test_modify_order(self):
        orderbook = OrderBook("testInstrument")

        order_to_be_modified = Order(1, 10, 10, 1)
        orderbook.id_map[1] = order_to_be_modified
        orderbook.bid_book[10].append(order_to_be_modified)

        order = Order(2, 10, 10, 1)
        orderbook.id_map[2] = order
        orderbook.bid_book[10].append(order)
        self.assertEqual(len(orderbook.bid_book[10]), 2)
        self.assertEqual(orderbook.bid_book[10][0].id, 1)
        # Removing 8 shares from the order
        modify_message = Message(1, MessageType.MODIFY, 1, 8, 10, 1)
        orderbook.send(modify_message)
        # Ordering has changed in the orderbook
        modified_order = orderbook.bid_book[10][1]
        self.assertEqual(modified_order.id, 1)
        self.assertEqual(modified_order.qty, 2)
