import unittest

from collections import defaultdict
from datetime import datetime

from models.message import Message, MessageType
from models.order_book import OrderBook
from lobster.extender import (
    weekdays, Placement, Extender, TZ,
    _initial_qty_for_messages, _mix_by_index, _unfilled_qty_for_messages
)


def _datetime_ts(*args, **kwargs):
    return datetime(*args, **kwargs).timestamp() * 10**9


class ExtenderTest(unittest.TestCase):
    oid = 1
    messages = [
        (1, Message(1, MessageType.NEW_ORDER, oid, 123, 10, 1)),
        (2, Message(2, MessageType.EXECUTE, oid, 20, 10, 1)),
        (3, Message(3, MessageType.MODIFY, oid, 50, 10, 1)),
        (4, Message(4, MessageType.EXECUTE, oid, 33, 10, 1)),
        (5, Message(5, MessageType.DELETE, oid, 20, 10, 1)),
    ]

    def test_weekdays(self):

        ts = _datetime_ts(2019, 10, 24, 0, 0, 0, 1, tzinfo=TZ)
        w = weekdays(ts, 4)

        self.assertEqual(ts - 10**3, next(w))
        friday = _datetime_ts(2019, 10, 25, tzinfo=TZ)
        self.assertEqual(friday, next(w))
        monday = _datetime_ts(2019, 10, 28, tzinfo=TZ)
        self.assertEqual(monday, next(w))
        tuesday = _datetime_ts(2019, 10, 29, tzinfo=TZ)
        self.assertEqual(tuesday, next(w))
        with self.assertRaises(StopIteration):
            next(w)
            self.fail()

    def test_mix_by_index(self):
        base = [1, 2, 3, 4, 5]
        mix = [Placement(0, 6), Placement(1, 7), Placement(3, 8)]
        self.assertListEqual(
            [6, 1, 7, 2, 3, 8, 4, 5],
            list(_mix_by_index(base, mix))
        )

    def test_initial_qty_new(self):
        self.assertEqual(123, _initial_qty_for_messages(self.messages))

    def test_initial_qty_no_new(self):
        messages = self.messages[1:]  # Drop new
        self.assertEqual(123, _initial_qty_for_messages(messages))

        m_lower = messages[1:]  # Drop an execute
        self.assertEqual(103, _initial_qty_for_messages(m_lower))

    def test_unfilled_qty_delete(self):
        self.assertEqual(0, _unfilled_qty_for_messages(self.messages))

    def test_unfilled_qty_no_delete(self):
        messages = self.messages[:-1]  # Drop delete
        self.assertEqual(20, _unfilled_qty_for_messages(messages))

        m_lower = messages[:-1]  # Drop an execute
        self.assertEqual(53, _unfilled_qty_for_messages(m_lower))

    def test_messages_no_new_or_delete(self):
        messages = self.messages[1:-1]
        self.assertEqual(206, _initial_qty_for_messages(messages))
        self.assertEqual(103, _unfilled_qty_for_messages(messages))

    def test_backfill(self):
        """Run with `-b` to silence prints generated in Extender"""
        start = _datetime_ts(2019, 10, 21)
        sample = []
        extended = []
        with open('tests/messages_sample.fixture', 'r') as f:
            e = Extender(f, start, 1, (1356500, 1356300))

            sample_count = 9
            extended_count = (9 + 4) * 2

            ob = OrderBook("SPY")
            for m in e.extend_sample(0, ob):
                if len(sample) < sample_count:
                    sample.append(m)
                elif len(extended) < extended_count:
                    extended.append(m)
                else:
                    break
                ob.send(m)

        new_orders = [m for m in extended
                      if m.message_type == MessageType.NEW_ORDER]
        self.assertEqual(14, len(new_orders))

        id_map = defaultdict(list)
        sample_ids = set(m.id for m in sample if m.id > 0)
        extended_ids = set(m.id for m in extended if m.id > 0)

        for m in sample:
            id_map[m.id].append(m)

        for m in extended:
            id_map[m.id].append(m)

        for id_ in extended_ids.difference(sample_ids):
            # All ids generated in the extended set have a NEW
            self.assertTrue(
                any(m.message_type ==
                    MessageType.NEW_ORDER for m in id_map[id_])
            )

        for id_ in sample_ids.intersection(extended_ids):
            # All ids from the sample set have a DELETE
            self.assertTrue(
                any(m.message_type == MessageType.DELETE for m in id_map[id_])
            )
