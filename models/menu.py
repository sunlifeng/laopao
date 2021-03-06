# -*- coding: utf-8 -*-
# this file is released under public domain and you can use without limitations

#########################################################################
## Customize your APP title, subtitle and menus here
#########################################################################

response.logo = A(B(COMPANY_NAME),XML('&trade;&nbsp;'),
                  _class="brand",_href="http://www.laopaobar.com/")
response.title = '老炮吧'
response.subtitle = '老炮吧'

## read more at http://dev.w3.org/html5/markup/meta.name.html
response.meta.author = '老炮吧<you@laopaobar.com>'
response.meta.description = 'laopao bar'
response.meta.keywords = 'laopao, bar, drink'
response.meta.generator = 'laopao bar company'

## your http://google.com/analytics id
response.google_analytics_id = None

def make_tree():
    categories = db().select(db.product.category,distinct=True)
    tree = {'':[]}
    for c in categories:
        keys = c.category.split('/')
        last = tree['']
        for i in range(0,len(keys)):
            key = '/'.join(keys[:i])
            last = tree[key]
            newkey = '/'.join(keys[:i+1])
            if not newkey in tree:
                tree[newkey] = subtree = []
                last.append((keys[i].replace('-',' ').title(),False,URL('default','showroom',args=keys[:i+1]),subtree))
    return tree['']


#    /* def sidebar_menu_item(label, url=None, icon='link'):
#     '''
#     <li><a href="{{=URL('default','about')}}"><i class="fa fa-book"></i> <span>About</span></a></li>
#     <a href="#"><i class="fa fa-gears"></i> <span>Admin</span> <i class="fa fa-angle-left pull-right"></i></a>
#     '''
    
#     if url:
#         active = 'active' if url == URL() else None
#         return LI(
#             A(
#                 (I(' ', _class='fa fa-%s' % icon), SPAN(T(label))),
#                 _href=url
#             ),
#             _class=active
#         )
#     else:
#         return A(
#             (
#                 I(' ', _class='fa fa-%s' % icon),
#                 SPAN(T(label)),
#                 I(' ', _class='fa fa-angle-left pull-right'),
#             ),
#             _href="#"
#         )

# */
def make_menu():
    categories = db().select(db.product.category,distinct=True)
    tree = {'':[]}
    for c in categories:
        keys = c.category.split('/')
        last = tree['']
        for i in range(0,len(keys)):
            key = '/'.join(keys[:i])
            last = tree[key]
            newkey = '/'.join(keys[:i+1])
            if not newkey in tree:
                tree[newkey] = subtree = []
                last.append((keys[i].replace('-',' ').title(),False,URL('default','showroom',args=keys[:i+1]),subtree))
    return tree['']
    


response.menu = cache.ram('categories',lambda:make_menu(),0 if auth.user and auth.user.is_manager else None)

response.recip= cache.ram('categories',lambda:make_tree(),0 if auth.user and auth.user.is_manager else None)
