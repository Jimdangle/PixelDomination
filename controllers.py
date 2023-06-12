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

from py4web import action, request, abort, redirect, URL, Field
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.form import Form, FormStyleBulma
from py4web.utils.grid import Grid, GridClassStyleBulma
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_time_timestamp, get_user_id, get_players_game, get_game_name, get_player_pixels, get_username, ttl, check_expired_games

import random
from datetime import datetime, timedelta

from time import gmtime, strftime

url_signer = URLSigner(session)


#Main landing page
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
        count_score_url  = URL('count_score', signer=url_signer),
    )


# ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄       ▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ 
#▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░▌     ▐░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
#▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░▌░▌   ▐░▐░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀▀▀ 
#▐░▌          ▐░▌       ▐░▌▐░▌▐░▌ ▐░▌▐░▌▐░▌          ▐░▌          
#▐░▌ ▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░▌ ▐░▐░▌ ▐░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ 
#▐░▌▐░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌  ▐░▌  ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
#▐░▌ ▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌   ▀   ▐░▌▐░█▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀█░▌
#▐░▌       ▐░▌▐░▌       ▐░▌▐░▌       ▐░▌▐░▌                    ▐░▌
#▐░█▄▄▄▄▄▄▄█░▌▐░▌       ▐░▌▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄█░▌
#▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
# ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀  ▀         ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀ 
                                                                 
# Create a new game to play
@action('create_game', method=["GET", "POST"])
@action.uses('create_game.html', db, session, auth.user)
def create_game():
    # Serve the form from the games db
    form = Form(db.Games, csrf_session=session, formstyle=FormStyleBulma)
    if form.accepted:
        # Insert the entry into the database
        # Redirect to browser page
        redirect(URL('browser'))
    return dict(form=form)


# Join a game to play
@action('play/<gid:int>')
@action.uses('play.html', db, auth.user, url_signer)
def play(gid=None):
    print(gid)
    user = get_user_id()
    check_if_stats_exist(user)
    db(db.Ply_Stats.user==user).update(last_game_id=gid)
    print(f'{user}  playing game {gid}')

    game_info = db(db.Games.id==gid).select()

    try:
        game = game_info[0]
        time = ttl(game['time_started'], game['live_time'])
        game_data = {'name': game['name'], 'ttl': str(time).split('.')[0] }
    
    except:
        game_data = {'name': 'None', 'ttl': 'None'}


    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
        get_pixels_url  = URL('get_pixels', signer=url_signer),
        draw_url        = URL('draw_url', signer=url_signer),
        game_id=gid,
        game_data=game_data,
        get_chat_messages_url = URL('get_chat', signer=url_signer),
        send_chat_message_url = URL('post_chat', signer=url_signer),
        game_grid_url = URL('game_grid_url', signer=url_signer),
        count_score_url  = URL('count_score', signer=url_signer),
    )


# Server browser route
@action('browser', method=['POST', 'GET'])
@action.uses('browser.html', db, auth.user)
def browser():
    return dict(get_games_url="get_games")



# Get a list of all games a player can play
# this function is really long bc it has to handle a lot
# it queries, and also formats the response
@action('get_games', method=['GET'])
@action.uses(db, auth.user)
def get_games():
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
        time_left = ttl(game["time_started"], game['live_time'])
        # Create entry for the results list
        temp = {
            'name': game['name'],
            'size': str(game['x_size']) + " by " + str(game['y_size']), # 'X by Y' for board dimensions
            'move_interval': str(game['move_interval']) + "s", # String of how many seconds the move interval is
            'ttl': str(time_left).split('.')[0], # String for time left string
            'end_time': (datetime.fromtimestamp(game["time_started"]) + timedelta(hours=game['live_time'])).isoformat(), # Time the game will end
            'id': game['id'],
        }
        # Skip this game if the game has expired
        if (datetime.fromtimestamp(game["time_started"]) + timedelta(hours=game['live_time']) < datetime.utcnow()): continue
        # Add the current entry to results list
        output_list.append(temp)
    return dict(results=output_list[:20])


# ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ 
#▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
#▐░█▀▀▀▀▀▀▀▀▀  ▀▀▀▀█░█▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌ ▀▀▀▀█░█▀▀▀▀ ▐░█▀▀▀▀▀▀▀▀▀ 
#▐░▌               ▐░▌     ▐░▌       ▐░▌     ▐░▌     ▐░▌          
#▐░█▄▄▄▄▄▄▄▄▄      ▐░▌     ▐░█▄▄▄▄▄▄▄█░▌     ▐░▌     ▐░█▄▄▄▄▄▄▄▄▄ 
#▐░░░░░░░░░░░▌     ▐░▌     ▐░░░░░░░░░░░▌     ▐░▌     ▐░░░░░░░░░░░▌
# ▀▀▀▀▀▀▀▀▀█░▌     ▐░▌     ▐░█▀▀▀▀▀▀▀█░▌     ▐░▌      ▀▀▀▀▀▀▀▀▀█░▌
#          ▐░▌     ▐░▌     ▐░▌       ▐░▌     ▐░▌               ▐░▌
# ▄▄▄▄▄▄▄▄▄█░▌     ▐░▌     ▐░▌       ▐░▌     ▐░▌      ▄▄▄▄▄▄▄▄▄█░▌
#▐░░░░░░░░░░░▌     ▐░▌     ▐░▌       ▐░▌     ▐░▌     ▐░░░░░░░░░░░▌
# ▀▀▀▀▀▀▀▀▀▀▀       ▀       ▀         ▀       ▀       ▀▀▀▀▀▀▀▀▀▀▀ 
                                                                                       
#View game history here
# Maybe either all games that have ever been played
# or just games a player has played and their score once the games have completed
@action('leaderboard')
@action.uses('leaderboard.html', db, auth)
def leaderboard():
    rows = check_expired_games()
    print(rows)
    return dict(rows=rows)

# View stats for the signed in player 
@action('stats')
@action.uses('stats.html', db, auth.user)
def stats():
    user = get_user_id() # get user id
    check_if_stats_exist(user) # if they don't have a place give them one 
    user_email = get_user_email()
    game = get_players_game()
    pixels = get_player_pixels()

    stats = db(db.Ply_Stats.user == user).select() #guaranteed to have a user now 
    ply = stats[0]
    ply["email"] = user_email #add this field so that we can render a nice name instead of an id
    ply['game_name'] = get_game_name(game) # get the name of the game so we dont show the id 
    ply['username'] = get_username()
    lc_fmt = datetime.fromtimestamp(ply['last_click']) # format the time
    lc_fmt = lc_fmt.strftime('%m/%d %H:%M:%S')
    ply['last_click'] = lc_fmt
    ply['pixels'] = pixels['total']
    ply['red'] = pixels['red']
    ply['green'] = pixels['green']
    ply['black'] = pixels['black']
    ply['yellow'] = pixels['yellow']
    ply['blue'] = pixels['blue']

    print(ply)
    return dict(ply=ply)

#Count the score for a given game
@action('count_score')
@action.uses(db, auth.user, url_signer.verify())
def count_score():
    game = get_players_game() #gets the current user's last played game id
    #Count number of pixels of each color in that game id 
    black = db((db.Board.game_id == game) & (db.Board.color == 'black')).count()
    red = db((db.Board.game_id == game) & (db.Board.color == 'red')).count()
    green = db((db.Board.game_id == game) & (db.Board.color == 'green')).count()
    blue = db((db.Board.game_id == game) & (db.Board.color == 'blue')).count()
    yellow = db((db.Board.game_id == game) & (db.Board.color == 'yellow')).count()
    
    return dict(black=black, red=red, green=green, blue=blue, yellow=yellow)


# ▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄         ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄  ▄▄▄▄▄▄▄▄▄▄▄ 
#▐░░░░░░░░░░▌ ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░▌      ▐░▌▐░░░░░░░░░░░▌
#▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌       ▐░▌ ▀▀▀▀█░█▀▀▀▀ ▐░▌░▌     ▐░▌▐░█▀▀▀▀▀▀▀▀▀ 
#▐░▌       ▐░▌▐░▌       ▐░▌▐░▌       ▐░▌▐░▌       ▐░▌     ▐░▌     ▐░▌▐░▌    ▐░▌▐░▌          
#▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌   ▄   ▐░▌     ▐░▌     ▐░▌ ▐░▌   ▐░▌▐░▌ ▄▄▄▄▄▄▄▄ 
#▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌  ▐░▌  ▐░▌     ▐░▌     ▐░▌  ▐░▌  ▐░▌▐░▌▐░░░░░░░░▌
#▐░▌       ▐░▌▐░█▀▀▀▀█░█▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░▌ ▐░▌░▌ ▐░▌     ▐░▌     ▐░▌   ▐░▌ ▐░▌▐░▌ ▀▀▀▀▀▀█░▌
#▐░▌       ▐░▌▐░▌     ▐░▌  ▐░▌       ▐░▌▐░▌▐░▌ ▐░▌▐░▌     ▐░▌     ▐░▌    ▐░▌▐░▌▐░▌       ▐░▌
#▐░█▄▄▄▄▄▄▄█░▌▐░▌      ▐░▌ ▐░▌       ▐░▌▐░▌░▌   ▐░▐░▌ ▄▄▄▄█░█▄▄▄▄ ▐░▌     ▐░▐░▌▐░█▄▄▄▄▄▄▄█░▌
#▐░░░░░░░░░░▌ ▐░▌       ▐░▌▐░▌       ▐░▌▐░░▌     ▐░░▌▐░░░░░░░░░░░▌▐░▌      ▐░░▌▐░░░░░░░░░░░▌
# ▀▀▀▀▀▀▀▀▀▀   ▀         ▀  ▀         ▀  ▀▀       ▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀        ▀▀  ▀▀▀▀▀▀▀▀▀▀▀ 
                                                                                           
