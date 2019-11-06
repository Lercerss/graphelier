import csv
import random

from collections import defaultdict, namedtuple
from datetime import datetime, time, timedelta

from models.order_book import OrderBook
from models.message import Message, MessageType
from lobster.parser import LobsterMessageParser


Placement = namedtuple('Placement', ['index', 'message'])


class _TopOfBook:
    def __init__(self, ask, bid):
        self.ask = ask
        self.bid = bid

    def get(self, direction):
        return self.ask if direction == -1 else self.bid

    def __sub__(self, o):
        return _TopOfBook(self.ask - o.ask, self.bid - o.bid)


def _endless_copies(l):
    i = 0
    while True:
        i += 1
        for m in l:
            yield i, m.copy()


def _rand_range(left, right):
    return random.randrange(left, right) if left < right else left


def _mix_by_index(base, mix):
    j = 0
    l = len(mix)
    placement = mix[j]
    for i, b in enumerate(base):
        while j < l and placement.index <= i:
            yield placement.message
            j += 1
            placement = mix[j] if j < l else Placement(-1, -1)
        yield b


def weekdays(start: float, n):
    current = datetime.fromtimestamp(start / 10 ** 9).date()
    for _ in range(n):
        yield datetime.combine(current, time()).timestamp() * 10 ** 9
        offset = 3 if current.weekday() == 4 else 1
        current = current + timedelta(days=offset)


def _initial_qty_for_messages(messages):
    """Calculates inital quantity for an order based on the messages that affect it.
    If the order has a NEW_ORDER, return its quantity
    Otherwise, sum up the executions, cancels and deletes"""
    total = 0
    for _, m in messages:
        if m.message_type == MessageType.NEW_ORDER:
            return m.share_quantity
        elif m.message_type == MessageType.EXECUTE:
            total += m.share_quantity
        elif m.message_type == MessageType.DELETE:
            return total + m.share_quantity
        elif m.message_type == MessageType.MODIFY:
            total += m.share_quantity

    # Order has no NEW or DELETE, we will generate a delete for the same amount
    return total * 2


def _unfilled_qty_for_messages(messages):
    """Calculates the unfilled quantity for an order based on the messages that affect it.
    If the order has a DELETE, return 0
    Otherwise, subtract cancels and executions from its initial quantity"""
    total = 0
    for _, m in reversed(messages):
        # Reversed so NEW_ORDER appears on the last index
        if m.message_type == MessageType.NEW_ORDER:
            return m.share_quantity - total
        elif m.message_type == MessageType.EXECUTE:
            total += m.share_quantity
        elif m.message_type == MessageType.DELETE:
            return 0
        elif m.message_type == MessageType.MODIFY:
            total += m.share_quantity

    return total


def _backfill(initial_messages, n_duplicates):
    """Backfills for order ids found in the sample, but without a NEW_ORDER message.
    Also adds executions/deletions for order ids that are not closed in the sample."""
    id_map = defaultdict(list)
    for i, m in enumerate(initial_messages):
        if m.id == 0:
            continue
        id_map[m.id].append(Placement(i, m))

    id_diff = max(id_map) - min(id_map) + 1
    backfilled = []
    upper_delete_bound = int(len(initial_messages) / 10)
    for id_, placements in id_map.items():
        first_place = placements[0]
        if first_place.message.message_type != MessageType.NEW_ORDER:
            # Order without a NEW_ORDER message
            new_index = _rand_range(
                max(0, first_place.index - 500), first_place.index)
            time_diff = initial_messages[new_index].time - \
                initial_messages[max(0, new_index - 1)].time
            _time = initial_messages[new_index].time - \
                random.random() * time_diff
            backfilled.append(
                Placement(
                    new_index,
                    Message(_time, MessageType.NEW_ORDER, id_, _initial_qty_for_messages(
                        placements), first_place.message.price, first_place.message.direction)
                )
            )
        unfilled_qty = _unfilled_qty_for_messages(placements)
        if unfilled_qty:
            # Unfilled order
            new_index = _rand_range(0, upper_delete_bound)
            time_diff = initial_messages[new_index].time - \
                initial_messages[max(0, new_index - 1)].time
            _time = initial_messages[new_index].time + \
                random.random() * time_diff
            backfilled.append(
                Placement(
                    # Subtract from id to apply on order from previous loop
                    new_index,
                    Message(_time, MessageType.DELETE,
                            id_ - id_diff * n_duplicates, unfilled_qty,
                            first_place.message.price, first_place.message.direction,
                            fake=True)
                )
            )

    return sorted(backfilled, key=lambda x: (x.index, x.message.time, x.message.id)), id_diff


class Extender:

    def __init__(self, file, start_time: float, n_duplicates: int, initial_top_of_book):
        self.n_duplicates = n_duplicates
        self.initial_top_of_book = _TopOfBook(*initial_top_of_book)
        print('Parsing sample set of messages...')
        message_parser = LobsterMessageParser(start_time)
        self.initial_messages = [
            message_parser.parse(l) for l in csv.reader(file)]
        print('Found {} messages in sample.\n'.format(
            len(self.initial_messages)))

        self.time_diff = self.initial_messages[-1].time - \
            self.initial_messages[0].time

        print('Backfilling for missing messages in sample...')
        backfilled, self.id_diff = _backfill(
            self.initial_messages, n_duplicates)
        self.mixed_messages = sorted(_mix_by_index(self.initial_messages, backfilled),
                                     key=lambda x: x.time)
        print('Added {} messages to fill holes in sample.\n'.format(len(backfilled)))

    def _yield_n_copies(self, m):
        yield m

        for i in range(1, self.n_duplicates):
            m_copy = m.copy()
            if m_copy.id != 0:
                m_copy.id += i * self.id_diff
            yield m_copy

    def handle_conflicts(self, conflicts, msg):
        return [
            Message(msg.time, MessageType.DELETE, order.id, order.qty,
                    order.price, order.direction)
            for order in conflicts
        ]

    def extend_sample(self, day_diff: int, ob_ref: OrderBook):
        for m in self.initial_messages:
            m_ = m.copy()
            m_.time += day_diff
            yield from self._yield_n_copies(m_)

        prev_loop = 0
        prev_diff = None
        diff_top_of_book = _TopOfBook(0, 0)
        for loop_count, m in _endless_copies(self.mixed_messages):
            if loop_count > prev_loop:
                prev_loop = loop_count
                prev_diff = diff_top_of_book
                diff_top_of_book = _TopOfBook(ob_ref.ask, ob_ref.bid) - \
                    self.initial_top_of_book
            m.time += day_diff + self.time_diff * loop_count
            if m.id != 0:
                m.id += self.id_diff * loop_count * self.n_duplicates

            m.price = m.price + \
                (prev_diff if m.fake else diff_top_of_book).get(m.direction)

            if m.fake and not ob_ref.has_order(m):
                # Deleted through handle conflict
                continue

            # Delete all possible conflicts from the book first
            if m.message_type == MessageType.NEW_ORDER:
                yield from self.handle_conflicts(ob_ref.conflicts(m), m)
            yield from self._yield_n_copies(m)
