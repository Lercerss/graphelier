import argparse
import os
from datetime import datetime

from lobster.extender import Extender, weekdays, TZ
from lobster.parser import parse_top_of_book
from models.order_book import OrderBook
from mongo_db.db_connector import save_messages, save_order_book

parser = argparse.ArgumentParser(
    description='Import dataset into mongodb', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument(
    'message_file', help='Path to sample messages file', type=argparse.FileType())
parser.add_argument('start_time', help='Time at which sample starts, e.g. "2012-06-21 00:00:00"',
                    type=lambda x: datetime.strptime(x, '%Y-%m-%d %H:%M:%S'))
parser.add_argument('instrument', help='Name of instrument for sample')
parser.add_argument('-e', '--extend', nargs=2,
                    help='Number of days to extend the sample over and the number of times to duplicate messages',
                    default=[1, 1])
parser.add_argument('-t', '--top-of-book', help='Top of book at the start of sample (ask, bid)',
                    nargs=2)

# Determines how many messages will be parsed before sending them to db
MESSAGE_BATCH_SIZE = 200

EOD = 16 * 60 * 60 * 10**9  # 4:00 PM as ns


def load(message_file, ob_file_path, start_time, instrument, extend, top_of_book):
    start_time = start_time.replace(tzinfo=TZ)
    start_timestamp = int(start_time.timestamp() * 10**9)  # in nanoseconds
    interval = 10 * 10**9  # in nanoseconds

    initial_top_of_book = (int(top_of_book[0]), int(top_of_book[1])) \
        if top_of_book else parse_top_of_book(ob_file_path)
    extender = Extender(message_file, start_timestamp,
                        int(extend[1]), initial_top_of_book)
    for day in weekdays(start_timestamp, int(extend[0])):
        order_book = OrderBook(instrument)
        order_book.last_time = day

        order_book.last_sod_offset = sod_offset_counter = day
        last_multiple = 1
        message_buffer = []

        day_diff = day - start_timestamp
        max_time = day + EOD
        for message in extender.extend_sample(day_diff, order_book):
            if message.time > max_time:
                break
            message.sod_offset = sod_offset_counter
            current_multiple = message.time // interval
            if current_multiple > last_multiple:
                print(str(order_book))
                last_multiple = current_multiple
                save_order_book(order_book)
            message_buffer.append(message)

            if len(message_buffer) > MESSAGE_BATCH_SIZE:
                save_messages(message_buffer, instrument)
                message_buffer = []

            order_book.send(message)
            sod_offset_counter += 1

        # Flushing out remaining messages in buffer
        if len(message_buffer) > 0:
            save_messages(message_buffer, instrument)

        eod_clear = OrderBook(instrument)
        eod_clear.last_time = max_time
        eod_clear.last_sod_offset = sod_offset_counter
        # save an empty order_book at the end of the day
        save_order_book(eod_clear)

        print('best bid volume={}\tbest ask volume={}'.format(
            sum(o.qty for o in order_book.bid_book[order_book.bid]),
            sum(o.qty for o in order_book.ask_book[order_book.ask])
        ))


def main():
    args = parser.parse_args()
    ob_file_path = args.message_file.name.replace('message', 'orderbook')
    if not args.top_of_book:
        while not os.path.exists(ob_file_path):
            print(
                'Could not find an orderbook file provided by Lobster in the same path as the message file.')
            ob_file_path = input(
                'Please provide the path to the orderbook file: ')

    load(args.message_file, ob_file_path, args.start_time,
         args.instrument, args.extend, args.top_of_book)


if __name__ == '__main__':
    main()
