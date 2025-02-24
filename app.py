# File: app.py
from flask import Flask, session, jsonify, request, send_from_directory
import random
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # Change for production

# Define all possible environments and their card sets
ENVIRONMENTS = {
    "fruits": ["🍎", "🍌", "🍇", "🍓", "🍍", "🍉", "🍒", "🥝"],
    "birds": ["🦜", "🦉", "🦢", "🦩", "🐦", "🐤", "🐧", "🦆"],
    "cars": ["🚗", "🚕", "🚙", "🚓", "🏎️", "🚑", "🚒", "🚐"],
    "clothes": ["👗", "👚", "👕", "👖", "👔", "🧥", "👘", "👠"],
    "electronics": ["💻", "📱", "🖥️", "🖨️", "🎧", "📷", "⌨️", "🕹️"],
    "animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"],
    "nature": ["🌳", "🌷", "🌵", "🍂", "🍁", "🌴", "🌺", "🌊"]
}

@app.route('/')
def welcome():
    """Serve the welcome page."""
    return send_from_directory('templates', 'welcome.html')


@app.route('/environment')
def environment():
    """Serve the environment selection page."""
    return send_from_directory('templates', 'environment.html')


@app.route('/index')
def index():
    """
    Serve the game page with the selected environment.
    Redirect to environment selection if not chosen.
    """
    environment = request.args.get('environment')
    if not environment or environment not in ENVIRONMENTS:
        # Redirect to environment selection if no valid environment selected
        return send_from_directory('templates', 'environment.html')
    return send_from_directory('templates', 'index.html')

@app.route('/start_game', methods=['POST'])
def start_game():
    """
    Initialize a new game session based on the selected environment.
    """
    data = request.get_json()
    environment = data.get('environment', 'fruits')

    # Validate the selected environment
    if environment not in ENVIRONMENTS:
        return jsonify({"error": f"Invalid environment '{environment}'"}), 400

    # Create and shuffle the deck
    deck = ENVIRONMENTS[environment] * 2  # Duplicate for pairs
    random.shuffle(deck)

    # Initialize session variables
    session['deck'] = deck
    session['flipped'] = []
    session['matched'] = []
    session['moves'] = 0
    session['start_time'] = datetime.now().isoformat()

    return jsonify({
        "message": "Game started!",
        "deck_size": len(deck),
        "timer_start": session['start_time']
    })


@app.route('/flip_card', methods=['POST'])
def flip_card():
    """
    Handle a card flip and check for matches.
    """
    data = request.get_json()
    index = data.get('index')

    # Validate the card index
    if 'deck' not in session or index < 0 or index >= len(session['deck']):
        return jsonify({"error": "Invalid card index"}), 400

    if index in session['flipped'] or index in session['matched']:
        return jsonify({"error": "Card already flipped"}), 400

    # Add the card to the flipped cards
    session['flipped'].append(index)
    session['moves'] += 1

    # Check for matches if two cards are flipped
    matched = False
    if len(session['flipped']) == 2:
        card1, card2 = session['flipped']
        if session['deck'][card1] == session['deck'][card2]:
            session['matched'].extend(session['flipped'])
            matched = True
        session['flipped'] = []  # Reset flipped cards

    return jsonify({
        "flipped": session['flipped'],
        "matched": session['matched'],
        "deck": session['deck'],
        "moves": session['moves'],
        "matched_now": matched
    })


@app.route('/get_score', methods=['GET'])
def get_score():
    """
    Retrieve the current score and game status.
    """
    if 'start_time' not in session:
        return jsonify({"error": "Game not started"}), 400

    start_time = datetime.fromisoformat(session['start_time'])
    elapsed_time = (datetime.now() - start_time).total_seconds()

    return jsonify({
        "moves": session['moves'],
        "elapsed_time": elapsed_time,
        "matched_pairs": len(session['matched']) // 2,
        "total_pairs": len(session['deck']) // 2,
        "game_complete": len(session['matched']) == len(session['deck'])
    })


if __name__ == '__main__':
    app.run(debug=True)
