import csv
import random

from collections import defaultdict, namedtuple
from datetime import datetime, time, timedelta, timezone

from utils import logger
from lobster.parser import LobsterMessageParser
from models.message import Message, MessageType
from models.order_book import OrderBook

Placement = namedtuple('Placement', ['index', 'message'])

TZ = timezone(timedelta(hours=-4))  # EDT


class _TopOfBook:
    def __init__(self, ask, bid):
        self.ask = ask
        self.bid = bid

    def get(self, direction):
        return self.ask if direction == -1 else self.bid

    def __sub__(self, o):
        return _TopOfBook(self.ask - o.ask, self.bid - o.bid)


def _endless_copies(list_):
    i = 0
    while True:
        i += 1
        for msg in list_:
            yield i, msg.copy()


def _rand_range(left, right):
    return random.randrange(left, right) if left < right else left


def _mix_by_index(base_list, mix):
    j = 0
    length = len(mix)
    placement = mix[j]
    for i, base in enumerate(base_list):
        while j < length and placement.index <= i:
            yield placement.message
            j += 1
            placement = mix[j] if j < length else Placement(-1, -1)
        yield base


def weekdays(start: int, n):
    current = datetime.fromtimestamp(start / 10 ** 9, tz=TZ).date()
    for _ in range(n):
        yield int(datetime.combine(current, time(), tzinfo=TZ).timestamp() * 10 ** 9)
        offset = 3 if current.weekday() == 4 else 1
        current = current + timedelta(days=offset)


def _initial_qty_for_messages(messages):
    """Calculates inital quantity for an order based on the messages that affect it.
    If the order has a NEW_ORDER, return its quantity
    Otherwise, sum up the executions, cancels and deletes"""
    total = 0
    for _, msg in messages:
        if msg.message_type == MessageType.NEW_ORDER:
            return msg.share_quantity
        elif msg.message_type == MessageType.EXECUTE:
            total += msg.share_quantity
        elif msg.message_type == MessageType.DELETE:
            return total + msg.share_quantity
        elif msg.message_type == MessageType.MODIFY:
            total += msg.share_quantity

    # Order has no NEW or DELETE, we will generate a delete for the same amount
    return total * 2


def _unfilled_qty_for_messages(messages):
    """Calculates the unfilled quantity for an order based on the messages that affect it.
    If the order has a DELETE, return 0
    Otherwise, subtract cancels and executions from its initial quantity"""
    total = 0
    for _, msg in reversed(messages):
        # Reversed so NEW_ORDER appears on the last index
        if msg.message_type == MessageType.NEW_ORDER:
            return msg.share_quantity - total
        elif msg.message_type == MessageType.EXECUTE:
            total += msg.share_quantity
        elif msg.message_type == MessageType.DELETE:
            return 0
        elif msg.message_type == MessageType.MODIFY:
            total += msg.share_quantity

    return total


def _backfill(initial_messages, n_duplicates):
    """Backfills for order ids found in the sample, but without a NEW_ORDER message.
    Also adds executions/deletions for order ids that are not closed in the sample."""
    id_map = defaultdict(list)
    for i, msg in enumerate(initial_messages):
        if msg.id == 0:
            continue
        id_map[msg.id].append(Placement(i, msg))

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

    return sorted(
        backfilled,
        key=lambda msg: (
            msg.index,
            msg.message.time,
            msg.message.id
        )
    ), id_diff


class Extender:

    def __init__(self, file, start_time: int, n_duplicates: int, initial_top_of_book):
        self.n_duplicates = n_duplicates
        self.initial_top_of_book = _TopOfBook(*initial_top_of_book)
        logger.info('Parsing sample set of messages...')
        message_parser = LobsterMessageParser(start_time)
        self.initial_messages = [
            message_parser.parse(line) for line in csv.reader(file)]
        logger.debug('Found %s messages in sample.',
                     len(self.initial_messages))

        self.time_diff = int(self.initial_messages[-1].time -
                             self.initial_messages[0].time)

        logger.info('Backfilling for missing messages in sample...')
        backfilled, self.id_diff = _backfill(
            self.initial_messages, n_duplicates)
        self.mixed_messages = sorted(_mix_by_index(self.initial_messages, backfilled),
                                     key=lambda msg: msg.time)
        logger.debug(
            'Added %s messages to fill holes in sample.', len(backfilled))

    def _yield_n_copies(self, msg):
        yield msg

        for i in range(1, self.n_duplicates):
            msg_copy = msg.copy()
            if msg_copy.id != 0:
                msg_copy.id += i * self.id_diff
            yield msg_copy

    def _handle_conflicts(self, conflicts, msg):
        return [
            Message(msg.time, MessageType.DELETE, order.id, order.qty,
                    order.price, order.direction)
            for order in conflicts
        ]

    def extend_sample(self, day_diff: int, ob_ref: OrderBook):
        for msg in self.initial_messages:
            m_ = msg.copy()
            m_.time += day_diff
            if not ob_ref.is_valid_msg(m_):
                continue
            yield from self._yield_n_copies(m_)

        prev_loop = 0
        prev_diff = None
        diff_top_of_book = _TopOfBook(0, 0)
        for loop_count, msg in _endless_copies(self.mixed_messages):
            if loop_count > prev_loop:
                prev_loop = loop_count
                prev_diff = diff_top_of_book
                diff_top_of_book = _TopOfBook(ob_ref.ask, ob_ref.bid) - \
                    self.initial_top_of_book
            msg.time += day_diff + self.time_diff * loop_count
            if msg.id != 0:
                msg.id += self.id_diff * loop_count * self.n_duplicates

            msg.price = msg.price + \
                (prev_diff if msg.fake else diff_top_of_book).get(msg.direction)

            if not ob_ref.is_valid_msg(msg):
                continue

            # Delete all possible conflicts from the book first
            yield from self._handle_conflicts(ob_ref.conflicts(msg), msg)
            yield from self._yield_n_copies(msg)
