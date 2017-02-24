# coding: utf8

import gluon.contrib.simplejson

def index():
    return dict(message="hello from angular")

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

    