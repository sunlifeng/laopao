# coding: utf8

import gluon.contrib.simplejson

def index():
    table_id=request.vars.table_id
    return dict(table_id=table_id,message="hello from angular")

def takeOrder():
    new_recipe = gluon.contrib.simplejson.loads(request.body.read())
    return new_recipe

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

    