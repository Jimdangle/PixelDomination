"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_time_timestamp, get_user_id
import random

from time import gmtime, strftime

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth.user, url_signer)
def index():
    print(get_time_timestamp())
    
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url  = URL('my_callback', signer=url_signer),
        get_pixels_url   = URL('get_pixels', signer=url_signer),
        draw_url         = URL('draw_url', signer=url_signer),
        get_new_game_url = URL('get_new_game_url', signer=url_signer),
    )

@action('get_new_game_url', method="POST")
@action.uses(session, db, auth.user, url_signer.verify())
def get_new_game_url():

    #create a new game_id, generate a random number, check if it already exists, if it does then generate a new number and check again,
    # otherwise if current game id doesn't exist then create an entry in the Game table
    game_id = random.randint(0,10000)

    while check_if_game_id_exists(game_id):
        game_id = random.randint(0,10000)
    
    #at this point we have a unique game_id that currently doesn't exist, go ahead and create an entry in the Game table
    id = db.Games.insert(game_id = game_id, time_started = get_time_timestamp())

    #redirect the user to the Play url appended with the game_id as the parameter
    #redirect(URL('index'))

    
    return dict(game_id=game_id)

@action('play')
@action.uses('play.html', db, auth.user, url_signer)
def play():
    print("request params")
    print(request.params.game_id)

    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
        get_pixels_url  = URL('get_pixels', signer=url_signer),
        draw_url        = URL('draw_url', signer=url_signer),
    )

@action('browser')
@action.uses('browser.html', db, auth)
def browser():
    return dict()

@action('leaderboard')
@action.uses('leaderboard.html', db, auth)
def leaderboard():
    return dict()

@action('stats')
@action.uses('stats.html', db, auth.user)
def stats():
    user = get_user_id() # get user id
    check_if_stats_exist(user) # if they don't have a place give them one 
    user_email = get_user_email()

    stats = db(db.Ply_Stats.user == user).select() #guaranteed to have a user now 
    ply = stats[0]
    ply["email"] = user_email

    print(ply)
    return dict(ply=ply)

@action('draw_url', method="POST")
@action.uses(session, db, auth.user, url_signer.verify())
def draw_url():
    user = get_user_id()
    
    click_time = int(request.params.get('click_time')) # not init so get this info here 
    x = int(request.params.get('y'))
    y = int(request.params.get('x'))
    color = request.params.get('color')
    game_id = request.params.get('game_id')

    check_if_stats_exist(user,click_time) # this will place the user in the stats table with the given click time
    
    print(f'Place pixel at {x},{y}, color {color}, game_id {game_id}')
    db((db.Board.pos_x==x) & (db.Board.pos_y==y)).delete()
    id = db.Board.insert(uid = user, pos_x = x, pos_y = y, color = color, game_id = game_id)
    db(db.Ply_Stats.user==user).update(total_clicks=db.Ply_Stats.total_clicks+1,last_click=click_time) #update clicks
    
    pixels = db(db.Board.color != None).select()
    return dict(pixels=pixels)

@action('get_pixels')
@action.uses(db, auth.user, url_signer.verify())
def get_pixesl():
    # TODO change this to the size of the board
    pixels = [[None for i in range(100)] for j in range(100)]
    # fill in the pixels
    for pixel in db(db.Board.game_id == request.params.get('game_id')).select():
        pixels[pixel.pos_x][pixel.pos_y] = pixel.color
        
    return dict(
        pixels = pixels,
    )





# SQL function to check if a player exists in stats table, if not update it 
# use a userid and an optional time for last click 
def check_if_stats_exist(uid:int, last_click:int = 0):
    res = db(db.Ply_Stats.user==uid).select()
    if len(res) == 0:
        db.Ply_Stats.insert(user=uid, last_click=last_click)
    
    return


def check_if_game_id_exists(game_id:int):
    res = db(db.Games.game_id==game_id).select()
    if len(res) == 0:
        return False
    else:    
        return True

    