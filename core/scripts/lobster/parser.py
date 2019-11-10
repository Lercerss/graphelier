from typing import Callable, Tuple

from models.message import Message, MessageType

_lobster_msg_types = {
    # Maps lobster message types to MessageType enum
    '1': MessageType.NEW_ORDER,
    '2': MessageType.MODIFY,
    '3': MessageType.DELETE,
    '4': MessageType.EXECUTE,
    '5': MessageType.EXECUTE,
    '7': MessageType.IGNORE,
}


class LobsterMessageParser:
    """Parses messages stored in Lobster data format
    See LOBSTER_SampleFiles_ReadMe.txt for official documentation
    """

    def __init__(self, start_timestamp: int):
        self.line_parsers: Tuple[str, Callable] = (
            # Each index corresponds to an index in the line.
            # This maps indexes to object keys and the corresponding function to parse it from a string
            ('time', lambda x: int(float(x) * 10**9) + start_timestamp),
            ('message_type', lambda x: _lobster_msg_types.get(x, MessageType.IGNORE)),
            ('id', int),
            ('share_quantity', int),
            ('price', int),
            ('direction', int)
        )

    def parse(self, line: Tuple[str, str, str, str, str, str]) -> Message:
        kwargs = {key: parse_fun(
            line[index]) for index, (key, parse_fun) in enumerate(self.line_parsers)}
        return Message(**kwargs)


def parse_top_of_book(ob_file_path: str) -> Tuple[int, int]:
    line = ''
    with open(ob_file_path, 'r') as f:
        line = f.readline()

    values = line.split(',')
    return int(values[0]), int(values[2])
