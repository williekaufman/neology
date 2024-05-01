import random
from redis_utils import rget, rset, rset_json, rget_json
from words import random_words

class Words():
    def __init__(self, vertical, horizontal):
        self.vertical = vertical
        self.horizontal = horizontal
        
    def fresh():
        words = random_words(10)
        return Words(
            vertical=words[:5],
            horizontal=words[5:]
        )
    
    def to_json(self):
        return {
            'vertical': self.vertical,
            'horizontal': self.horizontal
        }
        
    def of_json(d):
        return Words(
            vertical=d['vertical'],
            horizontal=d['horizontal']
        )
        
class Square():
    def __init__(self, x, y):
        self.x = x
        self.y = y
        
    def equals(self, other):
        if not other:
            return False
        return self.x == other.x and self.y == other.y
    
    def to_json(self):
        return {
            'x': self.x,
            'y': self.y
        }
        
    def of_json(d):
        return Square(
            x=d['x'],
            y=d['y']
        )
        
class Deck():
    def __init__(self, squares):
        self.squares = squares
        
    def fresh():
        return Deck(sorted(
            [
                Square(x, y)
                for x in range(5)
                for y in range(5)
            ],
            key=lambda x: random.random()
        ))
        
    def to_json(self):
        return {
            'squares': [s.to_json() for s in self.squares]
        }
        
    def of_json(d):
        return Deck(
            squares=[Square.of_json(s) for s in d['squares']]
        )

class Clue():
    def __init__(self, text, square, username):
        self.text = text
        self.square = square
        self.username = username
        
    def to_json(self):
        return {
            'text': self.text,
            'square': self.square.to_json(),
            'username': self.username
        }
        
    def of_json(d):
        return Clue(
            text=d['text'],
            square=Square.of_json(d['square']),
            username=d['username']
        )

class OutstandingCard():
    def __init__(self, username, square):
        self.username = username
        self.square = square
        
    def to_json(self):
        return {
            'username': self.username,
            'square': self.square.to_json()
        }
        
    def of_json(d):
        return OutstandingCard(
            username=d['username'],
            square=Square.of_json(d['square'])
        )

class Game():
    def __init__(self, words, deck, id, clue=None, correct=None, outstanding=None):
        self.words = words
        self.deck = deck
        self.id = id
        self.clue = clue
        self.correct = correct or []
        self.outstanding = outstanding or []
    
    def fresh(id):
        return Game(
            words=Words.fresh(),
            deck=Deck.fresh(),
            id=id
        )
        
    def refresh(self):
        self.words = Words.fresh()
        self.deck = Deck.fresh()
        self.clue = None
        self.correct = []
        self.outstanding = []
   
    def draw_card(self, username):
        if not self.deck.squares:
            return "No cards left"
        if username in [o.username for o in self.outstanding]:
            return "You already have a card"
        card = self.deck.squares.pop()
        self.outstanding.append(OutstandingCard(username, card))
        self.write()
   
    # returns error, if there is one 
    def give_clue(self, clue, username):
        square = [o.square for o in self.outstanding if o.username == username]
        if len(square) != 1:
            return "You don't have a card"
        square = square[0]
        if self.clue:
            return "Clue already given"
        self.clue = Clue(clue, square, username)
        self.write()
   
    # returns error associated with guess, if there is one, and whether the guess is correct 
    def guess(self, row, col, username):
        if row < 0 or row >= 5 or col < 0 or col >= 5:
            return "Invalid square", False
        square = Square(col, row)
        if not self.clue:
            return "No clue given", False
        if square in self.correct:
            return "Square already guessed", False
        if username == self.clue.username:
            return "You can't guess your own clue", False
        is_correct = False
        print(square, self.clue.square, square.equals(self.clue.square))
        if square.equals(self.clue.square):
            self.correct.append(square)
            is_correct = True
        self.outstanding = [o for o in self.outstanding if o.username != self.clue.username]
        self.draw_card(self.clue.username)
        self.clue = None
        self.write()
        return None, is_correct 
             
    def to_json(self):
        ret = {
            'words': self.words.to_json(),
            'deck': self.deck.to_json(),
            'id': self.id,
            'clue': self.clue.to_json() if self.clue else None,
            'correct': [s.to_json() for s in self.correct],
            'outstanding': [o.to_json() for o in self.outstanding]
        }
        if not self.outstanding and not self.deck.squares:
            ret['finalScore'] = len(self.correct)
        return ret
        
    def of_json(d):
        return Game(
            words=Words.of_json(d['words']),
            deck=Deck.of_json(d['deck']),
            id=d['id'],
            clue=Clue.of_json(d['clue']) if d['clue'] else None,
            correct=[Square.of_json(s) for s in d['correct']],
            outstanding=[OutstandingCard.of_json(o) for o in d['outstanding']]
        )
        
    def of_id(id):
        try:
            return Game.of_json(rget_json(f'game:{id}'))
        except Exception:
            return None 
        
    def write(self):
        rset_json(f'game:{self.id}', self.to_json())