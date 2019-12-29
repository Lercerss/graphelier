import csv

from sure import expect
from mamba import description, it, before

from models.order_book import OrderBook, Order
from models.message import Message, MessageType

INSTRUMENT = 'SPY'


def _message(time=1, type_=MessageType.NEW_ORDER, id_=11,
             qty=10, price=2, direction=-1):
    return Message(time, type_, id_, qty, price, direction)


with description('OrderBook:') as self:
    with before.each:
        self.order_book = OrderBook(INSTRUMENT)

    with it('receives a new order message'):
        self.order_book.send(_message())
        (self.order_book.ask).should.equal(2)
        len(self.order_book.ask_book).should.equal(1)
        len(self.order_book.ask_book[2]).should.equal(1)

    with it('confirms the validity of the sample fixture'):
        from lobster.parser import LobsterMessageParser
        parser = LobsterMessageParser(0)
        messages = []
        with open('tests/messages_sample.fixture') as f:
            messages = [parser.parse(line) for line in csv.reader(f)]
        len(messages).should.equal(9)

        for m in messages:
            if not self.order_book.is_valid_msg(m):
                m.id.should.equal(16121503)
            self.order_book.send(m)

    with description('when there exists an order on the book'):
        with before.each:
            # 2 bids and 2 asks on the book
            self.order_book.send(_message(id_=11))
            self.order_book.send(_message(id_=12))
            self.order_book.send(_message(id_=13, direction=1, price=1))
            self.order_book.send(_message(id_=14, direction=1, price=1))

        with it('deletes an existing order'):
            len(self.order_book.ask_book[2]).should.equal(2)
            delete = _message(type_=MessageType.DELETE)
            self.order_book.send(delete)
            len(self.order_book.ask_book[2]).should.equal(1)

            delete = _message(type_=MessageType.DELETE, id_=12)
            self.order_book.send(delete)
            (self.order_book.ask).should.equal(0)
            len(self.order_book.ask_book).should.equal(0)

        with it('modifies an existing order'):
            modify = _message(type_=MessageType.MODIFY, qty=5)
            (self.order_book.id_map[modify.id].qty).should.equal(10)
            self.order_book.send(modify)
            (self.order_book.id_map[modify.id].qty).should.equal(5)
            len(self.order_book.ask_book[2]).should.equal(2)

        with it('executes a trade on an existing order'):
            execute = _message(type_=MessageType.EXECUTE, qty=6)
            (self.order_book.id_map[execute.id].qty).should.equal(10)
            self.order_book.send(execute)
            (self.order_book.id_map[execute.id].qty).should.equal(4)
            len(self.order_book.ask_book[2]).should.equal(2)

        with it('resets priority on orders upon receiving a modify with negative qty'):
            ids = [o.id for o in self.order_book.ask_book[2]]
            ids.should.equal([11, 12])

            self.order_book.send(_message(type_=MessageType.MODIFY, qty=-5))
            ids = [o.id for o in self.order_book.ask_book[2]]
            ids.should.equal([12, 11])

        with it('detects possible conflicts for a given message'):
            # Same price as existing orders
            incoming = _message(id_=15, price=2, direction=1)
            asks = list(self.order_book.conflicts(incoming))
            expect(asks).should.equal(
                [Order(11, 10, 1, -1), Order(12, 10, 1, -1)]
            )

            incoming = _message(id_=16, price=1)
            bids = list(self.order_book.conflicts(incoming))
            expect(bids).should.equal(
                [Order(13, 10, 1, 1), Order(14, 10, 1, 1)]
            )

        with it('confirms the validity of a message'):
            assert expect(self.order_book.is_valid_msg(
                _message(id_=13))).should.be.truthy
            delete = _message(id_=13, type_=MessageType.DELETE)
            assert expect(self.order_book.is_valid_msg(delete)).should.be.falsy
            delete = _message(id_=12, type_=MessageType.DELETE)
            assert expect(self.order_book.is_valid_msg(
                delete)).should.be.truthy
