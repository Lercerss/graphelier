import logging
import sys

formatter = logging.Formatter('%(asctime)s %(levelname)7s - %(message)s')

__LOGGER = logging.getLogger('graphelier')
__LOGGER.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.INFO)
__LOGGER.addHandler(console_handler)

file_handler = logging.FileHandler('importer_run.log', 'a')
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.DEBUG)
__LOGGER.addHandler(file_handler)

critical = __LOGGER.critical
debug = __LOGGER.debug
error = __LOGGER.error
info = __LOGGER.info
log = __LOGGER.log
warning = __LOGGER.warning

if sys.argv[0].endswith('mamba'):
    __LOGGER.setLevel(logging.NOTSET)