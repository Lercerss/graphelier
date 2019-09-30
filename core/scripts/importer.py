import argparse
import csv
from datetime import datetime
from models.message import LobsterMessageParser
from models.order_book import OrderBook

parser = argparse.ArgumentParser(
    description='Import dataset into', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('file', type=argparse.FileType())
parser.add_argument(
    'start_time', type=lambda x: datetime.strptime(x, '%Y-%m-%d %H:%M:%S'))


def load(file, start_time, cls=LobsterMessageParser):
    message_parser = cls(start_time)
    order_book = OrderBook()
    try:
        reader = csv.reader(file)
        for l in reader:
            order_book.send(message_parser.parse(l))
        print(str(order_book))
        print('best bid volume={}\tbest ask volume={}'.format(sum(o.qty for o in order_book.bid_book[order_book.bid]), sum(o.qty for o in order_book.ask_book[order_book.ask])))
    except Exception as e:
        print('Failed to parse file due to: {}'.format(e))
        exit(1)


if __name__ == '__main__':
    args = parser.parse_args()
    load(args.file, args.start_time)
