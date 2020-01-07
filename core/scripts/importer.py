import argparse
import os
from datetime import datetime

from lobster.extender import Extender, weekdays, TZ
from lobster.parser import parse_top_of_book
from models.order_book import OrderBook
from mongo_db.db_connector import save_messages, save_order_book, check_interval, upsert_order_book

parser = argparse.ArgumentParser(
    description='Import dataset into mongodb', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument(
    'message_file', help='Path to sample messages file', type=argparse.FileType())
parser.add_argument('start_time', help='Time at which sample starts, e.g. "2012-06-21 00:00:00"',
                    type=lambda x: datetime.strptime(x, '%Y-%m-%d %H:%M:%S'))
parser.add_argument('instrument', help='Name of instrument for sample')
parser.add_argument('-e', '--extend',
                    help='Number of days to extend the sample over',
                    default=1)
parser.add_argument('-d', '--duplicate',
                    help='Number of times to duplicate messages',
                    default=1)
parser.add_argument('-t', '--top-of-book', help='Top of book at the start of sample (ask, bid)',
                    nargs=2)
parser.add_argument('-i', '--interval',
                    help='Time in nanoseconds between orderbook snapshots',
                    type=int, default=10**8)

# Determines how many messages will be parsed before sending them to db
MESSAGE_BATCH_SIZE = 200

EOD = 16 * 60 * 60 * 10**9  # 4:00 PM as ns


class _Loader:
    def __init__(self, extender, start_timestamp, instrument, interval):
        self.extender = extender
        self.start_timestamp = start_timestamp
        self.instrument = instrument
        self.interval = interval
        self.order_book = None
        self.sod_offset_counter = 0
        self.message_buffer = []
        self.last_multiple = 0

    def _new_book(self, day):
        self.order_book = OrderBook(self.instrument)
        self.order_book.last_time = day
        self.order_book.last_sod_offset = day
        self.sod_offset_counter = day

    def _save_buffer(self):
        save_messages(self.message_buffer, self.instrument)
        self.message_buffer.clear()

    def _handle_message(self, message):
        message.sod_offset = self.sod_offset_counter
        current_multiple = message.time // self.interval
        if current_multiple > self.last_multiple:
            print(str(self.order_book))
            self.last_multiple = current_multiple
            save_order_book(self.order_book)
        self.message_buffer.append(message)

        if len(self.message_buffer) > MESSAGE_BATCH_SIZE:
            self._save_buffer()

        self.order_book.send(message)
        self.sod_offset_counter += 1

    def load_single_day(self, day):
        """Loads messages for a single day"""
        self._new_book(day)

        self.last_multiple = 1

        day_diff = day - self.start_timestamp
        max_time = day + EOD
        for message in self.extender.extend_sample(day_diff, self.order_book):
            if message.time > max_time:
                break
            self._handle_message(message)

        # Flushing out remaining messages in buffer
        if len(self.message_buffer) > 0:
            self._save_buffer()

        eod_clear = OrderBook(self.instrument)
        eod_clear.last_time = max_time
        eod_clear.last_sod_offset = self.sod_offset_counter
        # save an empty order_book at the end of the day
        save_order_book(eod_clear)

        print('best bid volume={}\tbest ask volume={}'.format(
            sum(o.qty for o in self.order_book.bid_book[self.order_book.bid]),
            sum(o.qty for o in self.order_book.ask_book[self.order_book.ask])
        ))


def load(**kwargs):
    """Loads the given messages file into the database.
    Args:
        message_file: File object containing sample messages as csv
        ob_file_path: optional path to the order book csv data
        top_of_book: optional values for the best bid and ask before the sample
        interval: number of nanoseconds between order book snapshots
        instrument: string representing the name of the instrument
        duplicate: number of times to duplicate messages
        extend: number of days to extend the sample over
        start_time: datetime representing the first day of the sample

    Note: at least one of `top_of_book` or `ob_file_path` must be provided
    """
    start_time = kwargs['start_time'].replace(tzinfo=TZ)
    start_timestamp = int(start_time.timestamp() * 10**9)  # in nanoseconds

    instrument = kwargs['instrument']
    interval = check_interval(kwargs['interval'], instrument)
    upsert_order_book(OrderBook(instrument))

    initial_top_of_book = parse_top_of_book(
        kwargs['ob_file_path'], kwargs['top_of_book'])
    extender = Extender(kwargs['message_file'], start_timestamp,
                        int(kwargs['duplicate']), initial_top_of_book)
    loader = _Loader(extender, start_timestamp, instrument, interval)
    for day in weekdays(start_timestamp, int(kwargs['extend'])):
        loader.load_single_day(day)


def main():
    args = parser.parse_args()
    ob_file_path = args.message_file.name.replace('message', 'orderbook')
    if not args.top_of_book:
        while not os.path.exists(ob_file_path):
            print(
                'Could not find an orderbook file provided by Lobster in the same path as the message file.')
            ob_file_path = input(
                'Please provide the path to the orderbook file: ')

    load(**args.__dict__, ob_file_path=ob_file_path)


if __name__ == '__main__':
    main()
