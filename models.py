"""
This file defines the database models
"""

ADJS = ["dead","hairless","sadistic","metal","wild","domesticated","abnormal","medicated","cocky","massive","hilarious","bearded","slimy","self-centered","talking","naked","angry"]

NOUNS = ['blood', 'idiot', 'toaster', 'legend', 'death', 'therapy', 'psychic', 'knife', 'sandwich', 'hunting', 'lettuce', 'kitty', 'french', 'antidepressant', 'corn', 'president', 'candlestick', 'coffee', 'brethren', 'nation', 'tank', 'Germany', 'sound barrier', 'private investor', 'main people', 'stock car', 'elastic band', 'whole blood', 'telephone', 'mad cow disease']

N2 = ['rage', 'wish', 'ground' ,'chef', 'drug', 'cake', 'maker', 'pot', 'brakes']

import datetime
from .common import db, Field, auth
from pydal.validators import *
import random

def get_user_id():
    return auth.current_user.get('id') if auth.current_user else None

def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()

def get_time_timestamp():
    return get_time().timestamp()

def get_players_game():
    res = db(db.Ply_Stats.user == get_user_id()).select()
    if len(res) > 0:
        return res[0]["last_game_id"]
    
    return None

def gen_rand_name():
    print("Hello wolf")
    random.seed(get_time_timestamp())
    adj = random.randint(1,len(ADJS)-1)
    noun = random.randint(1,len(NOUNS)-1)
    n2   = random.randint(1,len(N2)-1)
    name = f'{ADJS[adj]} {NOUNS[noun]} {N2[n2]}'
    print(name)
    return name

### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later



db.define_table('Games',
                Field('name', 'string', default=gen_rand_name),
                Field('x_size', 'integer', required=True, requires=IS_INT_IN_RANGE(20,200,error_message='pick between 20,200')),
                Field('y_size', 'integer', required=True, requires=IS_INT_IN_RANGE(20,200,error_message='pick between 20,200')),
                Field('time_started','integer',required=True, default=get_time_timestamp()),
                Field('move_interval','integer',required=True),
                Field('live_time', 'integer', required=True, requires=IS_IN_SET([12,24,48,72]))
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




