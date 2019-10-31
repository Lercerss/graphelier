import argparse
from datetime import datetime

from lobster.extender import Extender, weekdays
from models.order_book import OrderBook
from mongo_db.db_connector import save_messages, save_order_book

parser = argparse.ArgumentParser(
    description='Import dataset into mongodb', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument(
    'file', help='Path to sample messages file', type=argparse.FileType())
parser.add_argument('start_time', help='Time at which sample starts, e.g. "2012-06-21 00:00:00"',
                    type=lambda x: datetime.strptime(x, '%Y-%m-%d %H:%M:%S'))
parser.add_argument('instrument', help='Name of instrument for sample')
parser.add_argument('-e', '--extend', nargs=2,
                    help='Number of days to extend the sample over and the number of times to duplicate messages',
                    default=[1, 1])

# Determines how many messages will be parsed before sending them to db
MESSAGE_BATCH_SIZE = 200

EOD = 16 * 60 * 60 * 10**9  # 4:00 PM as ns


def load(file, start_time, instrument, extend):
    start_timestamp = start_time.timestamp() * 10**9  # in nanoseconds
    interval = 10 * 10**9  # in nanoseconds

    extender = Extender(file, start_timestamp, int(extend[1]))
    for day in weekdays(start_timestamp, int(extend[0])):
        order_book = OrderBook(instrument)
        sod_offset_counter = 0
        last_multiple = 1
        message_buffer = []

        day_diff = day - start_timestamp
        max_time = day + EOD
        for message in extender.extend_sample(day_diff):
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


if __name__ == '__main__':
    args = parser.parse_args()
    load(args.file, args.start_time, args.instrument, args.extend)
