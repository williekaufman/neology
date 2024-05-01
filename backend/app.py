#!/usr/bin/python3

from flask import Flask, jsonify, request, make_response, render_template
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from flask_cors import CORS, cross_origin
from secrets import compare_digest, token_hex
from redis_utils import rset, rget
from words import random_words
from game import Game
import traceback
from functools import wraps

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

def recurse_to_json(obj):
    if isinstance(obj, dict):
        return {k: recurse_to_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [recurse_to_json(v) for v in obj]
    elif hasattr(obj, 'to_json'):
        return obj.to_json()
    else:
        return obj

# decorator that takes in an api endpoint and calls recurse_to_json on its result
def api_endpoint(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try: 
            return func(*args, **kwargs)
        except Exception as e:
            print(traceback.print_exc())
            return jsonify({"error": "Unexpected error"}), 500
    return wrapper

def success_and_broadcast(game, additional_data=None, message_type='update'):
    data = {'game': game.to_json()}
    if additional_data:
        data.update(additional_data)
    socketio.emit(message_type, data, room=game.id)
    return success(data)

def success(data):
    return jsonify({'success': True, **data})

def failure(reason, data=None):
    return jsonify({'success': False, 'error': reason, **(data or {})})

def new_game_id():
    return "-".join(random_words(2)) + '-' + token_hex(1)

@app.route('/new_game', methods=['POST'])
@api_endpoint
def new_game():
    id = request.json.get('id') or new_game_id()
    try:
        game = Game.fresh(id)
    except Exception as e:
        return failure(str(e)) 
    game.write()
    return success({'game': game.to_json()})

@app.route('/give_clue', methods=['POST'])
@api_endpoint
def give_clue():
    id = request.json.get('id')
    username = request.json.get('username')
    if not id:
        return failure('Missing id')
    game = Game.of_id(id)
    if not game:
        return failure('Game not found')
    clue = request.json.get('clue')
    if not clue:
        return failure('Missing required fields')
    if (error := game.give_clue(clue, username)):
        return failure(error)
    return success_and_broadcast(game)

@app.route('/guess', methods=['POST'])
@api_endpoint
def guess():
    id = request.json.get('id')
    username = request.json.get('username')
    if not id:
        return failure('Missing id')
    if not username:
        return failure('Missing username')
    game = Game.of_id(id)
    if not game:
        return failure('Game not found')
    row = request.json.get('row')
    col = request.json.get('col')
    if row is None or col is None:
        return failure('Missing square')
    error, correct = game.guess(row, col, username)
    if error:
        return failure(error)
    return success_and_broadcast(game, {'correct': correct})

@app.route("/draw_card", methods=['POST'])
@api_endpoint
def draw():
    id = request.json.get('id')
    username = request.json.get('username')
    if not id:
        return failure('Missing id')
    if not username:
        return failure('Missing username')
    game = Game.of_id(id)
    if not game:
        return failure('Game not found')
    error = game.draw_card(username)
    if error:
        return failure(error)
    return success_and_broadcast(game)

@app.route('/game', methods=['GET'])
@api_endpoint
def game():
    id = request.args.get('id')
    if not id:
        return failure('Missing id')
    game = Game.of_id(id)
    if not game:
        return failure('Game not found')
    return success({'game': game.to_json()})

@app.route('/refresh', methods=['POST'])
@api_endpoint
def refresh():
    id = request.json.get('id')
    if not id:
        return failure('Missing id')
    game = Game.of_id(id)
    if not game:
        return failure('Game not found')
    game.refresh()
    game.write()
    return success_and_broadcast(game)

@socketio.on('join')
def on_join(data):
    join_room(data['room'])

@socketio.on('leave')
def on_leave(data):
    leave_room(data['room'])

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5021)