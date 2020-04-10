from db import fetch_n_clusters_from_time
from flask import current_app as app, request, jsonify
from serializers import cluster_cursor_to_dict

LOGGER = app.logger


@app.route('/', methods=['GET'])
def root():
    return jsonify({'message': 'Graphelier News'}), 200


@app.route('/news_clusters/<start_timestamp>', methods=['GET'])
def news_clusters(start_timestamp):
    """
    Retrieves clusters of news articles based on a starting timestamp
    - ?direction: 1 is forward in time and -1 is back in time
    - ?quantity: amount of clusters requested
    - start_timestamp: starting timestamp in seconds
    """
    direction = int(request.args.get('direction', '1'))
    quantity = int(request.args.get('quantity', '10'))
    try:
        timestamp = int(start_timestamp)
    except ValueError as e:
        LOGGER.error(e)
        return jsonify({'message': 'Given timestamp is badly formed: {}'.format(start_timestamp)}), 400

    query_result = fetch_n_clusters_from_time(timestamp, quantity, direction)
    clusters = [cluster_cursor_to_dict(cluster_cursor) for cluster_cursor in query_result]
    clusters.sort(key=lambda cluster: cluster['timestamp'])
    LOGGER.info('Found {} clusters'.format(len(clusters)))
    next_timestamp = timestamp

    if len(clusters) != 0:
        next_timestamp = clusters[-1]['timestamp'] if direction == 1 else clusters[0]['timestamp']

    return jsonify({
        'clusters': clusters,
        'timestamp': timestamp,
        'next_timestamp': next_timestamp,
    }), 200
