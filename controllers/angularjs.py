# coding: utf8

import gluon.contrib.simplejson

from weixin.client import WeixinAPI
from weixin.client import WeixinMpAPI
from weixin.oauth2 import OAuth2AuthExchangeError

from weixin.client import WeixinAPI
from weixin.oauth2 import OAuth2AuthExchangeError



APP_ID = 'test'
APP_SECRET = 'test'
REDIRECT_URI = 'http://localhost.com/authorization'


def index(): 
    table_id=request.vars.table_id
    return dict(table_id=table_id,message="hello from angular")


def authorization():
    code = request.vars.code
    api = WeixinAPI(appid=APP_ID,
                    app_secret=APP_SECRET,
                    redirect_uri=REDIRECT_URI)
    auth_info = api.exchange_code_for_access_token(code=code)
    api = WeixinAPI(access_token=auth_info['access_token'])
    resp = api.user(openid=auth_info['openid'])
    return locals()


def weixinlogin():
    api = WeixinAPI(appid=APP_ID,
                    app_secret=APP_SECRET,
                    redirect_uri=REDIRECT_URI)
    authorize_url = api.get_authorize_url(scope=("snsapi_base",))
    #redirect_uri = api.get_authorize_login_url(scope=("snsapi_login",))
    return redirect(authorize_url)


def pay():

    return dict()

    
def takeOrder():
    ds_cart = gluon.contrib.simplejson.loads(request.body.read())
    status=dict()
    lista=list()
    status["result"]=1
    status["return"]=gluon.contrib.simplejson.dumps(ds_cart)

    return gluon.contrib.simplejson.dumps(status)

def openuser():
    return dict()

def historyorder():
    return dict()

def menu():
    rows = db(db.product).select().as_list()
    #return dict(product_list=gluon.contrib.simplejson.dumps(rows))
    return to_json(rows)

def cat():
    categories = db().select(db.product.category,distinct=True)
    #return to_json(categories)
    return dict(cat=categories)

def to_json(rows):
    lista = list()
    status=dict()
    status["status"]="success"
    status["is_modify"]=1
    status["version"]="0"
    #lista.append(status)
    for row in rows:
        arr = dict()
        for k,v in row.items():
            arr[k] = v
        lista.append(arr)
    status["data"]=gluon.contrib.simplejson.dumps(lista)
    return dict(row_list=gluon.contrib.simplejson.dumps(status))

    