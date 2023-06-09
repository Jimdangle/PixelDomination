"""
This file defines the database models
"""

ADJS = ["dead","hairless","sadistic","metal","wild","domesticated","abnormal","medicated","cocky","massive","hilarious","bearded","slimy","self-centered","talking","naked","angry"]

NOUNS = ['blood', 'idiot', 'toaster', 'legend', 'death', 'therapy', 'psychic', 'knife', 'sandwich', 'hunting', 'lettuce', 'kitty', 'french', 'antidepressant', 'corn', 'president', 'candlestick', 'coffee', 'brethren', 'nation', 'tank', 'Germany', 'sound barrier', 'private investor', 'main people', 'stock car', 'elastic band', 'whole blood', 'telephone', 'mad cow disease']

N2 = ['rage', 'wish', 'ground' ,'chef', 'drug', 'cake', 'maker', 'pot', 'brakes']

from datetime import datetime,timedelta
from .common import db, Field, auth
from pydal.validators import *
import random

def get_user_id():
    return auth.current_user.get('id') if auth.current_user else None

def get_username():
    return auth.current_user.get('username') if auth.current_user else None

def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.utcnow()

def get_time_timestamp():
    return get_time().timestamp()

def get_players_game():
    res = db(db.Ply_Stats.user == get_user_id()).select()
    print(res)
    if len(res) > 0:
        return res[0]["last_game_id"]
    
    return None

def get_game_name(id:int):
    q = db.Games.id==id
    res = db(q).select()
    if len(res) <=0:
        return None
    return res[0]['name']

def gen_rand_name():
    print("Hello wolf")
    random.seed(get_time_timestamp())
    adj = random.randint(1,len(ADJS)-1)
    noun = random.randint(1,len(NOUNS)-1)
    n2   = random.randint(1,len(N2)-1)
    name = f'{ADJS[adj]} {NOUNS[noun]} {N2[n2]}'
    print(name)
    return name


def get_player_pixels():
    user = get_user_id()
    q = db.Board.uid == user
    res = db(q).count()

    black = db((db.Board.uid == user) & (db.Board.color == 'black')).count()
    red = db((db.Board.uid == user) & (db.Board.color == 'red')).count()
    green = db((db.Board.uid == user) & (db.Board.color == 'green')).count()
    blue = db((db.Board.uid == user) & (db.Board.color == 'blue')).count()
    yellow = db((db.Board.uid == user) & (db.Board.color == 'yellow')).count()

    return dict(total=res,black=black,red=red,green=green,blue=blue,yellow=yellow)


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later



db.define_table('Games',
                Field('name', 'string', default=gen_rand_name),
                Field('x_size', 'integer', required=True, requires=IS_INT_IN_RANGE(20,200,error_message='pick between 20, and 200')),
                Field('y_size', 'integer', required=True, requires=IS_INT_IN_RANGE(20,200,error_message='pick between 20, and 200')),
                Field('time_started','integer',required=True, default=get_time_timestamp),
                Field('move_interval','integer',required=True),
                Field('live_time', 'integer', required=True, requires=IS_IN_SET([1,2,4,6,12,24,48,72]))
                )

db.Games.time_started.writable  = False
db.Games.time_started.readable  = False



db.commit()

db.define_table('Board',
                Field('uid','integer',required=True),
                Field('pos_x','integer',required=True),
                Field('pos_y', 'integer', required=True),
                Field('color', 'string', required=True,),
                Field('game_id', 'references Games', required=True,)
                )

db.commit()



db.define_table('UClick',
                Field('uid', 'references auth_user', required=True),
                Field('last_click', 'integer', default=get_time_timestamp())
                )

db.commit()


# Game clicks
# gid : the id of the game the user clicked in
# user: the id of the user who clicked
# click_time: the time the user clicked
# (gid, user) needs to be unique so that we only have one entry per game per user at a time hence why it is a primary key
db.define_table('GClick',
                Field('gid', 'references Games', required=True),
                Field('user', 'references auth_user', required=True),
                Field('click_time', 'integer', default=0),
                primarykey=['gid', 'user'])

db.commit()


db.define_table('Ply_Stats',
                Field('user', 'integer', required=True, unique=True),
                Field('total_clicks', 'integer', default=0),
                Field('last_click', 'integer'),
                Field('last_game_id', 'integer')
                )


db.commit()

db.define_table('Chat',
                Field('user', 'integer', required=True),
                Field('message', 'string', required=True),
                Field('time', 'datetime', default=get_time),
                Field('gid', 'references Games', required=True)
                )

db.commit()


### SQL for player leeader board
##  SELECT AU.email, COUNT(*)
##  FROM auth_user AU, Board B
##  WHERE AU.id = B.id
##  
##
###

def clean_tables():
    SQL = ['DELETE FROM Games;', 'DELETE FROM Board;', 'DELETE FROM UClick;', 'DELETE FROM GClick;', 'DELETE FROM Ply_Stats;']
    
    for sql in SQL:
        db.executesql(sql)
        db.commit()

# Uncomment to wipe tables
# We should probably be doing this on every pull
#clean_tables()


def ttl(timestamp_start:int, hours_to_live:int):
    time = datetime.fromtimestamp(timestamp_start)
    ttl_out = time + timedelta(hours=hours_to_live)
    time_left = ttl_out - datetime.utcnow()

    return time_left

# Clear a Games pixels from the Board table
# use to clean up after expired game so we can save space in the Board table
def clear_game_board(gid:int):
    q = db.Board.game_id == gid # pixels with game_id == gid
    r = db(q).delete() #delete them
    db.commit()
    return

def check_expired_games():
    q = db.Games.time_started < get_time_timestamp #games created before now 
    games = db(q).as_list() #select as a list so we can go over them

    dead_games = list()
    for game in games: 
        time_started = game['time_started']
        live_time    = game['live_time']
        if ttl(time_started,live_time) <= 0:
            dead_games.append(game['id']) #add the id of the dead game to the list

    return dead_games()