# draw a box in a game for the current player
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

    can_draw = check_update_gclicks(game_id,user,click_time)

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

#get the game size for the given game
@action('game_grid_url', method="GET")
@action.uses(session, db, auth.user, url_signer.verify())
def game_grid_url():
   game_id = int(request.params.get('game_id'))
   game_id_db = db(db.Games.id == game_id).select(db.Games.x_size, db.Games.y_size)
   game_x = game_id_db[0].__getitem__('x_size')
   game_y = game_id_db[0].__getitem__('y_size')
   # Let's fetch game info, so that we can pass it to the front end
   game_info = db(db.Games.id == game_id).select().first()
   # Calculate the end time, which will we use in the front end to decrement the timer
   game_info['end_time'] = (datetime.fromtimestamp(game_info["time_started"]) + timedelta(hours=game_info['live_time'])).isoformat()
   return dict(game_id=game_id, grid_x=game_x, grid_y=game_y,game_info=game_info)


# Get the pixels for a given game 
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


# ▄▄▄▄▄▄▄▄▄▄▄  ▄         ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ 
#▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
#▐░█▀▀▀▀▀▀▀▀▀ ▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀█░▌ ▀▀▀▀█░█▀▀▀▀ 
#▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌     ▐░▌     
#▐░▌          ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌     ▐░▌     
#▐░▌          ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌     ▐░▌     
#▐░▌          ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌     ▐░▌     
#▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌     ▐░▌     
#▐░█▄▄▄▄▄▄▄▄▄ ▐░▌       ▐░▌▐░▌       ▐░▌     ▐░▌     
#▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░▌       ▐░▌     ▐░▌     
# ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀  ▀         ▀       ▀      
                                                    
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
        message['user'] = user['username']

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


# ▄         ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄           
#▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌          
#▐░▌       ▐░▌ ▀▀▀▀█░█▀▀▀▀  ▀▀▀▀█░█▀▀▀▀ ▐░▌          
#▐░▌       ▐░▌     ▐░▌          ▐░▌     ▐░▌          
#▐░▌       ▐░▌     ▐░▌          ▐░▌     ▐░▌          
#▐░▌       ▐░▌     ▐░▌          ▐░▌     ▐░▌          
#▐░▌       ▐░▌     ▐░▌          ▐░▌     ▐░▌          
#▐░▌       ▐░▌     ▐░▌          ▐░▌     ▐░▌          
#▐░█▄▄▄▄▄▄▄█░▌     ▐░▌      ▄▄▄▄█░█▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ 
#▐░░░░░░░░░░░▌     ▐░▌     ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
# ▀▀▀▀▀▀▀▀▀▀▀       ▀       ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀ 
                                                    


# SQL function to check if a player exists in stats table, if not update it 
# use a userid and an optional time for last click 
def check_if_stats_exist(uid:int, last_click:int = 0):
    res = db(db.Ply_Stats.user==uid).select()
    if len(res) == 0:
        db.Ply_Stats.insert(user=uid, last_click=last_click)
    
    return


# check and update gclicks 
# take in a click time
# check the current users current game 
# see if a row in the GClick table exists for the game and player
# if it doesn't exist: insert a new row containing gameid,playerid,last_click and return TRUE
# if it does exist:
#   check if (current click time - last click time ) > game move interval
#     if true we update the Gclick table to contain the new time and return TRUE
#
# return FALSE
def check_update_gclicks(cur_game:int, cur_user:int,click_time:int):

    #check if row exists in gclicks table already
    query = (db.GClick.gid==cur_game) & (db.GClick.user==cur_user)
    gclicks = db(query).select()


    if len(gclicks) <= 0: #nothing present
        db.GClick.insert(gid=cur_game,user=cur_user,click_time=click_time)
        return True # this user has not clicked in this game so they can click
    else: # row found with gid and user id
        game_info = db(db.Games.id==cur_game).select()
        game = game_info[0]

        last_click = gclicks[0]['click_time'] # last click of this player
        interval = game['move_interval']

        if (click_time-last_click) > interval: # player can click in this game
            db(query).update(click_time=click_time) #update the row in the table
            return True
    
    return False #Player has a row that they have not waited for 
