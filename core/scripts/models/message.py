import enum
from datetime import datetime


class MessageType(enum.IntEnum):
    NEW_ORDER = 1
    MODIFY = 2
    DELETE = 3
    EXECUTE = 4
    IGNORE = 5


class Message:
    def __init__(self, time, message_type, id_, share_quantity, price, direction):
        self.time = time
        self.message_type = message_type
        self.id = id_
        self.share_quantity = share_quantity
        self.price = price
        self.direction = direction
        self.sod_offset = 0

    def __str__(self):
        return ('<Message id="{id}" time="{timef}" type="{message_type}" ' +
                'price="{price}" qty="{share_quantity}" direction="{direction}">').format(
                    **self.__dict__, timef=datetime.fromtimestamp(
                        self.time // 10**9).strftime('%Y-%m-%d %H:%M:%S'))

    def copy(self):
        return Message(self.time, self.message_type, self.id, self.share_quantity, self.price, self.direction)
