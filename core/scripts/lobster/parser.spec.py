import csv

from sure import expect
from mamba import description, it, before

from models.message import Message, MessageType
from lobster.parser import LobsterMessageParser

with description('LobsterMessageParser:') as self:
    with before.all:
        with open('tests/messages_sample.fixture', 'r') as f:
            self.data = list(csv.reader(f))
        self.parser = LobsterMessageParser(1000)

    with it('parses sample messages'):
        for line in self.data:
            self.parser.parse.when.called_with(line).shouldnt.throw(Exception)
    
    with it('offsets messages from the start of given day'):
        result = self.parser.parse(['0.000002', '1', '2', '3', '45', '-1'])
        expect(result).should.be.a(Message)
        result.should.equal(Message(3000, MessageType.NEW_ORDER, 2, 3, 45, -1))
