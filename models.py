"""
This file defines the database models
"""



import datetime
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()

def get_time_timestamp():
    return get_time().timestamp()

### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

db.define_table('Board',
                Field('pos_x','integer',required=True, unique=True),
                Field('pos_y', 'integer', required=True,unique=True),
                Field('color', 'string', required=True, requires=IS_IN_SET(["black","yellow","blue","green","red"]))
                )

db.commit()

db.define_table('UClick',
                Field('uid', 'references auth_user', required=True),
                Field('last_click', 'integer', default=get_time_timestamp())
                )

db.commit()
