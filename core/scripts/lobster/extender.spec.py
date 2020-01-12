from datetime import datetime

from sure import expect
from mamba import description, it, before

from models.message import Message, MessageType
from models.order_book import OrderBook
from lobster.extender import (
    _TopOfBook, weekdays, Placement, Extender, TZ,
    _initial_qty_for_messages, _mix_by_index, _unfilled_qty_for_messages
)

BID = 1
ASK = -1

with description('TopOfBook:') as self:
    with it('returns the proper side based on the given direction'):
        top = _TopOfBook(30, 15)
        top.get(BID).should.equal(15)
        top.get(ASK).should.equal(30)

    with it('can be subtracted'):
        left = _TopOfBook(20, 10)
        right = _TopOfBook(18, 12)
        result = left - right
        result.should.be.a(_TopOfBook)
        result.ask.should.equal(2)
        result.bid.should.equal(-2)

with description('Extender:') as self:
    with before.each:
        oid = 1
        self.messages = [
            (1, Message(1, MessageType.NEW_ORDER, oid, 123, 10, BID)),
            (2, Message(2, MessageType.EXECUTE,   oid, 20,  10, BID)),
            (3, Message(3, MessageType.MODIFY,    oid, 50,  10, BID)),
            (4, Message(4, MessageType.EXECUTE,   oid, 33,  10, BID)),
            (5, Message(5, MessageType.DELETE,    oid, 20,  10, BID)),
        ]

    with it('yields weekdays starting from a given date'):
        start = datetime(2019, 10, 24, 0, 0, 0, 0, tzinfo=TZ)
        start_timestamp = start.timestamp() * 10 ** 9
        num_days = 4
        generator = weekdays(start_timestamp + 10 ** 8, num_days)

        next(generator).should.equal(start_timestamp)  # Midnight on first day

        friday = start.replace(day=25).timestamp() * 10 ** 9
        monday = start.replace(day=28).timestamp() * 10 ** 9
        tuesday = start.replace(day=29).timestamp() * 10 ** 9

        next(generator).should.equal(friday)
        next(generator).should.equal(monday)
        next(generator).should.equal(tuesday)
        (lambda: next(generator)).should.throw(StopIteration)

    with it('mixes Placement objects into a list'):
        base = [1, 2, 3, 4, 5]
        mix = [Placement(0, 6), Placement(1, 7), Placement(3, 8)]
        expect(list(_mix_by_index(base, mix))).should.equal(
            [6, 1, 7, 2, 3, 8, 4, 5])

    with description('when calculating properties of orders based on given messages'):
        with it('finds the initial share quantity from a NEW_ORDER'):
            _initial_qty_for_messages(self.messages).should.equal(123)

        with it('finds the initial share quantity without a NEW_ORDER'):
            submessages = self.messages[1:]  # Drop NEW
            _initial_qty_for_messages(submessages).should.equal(123)

            submessages = self.messages[2:]  # Drop NEW and EXECUTE
            _initial_qty_for_messages(submessages).should.equal(103)

        with it('finds if an order is unfilled at the end of the sample'):
            _unfilled_qty_for_messages(self.messages).should.equal(0)

            submessages = self.messages[:-1]  # Drop DELETE
            _unfilled_qty_for_messages(submessages).should.equal(20)

            submessages = self.messages[:-2]  # Drop DELETE and EXECUTE
            _unfilled_qty_for_messages(submessages).should.equal(53)

        with it('adjusts the quantities for orders with no NEWs or DELETEs'):
            messages = self.messages[1:-1]
            _initial_qty_for_messages(messages).should.equal(2 * 103)
            _unfilled_qty_for_messages(messages).should.equal(103)

    with description('when using the parser'):
        with before.each:
            with open('tests/messages_sample.fixture', 'r') as messages_file:
                start = datetime(2019, 10, 24, tzinfo=TZ).timestamp() * 10 ** 9
                self.extender = Extender(
                    messages_file, start, 0, (1356500, 1356300))

        with it('parses the csv into Messages'):
            expect(len(self.extender.initial_messages)).should.equal(9)
            for m in self.extender.initial_messages:
                m.should.be.a(Message)
                m.message_type.shouldnt.equal(MessageType.IGNORE)

        with it('mixes fake messages into the sample'):
            mixed = set(self.extender.mixed_messages)
            initial = set(self.extender.initial_messages)
            expect(initial).should.be.lower_than(mixed)

        with it('yields a copy of the original sample first'):
            book = OrderBook('SPY')
            generator = self.extender.extend_sample(0, book)

            sent = ignored = 0
            for initial in self.extender.initial_messages:
                if not book.is_valid_msg(initial):
                    ignored += 1
                    continue
                extended = next(generator)
                extended.should.equal(initial)
                book.send(extended)
                sent += 1

            expect(ignored).should.equal(1)
            expect(sent).should.equal(8)
            self.extender.mixed_messages.shouldnt.contain(next(generator))

        with description('to make a cyclic sample'):
            with before.each:
                self.added = set(self.extender.mixed_messages).difference(
                    set(self.extender.initial_messages))

            with it('adds NEW_ORDER messages for orders missing one'):
                new = [m for m in self.added
                       if m.message_type == MessageType.NEW_ORDER]

                len(new).should.equal(1)
                new[0].id.should.equal(16121503)
                new[0].share_quantity.should.equal(800)

            with it('adds DELETE messages for unfilled orders at the end of sample'):
                delete = [m for m in self.added
                          if m.message_type == MessageType.DELETE]

                len(delete).should.equal(2)
                expect(set(m.id for m in delete)).should.equal(
                    {16076858, 16118419})
                expect(set(m.share_quantity for m in delete)).should.equal(
                    {400, 600})
