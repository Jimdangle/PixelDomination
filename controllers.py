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
from py4web.utils.form import Form, FormStyleBulma
from py4web.utils.grid import Grid, GridClassStyleBulma
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_time_timestamp, get_user_id, get_players_game
import random
from datetime import datetime, timedelta

from time import gmtime, strftime

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth.user, url_signer)
def index():
    print(get_time_timestamp())

    check_if_stats_exist(get_user_id())
    
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url  = URL('my_callback', signer=url_signer),
        get_pixels_url   = URL('get_pixels', signer=url_signer),
        draw_url         = URL('draw_url', signer=url_signer),
        get_new_game_url = URL('get_new_game_url', signer=url_signer),
        game_grid_url = URL('game_grid_url', signer=url_signer),
    )


@action('create_game', method=["GET", "POST"])
@action.uses('create_game.html', db, session, auth.user)
def add():
    form = Form(db.Games,
                csrf_session=session, formstyle=FormStyleBulma)
    if form.accepted:
        redirect(URL('browser'))
    return dict(form=form)


@action('play/<gid:int>')
@action.uses('play.html', db, auth.user, url_signer)
def play(gid=None):
    print(gid)
    user = get_user_id()
    db(db.Ply_Stats.user==user).update(last_game_id=gid)
    print(f'{user}  playing game {gid}')

    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
        get_pixels_url  = URL('get_pixels', signer=url_signer),
        draw_url        = URL('draw_url', signer=url_signer),
        game_id=gid,
        get_chat_messages_url = URL('get_chat', signer=url_signer),
        send_chat_message_url = URL('post_chat', signer=url_signer),
        game_grid_url = URL('game_grid_url', signer=url_signer),
    )



class GridPlayButton(object):
    """This is the edit button for the grid."""
    def __init__(self):
        self.url = URL('play')
        self.append_id = True # append the ID to the edit.
        self.additional_classes = 'button is-success'
        self.icon = 'fa-play'
        self.text = 'Play'
        self.message = 'Join game'
        self.onclick = None # Used for things like confirmation.


@action('browser', method=['POST', 'GET'])
@action.uses('browser.html', db, auth.user)
def browser():
    return dict(get_games_url="get_games")

@action('get_games', method=['GET'])
@action.uses(db, auth.user)
def get_games():
    print("attempt")
    try:
        search = request.params.query
    except:
        search = None

    if search is None:
        search = ""
    

    if search.find("_") > -1:
        search= search.replace("_", "$_")
    #print(f'searching {search_q}')
    games = db.executesql(f'SELECT id, name, x_size, y_size, move_interval, time_started, live_time FROM Games WHERE name LIKE "%{search}%" ESCAPE "$";', as_dict=True)
    


    #games = db(db.Games.id != None).select().as_list()
    # Iterate over them to fancy-ify them
    output_list = []
    for game in games:
        # Calculate when the game will end (ttl is end time)
        time = datetime.fromtimestamp(game['time_started'])
        ttl = time + timedelta(hours=game['live_time'])
        time_left = ttl - datetime.utcnow()
        # Create entry for the results list
        temp = {
            'name': game['name'],
            'size': str(game['x_size']) + " by " + str(game['y_size']),
            'move_interval': str(game['move_interval']) + "s",
            'ttl': str(time_left).split('.')[0],
            'id': game['id'],
        }
        # Add the current entry to results list
        output_list.append(temp)
    return dict(results=output_list[:20])

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
    click_time = get_time_timestamp() # not init so get this info here 
    x = int(request.params.get('y'))
    y = int(request.params.get('x'))
    color = request.params.get('color')
    game_id = get_players_game()
    print(game_id)
    

    pixels = db(db.Board.game_id == game_id).select()

    can_draw = check_can_place(user,game_id,click_time)

    if can_draw:
        #can move, then insert the pixel
        check_if_stats_exist(user,click_time) # this will place the user in the stats table with the given click time
    
        print(f'Place pixel at {x},{y}, color {color}, game_id {game_id}')
    
        db((db.Board.pos_x==x) & (db.Board.pos_y==y)).delete()
        id = db.Board.insert(uid = user, pos_x = x, pos_y = y, color = color, game_id = game_id)
        print(id)
        db(db.Ply_Stats.user==user).update(total_clicks=db.Ply_Stats.total_clicks+1,last_click=click_time,last_game_id=game_id) #update clicks
    
    print(pixels)
    return dict(pixels=pixels, can_move=can_draw)

@action('game_grid_url', method="GET")
@action.uses(session, db, auth.user, url_signer.verify())
def game_grid_url():
   game_id = int(request.params.get('game_id'))
   game_id_db = db(db.Games.id == game_id).select(db.Games.x_size, db.Games.y_size)
   game_x = game_id_db[0].__getitem__('x_size')
   game_y = game_id_db[0].__getitem__('y_size')
   return dict(game_id=game_id, grid_x=game_x, grid_y=game_y)




@action('get_pixels')
@action.uses(db, auth.user, url_signer.verify())
def get_pixesl():
    game = get_players_game()

    game_info = db(db.Games.id==game).select()
    print(game_info)
    try:
        game_info = game_info[0]
    except:
        return
    
    print(game)

    game_data = db(db.Board.game_id==game).select().as_list()
    board = {f"{item['pos_x']},{item['pos_y']}": item['color'] for item in game_data}
    return dict(pixels = board)





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

# Check if a player can place
# using the user id as player
# game id as game
# see if a player can place a new tile in that game
# return true if they can
# return false otherwise
def check_can_place(player:int, game:int, click_time:int):
    print(f'{player}, {game}, {click_time}')
    cooldown_q = db(db.Games.id == game).select()
    try:
        cooldown   = cooldown_q[0]['move_interval']
    except:
        cooldown = 0
        print('couldnt find interval')
    
    last_click_q = db(db.Ply_Stats.user == player).select()
    try:
        print(last_click_q)
        last_click = last_click_q[0]['last_click']
        #print(f'last click time: {datetime.datetime.fromtimestamp(last_click)}')
    except:
        last_click = 0
        print('couldnt find last click')

    #print(f'current time : {datetime.datetime.fromtimestamp(click_time)}')
    time_in_sec = (click_time - last_click)

    print(f'Time since: {time_in_sec}, Time needed {cooldown}')
    
    if time_in_sec > cooldown:
        return True
    
    return False


@action('get_chat')
@action.uses(db, auth.user, url_signer.verify())
def get_chat():
    # game_id = request.params.get('game_id')
    game_id = get_players_game()

    chat = db(db.Chat.gid == game_id).select().as_list()
    # Limit to 20 messages
    chat = chat[-20:]

    for message in chat:
        user = db(db.auth_user.id == message['user']).select().first()
        message['user'] = user['first_name'] + " " + user['last_name']

    return dict(chat=chat)

@action('post_chat', method="POST")
@action.uses(session, db, auth.user, url_signer.verify())
def post_chat():
    # game_id = request.params.get('game_id')
    game_id = get_players_game()
    user = get_user_id()
    message = request.params.get('message')

    print(game_id)

    db.Chat.insert(gid=game_id, user=user, message=message)
    return dict()