import argparse
import csv
from datetime import datetime

import pymongo

from models.message import LobsterMessageParser
from models.order_book import OrderBook
from mongo_db.db_connector import save_messages, save_order_book

parser = argparse.ArgumentParser(
    description='Import dataset into', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('file', type=argparse.FileType())
parser.add_argument(
    'start_time', type=lambda x: datetime.strptime(x, '%Y-%m-%d %H:%M:%S'))
parser.add_argument('instrument')

# Determines how many messages will be parsed before sending them to db
MESSAGE_BATCH_SIZE = 200


def load(file, start_time, instrument, cls=LobsterMessageParser):
    start_timestamp = start_time.timestamp() * 10**9  # in nanoseconds
    message_parser = cls(start_timestamp)
    order_book = OrderBook(instrument)
    try:
        last_multiple = 0
        interval = 10 * 10**9  # in nanoseconds
        reader = csv.reader(file)
        message_buffer = []
        for l in reader:
            message = message_parser.parse(l)
            current_multiple = message.time // interval
            if current_multiple > last_multiple:
                print(str(order_book))
                timestamp = start_timestamp + current_multiple * interval
                last_multiple = current_multiple
                save_order_book(order_book)
            message_buffer.append(message)

            if len(message_buffer) > MESSAGE_BATCH_SIZE:
                save_messages(message_buffer, instrument)
                message_buffer = []

            order_book.send(message)

        # Flushing out remaining messages in buffer
        if len(message_buffer) > 0:
            save_messages(message_buffer, instrument)

        print('best bid volume={}\tbest ask volume={}'.format(sum(
            o.qty for o in order_book.bid_book[order_book.bid]), sum(o.qty for o in order_book.ask_book[order_book.ask])))
    except Exception as e:
        print('Failed to parse file due to: {}'.format(e))
        exit(1)


if __name__ == '__main__':
    args = parser.parse_args()
    load(args.file, args.start_time, args.instrument)
