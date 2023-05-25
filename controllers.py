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
from .models import get_user_email, get_time_timestamp

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth.user, url_signer)
def index():
    print(get_time_timestamp())
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
        get_pixels_url = URL('get_pixels', signer=url_signer),
        add_pixel_url = URL('add_pixel', signer=url_signer)
    )

@action('add_pixel', method=["POST"])
@action.uses(db, auth.user, url_signer.verify())
def add_pixels():
    pos_x = int(request.params.get('pos_x'))
    pos_y = int(request.params.get('pos_y'))
    color = request.params.get('color')

    db((db.Board.pos_x == pos_x) & (db.Board.pos_y == pos_y)).delete()
    db.Board.insert(pos_x=pos_x, pos_y=pos_y, color=color)

    return "ok"

@action('get_pixels', method=["GET"])
@action.uses('index.html', db, auth.user, url_signer.verify())
def get_pixesl():
    pixels = db(db.Board.pos_x != None).select()

    return dict(
        pixels = pixels
    )

