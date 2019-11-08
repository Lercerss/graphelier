import enum
from datetime import datetime


class MessageType(enum.IntEnum):
    NEW_ORDER = 1
    MODIFY = 2
    DELETE = 3
    EXECUTE = 4
    IGNORE = 5


class Message:
    def __init__(self, time, message_type, id, share_quantity, price, direction, sod_offset=0, fake=False):
        self.time = time
        self.message_type = message_type
        self.id = id
        self.share_quantity = share_quantity
        self.price = price
        self.direction = direction
        self.sod_offset = sod_offset
        self.fake = fake

    def __str__(self):
        return ('<Message id="{id}" time="{timef}" type="{message_type}" ' +
                'price="{pricef}" qty="{share_quantity}" direction="{direction}">').format(
                    **self.__dict__,
                    timef=datetime.fromtimestamp(
                        self.time // 10**9).strftime('%Y-%m-%d %H:%M:%S'),
                    pricef=self.price / 10000)

    def copy(self):
        return Message(**self.__dict__)
