//声明全局变量
var ds_data;//菜单数据
var ds_cart;//购物车数据
var db=window.localStorage;
var transFn = function(data) {
    var str = [];
    for(var p in data) {
        str.push(encodeURIComponent(p)+"="+encodeURIComponent(data[p]));
    }
    return str.join("&");
};
var postCfg={
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
    transformRequest: transFn
};

//配置AJAXURL
var url_get_db='data/db.json';//获取载入数据
var url_push_opt="data/success.json";//推送操作数据
var url_push_remove="data/success.json";//推送移除操作数据
var url_submit="data/submit.json";//提交购物车数据
var url_order_pay="wechat/pay_order.do";//支付url
var is_single=0;
var is_waiter=false;
var hide_cart = 1;
var cart_source = false;
var is_search_menu = false;
var auto_meal_fee = 0;


//var dianshi=angular.module('laopao',['ngTouch']);
var dianshi=angular.module('laopao',[]);

dianshi.config(function($interpolateProvider) {
    //allow Web2py views and Angular to co-exist
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});

var dsfunc={};
dianshi.value('dsfunc', dsfunc);
dianshi.controller('pao',function($scope,$http,dsfunc,$timeout){
    //初始化全局变量
    $scope.glb_count=0;//个人点餐数量
    $scope.glb_count_total=0;//本桌点餐数
    $scope.glb_price_total=0;//本座点餐金额
    $scope.glb_price_fixed="";
    $scope.glb_user=0;//当前用户id
    $scope.glb_loading=1;//是否载入完成
    $scope.glb_adver=1;//是否显示广告
    $scope.glb_show_cat=1;//是否显示左侧分类
    $scope.glb_is_weight=1;//是否可以点称重菜品
    $scope.glb_submit_status=1;//去买单按钮状态
    $scope.glb_is_search = false;//是否显示搜索框
    $scope.glb_str_search = "";//菜品检索字符串
    $scope.glb_table_id=table_id;//卓號
    //初始化panel的显示状态
    $scope.ishide_muti = 1;// ***muti***
    $scope.ishide_cart=hide_cart;
    $scope.ishide_detail=1;
    $scope.ishide_msg=1;
    $scope.ishide_weight=1;
    // 新加入的多重属性 ***muti***
    $scope.panel_muti_id = 0;
    $scope.panel_muti_show = {
        large:false,
        muti:false,
        attr:false,
        mutiMinus:false,
        more:false
    }
    $scope.panel_mutiMinus_list = [];
    $scope.panel_mutiMinus_para = {};
    $scope.panel_muti_list = [];
    $scope.panel_muti_sremark_more = '';
    $scope.panel_muti_attr = [];
    $scope.panel_muti_attr_opt='add';
    $scope.panel_muti_count = 1;
    $scope.panel_muti_count_old = 0;
    $scope.panel_muti_count_case = [1,5,10,50];

    //初始化panel当前状态与数据
    $scope.panel_weight_menu_id=0;
    $scope.panel_weight_val=0;
    $scope.panel_detail_data={};
    $scope.boxmsg_text='';
    $scope.boxmsg_name='';
    //初始化展示数据
    $scope.menu_list=[];
    $scope.tag_list=[];
    $scope.cat_list=[];
    $scope.cart_list=[];
    
    $timeout(function(){
        $scope.glb_adver=0;
    },3000);

    $scope.init_cart=function(){//初始化计算购物车各种数据,可以三合一优化
        var count=0;
        var price=0;
        for(i in ds_cart){
            count+=ds_cart[i].amount;
            var item_menu=json_search($scope.menu_list,'id',ds_cart[i].productId);
            var item_price=item_menu.price;
            if (item_menu.attr.length!=0){
                var item_attr=json_search(item_menu.attr,"id",ds_cart[i].propertyId);
                item_price=item_attr.price;
            };
            price+=parseInt(ds_cart[i].amount)*parseFloat(item_price);
        }
        $scope.glb_count_total=count;
        $scope.glb_price_total=price*0.01;

        for(i in $scope.cat_list){
            var count_cat=0;
            for(n in ds_cart){
                if (ds_cart[n].cat==$scope.cat_list[i].id && ds_cart[n].userId==ds_data.user){
                    count_cat=ds_cart[n].amount*1+count_cat*1;
                };
            }
            $scope.cat_list[i]._count=count_cat;
        }

        for(i in $scope.menu_list){
            var item_menu=$scope.menu_list[i];
            var count_menu=0;
            for(n in ds_cart){
                if (ds_cart[n].userId==ds_data.user && ds_cart[n].productId==item_menu.id){
//                  if(item_menu.attr.length==0){
//                      count_menu=ds_cart[n].amount;
//                  }else{
                        count_menu=ds_cart[n].amount*1+count_menu;
                        for(m in $scope.menu_list[i].attr){
                            if($scope.menu_list[i].attr[m].id==ds_cart[n].propertyId){
                                $scope.menu_list[i].attr[m]._countNum=ds_cart[n].amount;
                                break;
                            }
                        }
//                  }
                };
            }
            $scope.menu_list[i]._countNum=count_menu;
        }
    }
    $scope.deal_cart=function(){//将购物车数据处理成显示数据
        var ds_cart_deal=new Array();
        for(var i=0; i<ds_cart.length; i++){
            var item_cart={};
            var item_user={};
            var hasmenu=false;
            for(var n=0; n<ds_cart_deal.length; n++){
                if (ds_cart_deal[n].menu.id==ds_cart[i].productId && ds_cart_deal[n].attr==ds_cart[i].propertyId && ds_cart_deal[n].sremark==ds_cart[i].tasteNotes){
                    item_user.id=ds_cart[i].userId;
                    item_user.count=ds_cart[i].amount;
                    item_user.img=ds_cart[i].userImg;
                    ds_cart_deal[n].user[ds_cart_deal[n].user.length]=item_user;
                    ds_cart_deal[n]._countNum=ds_cart_deal[n]._countNum*1+ds_cart[i].amount;
                    hasmenu=true;
                };
            }
            if (!hasmenu){
                item_cart.menu=json_search($scope.menu_list,'id',ds_cart[i].productId);
                item_cart.name=item_cart.menu.name;
                item_cart.rmb=item_cart.menu.rmb;
                item_cart.attr=ds_cart[i].propertyId;
                item_cart.sremark = ds_cart[i].tasteNotes;
                if(item_cart.attr!=0){
                    for(n in item_cart.menu.attr){
                        if(item_cart.menu.attr[n].id==item_cart.attr){
                            item_cart.name=item_cart.menu.name+"("+item_cart.menu.attr[n].name+")";
                            item_cart.rmb=item_cart.menu.attr[n].rmb;
                            break;
                        }
                    };
                }
                item_user.id=ds_cart[i].userId;
                item_user.img=ds_cart[i].userImg;
                item_user.count=ds_cart[i].amount;
                item_cart.weight=ds_cart[i].weight;
                item_cart.user=new Array();
                item_cart.user[0]=item_user;
                item_cart._countNum=ds_cart[i].amount;
                ds_cart_deal[ds_cart_deal.length]=item_cart;
            };
        }
        return ds_cart_deal;
    }
    $scope.get_db=function(){//获取原数据
        var version=db.getItem('version');
        if (!version){
            version=0;
        };
        $http.post(url_get_cat,{version:version}, postCfg).success(function(obj){
            //console.log(obj);
             //$scope.cat_list=JSON.parse(obj.cat);
             $scope.cat_list=obj.cat;
             for (item in $scope.cat_list){
                $scope.cat_list[item].name=$scope.cat_list[item].category;
                $scope.cat_list[item].id=item;

             }

        });

        $http.post(url_get_menu,{version:version}, postCfg).success(function(obj){
            console.log(obj);
            if (obj.status=="success"){
                if (obj.is_modify){
                    db.setItem('version',obj.version);
                    ds_data=obj.data;
                    db.setItem('data',JSON.stringify(ds_data));
                    ds_data=JSON.parse(ds_data);
                }else{
                    ds_data=db.getItem('data');
                    ds_data=JSON.parse(ds_data);
                };
                if(is_waiter){
                    if(cart_source){
                        if(!db['cart_desk_'+deskId]){
                            db.setItem('cart_desk_'+deskId,'[]');
                        }
                        ds_cart = JSON.parse(db.getItem('cart_desk_'+deskId));
                        var hasMealFee = false;
                        for(i in ds_cart){
                            if(ds_cart[i].isMealFee == 1){
                                hasMealFee = true;
                                break;
                            }
                        }
                        if(!hasMealFee && obj.cart.length >0 && auto_meal_fee == 1){
                            for(i in obj.cart){
                                ds_cart.push(obj.cart[i]);
                            }
                        }
                    }else{
                        ds_cart=obj.cart;
                    }
                }else{
                    ds_cart=obj.cart;
                    ds_cart=[];
                }
                //赋值
                //$scope.tag_list=ds_data.type;
                //$scope.cat_list=ds_data.cat;
                //$scope.cat_list=ds_data;
                $scope.tag_list=$scope.cat_list;
                if(is_search_menu){
                    var cat_search = {
                        id:"search",
                        isShow:1,
                        name:"菜品检索"
                    };
                    $scope.cat_list.unshift(cat_search);
                    $scope.glb_is_search = true;
                }
                var default_cat_id=0;
                  console.log($scope.cat_list.length)
                for(i in $scope.cat_list){
                    
                    $scope.cat_list[i]._count=0;
                    $scope.cat_list[i]._state=0;
                    if (i==0){
                        default_cat_id=$scope.cat_list[i].id;
                        $scope.cat_list[i]._state=1;
                    };
                }
                // for(i in $scope.tag_list){
                //     $scope.tag_list[i]._state=0;
                //     if($scope.tag_list[i].tagId==0){
                //         $scope.tag_list[i]._state=1;
                //     }
                // }
                //$scope.menu_list=ds_data.menu;
                $scope.menu_list=ds_data;
                for(i in $scope.menu_list){
                    $scope.menu_list[i]._countNum=0;
                    $scope.menu_list[i]._weight=0;
                    $scope.menu_list[i]._isShow=1;
                    $scope.menu_list[i]._isSupply=1;
                    $scope.menu_list[i].unitName=$scope.menu_list[i].name;
                    $scope.menu_list[i].rmb=$scope.menu_list[i].unit_price;
                    $scope.menu_list[i].disabled=0;
                    $scope.menu_list[i].isWeigh=0;
                    $scope.menu_list[i].isSoldOut=0;
                    $scope.menu_list[i].isOnline=1;
                    $scope.menu_list[i].attr=[];

                    if($scope.menu_list.on_sale==true){
                        $scope.menu_list[i]._isShow=1;
                    }
                    if($scope.menu_list[i].isOnline==1){
                        if($scope.menu_list[i].categoryId==default_cat_id){
                            $scope.menu_list[i]._isShow=1;
                            $scope.menu_list[i]._isSupply=$scope.deal_is_supply($scope.menu_list[i]);
                        }
                    }

                    // if($scope.menu_list[i].attr.length>0){
                    //     for(n in $scope.menu_list[i].attr){
                    //         $scope.menu_list[i].attr[n]._countNum=0;
                    //     }
                    // };
                    if($scope.menu_list[i].image==''){
                        $scope.menu_list[i].image="/assets/wechat/img/noimg";//默认图片路径
                    }
                }
                $scope.cart_list=$scope.deal_cart();
                $scope.glb_user=ds_data.user;
                $scope.init_cart();
                var doc_height=window.innerHeight;
                document.getElementById('dian').style.height=(doc_height)+'px';
                document.getElementById('cat_list').style.height=(doc_height-42)+'px';
                document.getElementById('menu_list').style.height=(doc_height-42)+'px';
                $scope.glb_loading=0;   
            }else{
                alert(obj.msg);
            }
        }).error(function(){
            alert("对不起，网络错误")
        });
    }
    $scope.get_db();

    //显示隐藏panel
    $scope.hide_adver=function(){$scope.glb_adver=0;}
    $scope.show_cart=function(){
        $scope.cart_list=$scope.deal_cart();
        $scope.ishide_cart=0;
    }
    $scope.hide_cart=function(){$scope.ishide_cart=1;}
    //***muti***
    $scope.show_muti=function(){$scope.ishide_muti=0;} 
    $scope.hide_muti=function(){
        $scope.ishide_muti=1;
        $scope.panel_muti_id = 0;
        $scope.panel_muti_show = {
            large:false,
            muti:false,
            attr:false,
            mutiMinus:false,
            more:false
        }
        $scope.panel_mutiMinus_list = [];
        $scope.panel_mutiMinus_para = {};
        $scope.panel_muti_list = [];
        $scope.panel_muti_sremark_more = '';
        $scope.panel_muti_attr = [];
        $scope.panel_muti_attr_opt='add';
        $scope.panel_muti_count = 1;
        $scope.panel_muti_count_old = 0;
    } //***muti***
    $scope.switch_muti_more = function(){
        $scope.panel_muti_show.more = ($scope.panel_muti_show.more)?false:true;
    }
    $scope.show_weight=function(){$scope.ishide_weight=0;}
    $scope.hide_weight=function(){$scope.ishide_weight=1;}
    $scope.show_detail=function(menu_id){
        var item_menu=json_search($scope.menu_list,'id',menu_id);
        $scope.panel_detail_data.name=item_menu.name;
        $scope.panel_detail_data.price=item_menu.unit_price;
        $scope.panel_detail_data.count=item_menu.clicks;
        $scope.panel_detail_data.image=item_menu.image;
        $scope.panel_detail_data.tags=item_menu.tag;
        $scope.panel_detail_data.intro=item_menu.description_long;
        $scope.ishide_detail=0;
    }
    $scope.hide_detail=function(){$scope.ishide_detail=1;}
    $scope.show_msg=function(name,count){
        var text='您的小伙伴';
        if(count>0){
            text=text+"点了"+count+"份";
        }else{
            text=text+"取消了"+(count*-1)+"份";
        }
        $scope.boxmsg_text=text;
        $scope.boxmsg_name=name;
        $scope.ishide_msg=0;
        $timeout(function(){
            $scope.ishide_msg=1;
        },1500);
    }

    //设置称重重量
    $scope.weight_sure=function(){
        var weight=$scope.panel_weight_val;
        $scope.menu_set_weight($scope.panel_weight_menu_id,weight,false);
        $scope.hide_weight();
    }
    $scope.weight_cancel=function(){
        $scope.hide_weight();
    }

    // ***muti***
    $scope.mutiopt_submit = function(){

        if($scope.panel_muti_show.mutiMinus){

            $scope.panel_muti_show = {
                large:false,
                muti:false,
                attr:false,
                mutiMinus:false,
                more:false
            }
            $scope.set_cart($scope.panel_mutiMinus_para.user
                ,$scope.panel_mutiMinus_para.menu_id
                ,$scope.panel_mutiMinus_para.attr_id
                ,$scope.panel_mutiMinus_para.sremark,-1,'cart');
            $scope.hide_muti();
            return false;
        }

        var attr_id = 0;
        var count = 0;
        var sremark = '';
        var menu_id = $scope.panel_muti_id;
        
        if($scope.panel_muti_show.large){
            count = $scope.panel_muti_count-$scope.panel_muti_count_old;
        }else{
            count = ($scope.panel_muti_attr_opt=='add') ? 1 : -1;
        }
        
        if($scope.panel_muti_show.attr){
            for(i in $scope.panel_muti_attr){
                if($scope.panel_muti_attr[i]._active){
                    if($scope.panel_muti_attr[i]._countNum*1 < count*-1 && $scope.panel_muti_attr_opt=='minus'){
                        return false;
                    }
                    attr_id = $scope.panel_muti_attr[i].id;
                    break;
                }
            }
        }
        
        if($scope.panel_muti_show.muti){
            sremark = '';
            for(i in $scope.panel_muti_list){
                var isAttr = false;
                var sremarItem = '';
                for(n in $scope.panel_muti_list[i].list){
                    if($scope.panel_muti_list[i].list[n]._active){
                        sremarItem = sremarItem +  $scope.panel_muti_list[i].list[n].text;
                        sremarItem = sremarItem + ',';
                        var isAttr = true;
                    }
                }
                if(isAttr){
                    sremark = sremark + $scope.panel_muti_list[i].name;
                    sremark = sremark + ':';
                    sremark = sremark + sremarItem;
                    sremark = sremark.substring(0,sremark.length-1);
                    sremark = sremark + ';';
                }
            }
            sremark = sremark + $scope.panel_muti_sremark_more;
        }

        for(i in $scope.menu_list){
            if($scope.menu_list[i].id==menu_id){
                $scope.menu_list[i]._countNum=$scope.menu_list[i]._countNum*1+count*1;
                if($scope.menu_list[i].attr.length > 0){
                    for(n in $scope.menu_list[i].attr){
                        if($scope.menu_list[i].attr[n].id==attr_id){
                            $scope.menu_list[i].attr[n]._countNum=$scope.menu_list[i].attr[n]._countNum*1+count*1;
                        }
                    }
                }
            }
        }

        $scope.panel_muti_show = {
            large:false,
            muti:false,
            attr:false,
            mutiMinus:false,
            more:false
        }

        $scope.panel_muti_sremark_more = '';

        $scope.set_cart(ds_data.user,menu_id,attr_id,sremark,count);
        $scope.hide_muti();
    }
    $scope.mutiopt_count_empty=function(){$scope.panel_muti_count=1;}
    $scope.mutiopt_count_deal=function(count){
        $scope.panel_muti_count=$scope.panel_muti_count*1+count*1;
        if($scope.panel_muti_count<0){$scope.panel_muti_count=0;}
    }
    $scope.mutiopt_muti_minus = function(user,menu_id,attr_id,sremark){
        $scope.panel_mutiMinus_para = {
            user: user,
            menu_id: menu_id,
            attr_id: attr_id,
            sremark: sremark
        }
        for(i in $scope.panel_mutiMinus_list){
            if($scope.panel_mutiMinus_list[i].sremark == sremark && $scope.panel_mutiMinus_list[i].attr == attr_id){
                $scope.panel_mutiMinus_list[i]._active = true;
            }else{
                $scope.panel_mutiMinus_list[i]._active = false;
            }
        }
    }
    $scope.mutiopt_attr = function(id){
        for(i in $scope.panel_muti_attr){
            if($scope.panel_muti_attr[i].id == id){
                $scope.panel_muti_attr[i]._active = true;
            }else{
                $scope.panel_muti_attr[i]._active = false;
            }
        }
    }

    $scope.mutiopt_muti = function(type, list, index){
        if(type == 'check'){
            list[index]._active = (list[index]._active) ? false : true;
        }else if(type == 'radio'){
            for(i in list){
                if(i == index){
                    list[i]._active = true;
                }else{
                    list[i]._active = false;
                }
            }
        }
    }

    $scope.menu_set_muti = function(id,count){
        for(i in $scope.menu_list){
            var isShowMuti = false;
            var isShowLarge = false;
            if($scope.menu_list[i].id == id){

                // var attr_length = $scope.menu_list[i].attr.length;
                // var is_large = $scope.menu_list[i].isLarge;
                var attr_length =0;
                var is_large = 0;
                $scope.menu_list[i].tasteNotes=[];
                $scope.panel_muti_attr_opt=(count>0)?'add':'minus';

                if($scope.panel_muti_attr_opt=='minus'){
                    if($scope.menu_list[i].tasteNotes.length > 0 || attr_length > 0){
                        $scope.panel_mutiMinus_list = [];
                        for(n in $scope.cart_list){
                            if($scope.cart_list[n].menu.id == id){
                                var mutiMinusItem = $scope.cart_list[n];
                                mutiMinusItem._active = false;
                                $scope.panel_mutiMinus_list.push(mutiMinusItem);
                            }
                        }
                        $scope.panel_mutiMinus_list[0]._active = true;
                        $scope.panel_mutiMinus_para = {
                            user: $scope.glb_user,
                            menu_id: $scope.panel_mutiMinus_list[0].menu.id,
                            attr_id: $scope.panel_mutiMinus_list[0].attr,
                            sremark: $scope.panel_mutiMinus_list[0].sremark
                        }
                        if($scope.panel_mutiMinus_list.length == 1){
                            $scope.set_cart($scope.panel_mutiMinus_para.user
                                ,$scope.panel_mutiMinus_para.menu_id
                                ,$scope.panel_mutiMinus_para.attr_id
                                ,$scope.panel_mutiMinus_para.sremark,-1,'cart');
                            return false;
                        }
                        $scope.panel_muti_show.large = false;
                        $scope.panel_muti_show.muti = false;
                        $scope.panel_muti_show.attr = false;
                        $scope.panel_muti_show.mutiMinus = true;
                        isShowMuti = true;
                        isShowLarge = false;
                    }else{
                        
                    }
                    $scope.panel_muti_show.more = false 
                }else{
                    if($scope.menu_list[i].tasteNotes.length > 0){
                        var mutiList = [];
                        var str_sremark = $scope.menu_list[i].tasteNotes;
                        var sign_item=";";
                        var sign_type="@";
                        var sign_name=":";
                        var sign_it=",";
                        var item = str_sremark.split(sign_item);
                        for(n in item){
                            if(item[n].length == 0){
                                break;
                            }
                            var itemInfo = item[n].split(sign_name);
                            var itemInfo2 = itemInfo[0].split(sign_type);
                            var itemType = itemInfo2[0];
                            var itemName = itemInfo2[1];
                            var itemList = itemInfo[1].split(sign_it);
                            var itemList2 = [];
                            for(m in itemList){
                                if(itemList[m].length == 0){
                                    break;
                                }
                                var itemListIt = {
                                    text:itemList[m],
                                    _active:false
                                }
                                if(itemType == 'radio' && m == 0){
                                    itemListIt._active = true;
                                }
                                itemList2.push(itemListIt);
                            }
                            
                            var itemObj = {
                                type : itemType,
                                name : itemName,
                                list : itemList2
                            }
                            mutiList.push(itemObj);
                        }
                        $scope.panel_muti_list = mutiList;
                        $scope.panel_muti_show.muti = true;
                        if($scope.panel_muti_attr_opt=='minus'){
                            $scope.panel_muti_show.muti = false;
                        }
                        isShowMuti = true;
                        isShowLarge = true;
                    }

                    if(attr_length > 0){
                        $scope.panel_muti_attr = $scope.menu_list[i].attr;
                        for(n in $scope.panel_muti_attr){
                            $scope.panel_muti_attr[n]._active = (n == 0) ? true : false;
                        }
                        $scope.panel_muti_show.attr = true;
                        isShowMuti = true;
                    }
                    
                    if(is_large){
                        isShowMuti = true;
                        isShowLarge = true;
                    }
                }

                if(isShowMuti){
                    if(isShowLarge){
                        if(is_large){
                            var large_case=$scope.menu_list[i].largeCase;
                            large_case=large_case.split(',');
                        }else{
                            large_case = [1];
                        }
                        $scope.panel_muti_count_case=large_case;
                        $scope.panel_muti_count = $scope.panel_muti_count_case[0];
                        $scope.panel_muti_count_old = 0;
                        $scope.panel_muti_show.large = true;
                    }

                    $scope.panel_muti_id = id;
                    $scope.show_muti();
                    return false;
                }

                if(count==0){
                    count=$scope.menu_list[i]._countNum*-1;
                }
                $scope.menu_list[i]._countNum=$scope.menu_list[i]._countNum*1+count*1;
                if(count==0){
                    $scope.set_cart_remove($scope.menu_list[i].id,0,'');
                }else{
                    $scope.set_cart(ds_data.user,$scope.menu_list[i].id,0,'',count);
                }
                break;
            }
        }
    }

    //菜品操作
    $scope.menu_set_weight=function(id,weight,is_choose){
        for(i in $scope.menu_list){
            if($scope.menu_list[i].id==id){
                if(is_choose){
                    $scope.panel_weight_menu_id=id;
                    $scope.panel_weight_val=$scope.menu_list[i]._weight;
                    $scope.show_weight();
                    return false;
                }else{
                    $scope.set_cart_weight(ds_data.user,$scope.menu_list[i].id,weight);
                }
            }

        }
    }

    //筛选菜品
    $scope.list_menu_tag=function(id){
        for(i in $scope.tag_list){
            $scope.tag_list[i]._state=0;
            if($scope.tag_list[i].tagId==id){
                $scope.tag_list[i]._state=1;
            }
        }
        if (id==0){
            $scope.glb_show_cat=1;
            for(i in $scope.cat_list){
                if($scope.cat_list[i]._state==1){
                    $scope.list_menu_cat($scope.cat_list[i].id);
                }
            }
        }else{
            $scope.glb_show_cat=0;
            for(i in ds_data.type){
                if(ds_data.type[i].tagId==id){
                    break;
                }
            }
            for(i in $scope.menu_list){
                $scope.menu_list[i]._isShow=0;
                for(n in $scope.menu_list[i].tag){
                    if($scope.menu_list[i].tag[n].id==id && $scope.menu_list[i].isOnline==1){
                        $scope.menu_list[i]._isShow=1;
                        $scope.menu_list[i]._isSupply=$scope.deal_is_supply($scope.menu_list[i]);
                        break;
                    };
                }
            }
        };
        document.getElementsByTagName('body')[0].scrollTop=0;
    }
    $scope.list_menu_cat=function(id){
        var category="";
        console.log(id);
        for(i in $scope.cat_list){
            $scope.cat_list[i]._state=0;
            if($scope.cat_list[i].id==id){
                $scope.cat_list[i]._state=1;
                category=$scope.cat_list[i].name;
                if(id == 'search'){
                    $scope.glb_is_search = true;
                }else{
                    $scope.glb_is_search = false;
                }
            }
        }
        var menu_show_count=0;

        for(i in $scope.menu_list){
            $scope.menu_list[i]._isShow=0;

            var is_this_menu = false;
            if(id == 'search'){
                // if(!$scope.glb_str_search) $scope.glb_str_search = '';
                console.log($scope.glb_str_search);
                var has_str = $scope.menu_list[i].spelling.indexOf($scope.glb_str_search.toUpperCase());
                is_this_menu = (has_str >= 0) ? true : false;
            }else{
                // is_this_menu = ($scope.menu_list[i].categoryId==id && $scope.menu_list[i].isOnline==1) ? true : false;
                is_this_menu = ($scope.menu_list[i].category==category && $scope.menu_list[i].isOnline==1) ? true : false;

            }

            if(is_this_menu){
                $scope.menu_list[i]._isShow=1;
                menu_show_count++;
                $scope.menu_list[i]._isSupply=$scope.deal_is_supply($scope.menu_list[i]);
                continue;
            };
        }
        document.getElementsByTagName('body')[0].scrollTop=0;
    }
    
    $scope.deal_is_supply=function(item){
        var tm=new Date().Format("hh:mm");
        return (tm>=item.saleTime.startTime && tm<=item.saleTime.endTime)?1:0;
    }
    
    $scope.clear_menu_search = function(){
        $scope.glb_str_search = '';
    }

    //点餐提交
    $scope.dian_submit=function(){
        if($scope.glb_submit_status==1 && ds_cart.length > 0){
            //var str=JSON.stringify(ds_cart);
            str=ds_cart;
            console.log(str);
            $scope.glb_submit_status=0;
            $http.put(url_submit,{"cart":str}).success(function(obj){
            //$http.post(url_submit,{"cart":str}, postCfg).success(function(obj){
                console.log(obj);
                if (obj.result=="1"){
                    if(is_waiter){
                        db.removeItem('cart_desk_'+deskId);
                    }
                    window.location.href= url_order_pay +"?showwxpaytitle=1&id="+obj.returnValue.id;//点餐提交
                }else{
                    alert(obj.message.message);
                    $scope.glb_submit_status=1;
                };
            }).error(function(){
                alert("网络错误");
                $scope.glb_submit_status=1;
            });
        }
    }
     
    //外卖点餐提交 storeId 页面直接获取
    $scope.dian_submit_take=function(){
        if($scope.glb_submit_status==1 && ds_cart.length > 0){
            var str=JSON.stringify(ds_cart);
            console.log(str);
            $scope.glb_submit_status=0;
            $http.post(url_submit,{"cart":str,"storeId":storeId}, postCfg).success(function(obj){
                console.log(obj);
                if (obj.result=="1"){
                    window.location.href= url_order_pay +"?showwxpaytitle=1&id="+obj.returnValue.id;//点餐提交
                }else{
                    alert(obj.message.message);
                    $scope.glb_submit_status=1;
                };
            }).error(function(){
                alert("网络错误");
                $scope.glb_submit_status=1;
            });
        }
    }

    //购物车相关
    $scope.set_cart=function(user,menu_id,attr_id,sremark,count,type,user_img){//设置购物车数据
        var me = user;
        var real_count = 0;
        var item_menu=json_search($scope.menu_list,'id',menu_id);
        //修改ds_cart数据
        var has_cart=false;
        var has_user=false;

        for(i in ds_cart){
            if(ds_cart[i].productId==menu_id && ds_cart[i].userId==user && ds_cart[i].propertyId==attr_id && ds_cart[i].tasteNotes == sremark){
                has_cart=true;
                has_user=true;
                if(count < 0 && ds_cart[i].amount<=count*-1){
                    real_count = ds_cart[i].amount * -1;
                    ds_cart.splice(i,1);
                }else{
                    ds_cart[i].amount=ds_cart[i].amount*1+count*1;
                    real_count = count;
                }
                break;
            }
        }
        if(count<0){
            if(!has_user){
                for(i in ds_cart){
                    if(ds_cart[i].productId==menu_id && ds_cart[i].propertyId==attr_id && ds_cart[i].tasteNotes == sremark){
                        has_cart=true;
                        user=ds_cart[i].userId;
                        if(count < 0 && ds_cart[i].amount<=count*-1){
                            real_count = ds_cart[i].amount * -1;
                            ds_cart.splice(i,1);
                        }else{
                            ds_cart[i].amount=ds_cart[i].amount*1+count*1;
                            real_count = count;
                        }
                        break;
                    }
                }
            }

        }else if(count>0){
            if(!has_cart){
                var item_cart=new Object();
                if (type=='push'){
                    item_cart.userId=user;
                    item_cart.userImg=user_img;
                }else{
                    item_cart.userId=ds_data.user;
                    item_cart.image=ds_data.image;
                };
                item_cart.productId=parseInt(menu_id);
                item_cart.cat=item_menu.categoryId;
                item_cart.image=item_menu.image;

                item_cart.propertyId=parseInt(attr_id);
                item_cart.tasteNotes = sremark;
                item_cart.amount=count;
                item_cart.userType=0;
                ds_cart[ds_cart.length]=item_cart;
                real_count = count;
            }
        }
        if(type && user==ds_data.user && real_count != 0){
            for(i in $scope.menu_list){
                if($scope.menu_list[i].id==menu_id){
                    if($scope.menu_list[i].attr.length!=0){
                        for(n in $scope.menu_list[i].attr){
                            if($scope.menu_list[i].attr[n].id==attr_id){
                                $scope.menu_list[i].attr[n]._countNum=$scope.menu_list[i].attr[n]._countNum*1+real_count*1;
                            }
                        }
                    }
                    $scope.menu_list[i]._countNum=$scope.menu_list[i]._countNum*1+real_count*1;
                }
            }
        }
        $scope.glb_count_total=$scope.glb_count_total*1+real_count*1;
        var item_price=item_menu.unit_price;
        if(attr_id!=0){
            var item_attr=json_search(item_menu.attr,'id',attr_id);
            item_price=item_attr.price;
        }
        $scope.glb_price_total=(($scope.glb_price_total+item_price*real_count));
        $scope.glb_price_fixed=$scope.glb_price_total.toFixed(2);
        if(user==ds_data.user){
            for(i in $scope.cat_list){
                if($scope.cat_list[i].id==item_menu.categoryId){
                    $scope.cat_list[i]._count=$scope.cat_list[i]._count*1+real_count*1;
                    break;
                }
            }
        }
        $scope.cart_list=$scope.deal_cart();
        //推送操作数据
        if(!is_waiter) {
            //推送操作数据
            if (type=='push'){
                $scope.show_msg(item_menu.name,count);
            }else if(is_single==0 && real_count!=0){
                $http.post(url_push_opt,{user:user,menu:menu_id,attr:attr_id,sremark:sremark,count:real_count}, postCfg).success(function(obj){
                    if (obj.status=='success'){
                        
                    }else{
                        alert(obj.msg);
                    };
                }).error(function(){
                    alert("对不起，网络错误")
                });
            }
        }else{
            db.setItem('cart_desk_'+deskId,JSON.stringify(ds_cart));
        }
    }
    $scope.set_cart_remove=function(menu_id,attr_id,sremark,type){//移除购物车项目
        var count_remove=0;
        var price_remove=0;
        var count_remove_all=0;
        var name_remove='';
        var cat_remove=0;
        for(i in $scope.menu_list){
            if($scope.menu_list[i].id==menu_id){
                cat_remove=$scope.menu_list[i].categoryId;
                name_remove=$scope.menu_list[i].name;
                if($scope.menu_list[i].attr.length==0){
                    count_remove=$scope.menu_list[i]._countNum;
                    price_remove=$scope.menu_list[i].unit_price;
                    $scope.menu_list[i]._countNum=0;
                }else{
                    for(n in $scope.menu_list[i].attr){
                        var count_attr_else=0;
                        if($scope.menu_list[i].attr[n].id==attr_id){
                            count_remove=$scope.menu_list[i].attr[n]._countNum;
                            price_remove=$scope.menu_list[i].attr[n].price;
                            $scope.menu_list[i].attr[n]._countNum=0;
                        }else{
                            count_attr_else=count_attr_else*1+$scope.menu_list[i].attr[n]._countNum*1;
                        }
                    }
                    $scope.menu_list[i]._countNum=count_attr_else;
                }
                break;
            }
        }
        for(i in ds_cart){
            if(ds_cart[i].productId==menu_id && ds_cart[i].propertyId==attr_id && ds_cart[i].tasteNotes==sremark){
                count_remove_all=ds_cart[i].amount;
                break;
            }
        }
        $scope.glb_count_total=$scope.glb_count_total*1-count_remove_all*1;
        $scope.glb_price_total=(($scope.glb_price_total*100-price_remove*100*count_remove_all)/100);
        $scope.glb_price_fixed=$scope.glb_price_total.toFixed(2);

        for(i in $scope.cat_list){
            if($scope.cat_list[i].id==cat_remove){
                $scope.cat_list[i]._count=$scope.cat_list[i]._count*1-count_remove_all*1;
                break;
            }
        }

        //修改ds_cart数据
        var flag=new Array();
        for(var i=0; i<ds_cart.length; i++){
            if (ds_cart[i].productId==menu_id && ds_cart[i].propertyId==attr_id && ds_cart[i].tasteNotes==sremark){
                flag.push(i);
            };
        }
        var flag2=0;
        for(var i=0; i<flag.length; i++){
            ds_cart.splice(flag[i]-flag2,1);
            flag2++;
        }
        $scope.cart_list=$scope.deal_cart();
        //推送操作数据
        if(!is_waiter) {
            if (type=='push'){
                $scope.show_msg(name_remove,count_remove_all);
            }else{
                if(is_single==0){
                    $http.post(url_push_remove,{menu:menu_id,attr:attr_id,sremark:sremark}, postCfg).success(function(obj){
                        if (obj.status=='success'){
                            
                        }else{
                            alert(obj.msg);
                        };
                    }).error(function(){
                        alert("对不起，网络错误")
                    });
                }
            };
        }else{
            db.setItem('cart_desk_'+deskId,JSON.stringify(ds_cart));
        }
    }
    dsfunc.set_cart=function(user,menu_id,attr_id,sremark,count,type,user_img){//设置购物车数据
        $scope.$apply(function(){
            $scope.set_cart(user,menu_id,attr_id,sremark,count,type,user_img);
        });
    }
    dsfunc.set_cart_remove=function(menu_id,attr_id,sremark,type){//设置购物车数据
        $scope.$apply(function(){
            $scope.set_cart_remove(menu_id,attr_id,sremark,type);
        });
    }
    //称重购物车
    $scope.set_cart_weight=function(user,menu_id,weight){
        if(user=='default'){
            user=ds_data.user;
        }
        var me = user;
        var real_count = 0;
        var real_weight=weight;
        var weight_old=0;
        var item_menu=json_search($scope.menu_list,'id',menu_id);
        //修改ds_cart数据
        var has_cart=false;
        var has_user=false;

        for(i in ds_cart){
            if(ds_cart[i].productId==menu_id && ds_cart[i].userId==user){
                has_cart=true;
                has_user=true;
                if(weight>0){
                    real_count=1;
                    weight_old=ds_cart[i].weight;
                    ds_cart[i].weight=weight;
                }else if(weight==0){
                    real_count=0;
                    weight_old=ds_cart[i].weight;
                    ds_cart.splice(i,1);
                }
                break;
            }
        }
        if(weight>0){
            real_count=1;
            if(!has_cart){
                var item_cart=new Object();
                item_cart.userId=ds_data.user;
                item_cart.userImg=ds_data.user_img;
                item_cart.productId=parseInt(menu_id);
                item_cart.cat=item_menu.categoryId;
                item_cart.propertyId=0;
                item_cart.amount=1;
                item_cart.weight=weight;
                item_cart.userType=0;
                ds_cart[ds_cart.length]=item_cart;
            }
        }
        for(i in $scope.menu_list){
            if($scope.menu_list[i].id==menu_id){
                $scope.menu_list[i]._countNum=real_count;
                $scope.menu_list[i]._weight=real_weight;
            }
        }
        var count_offset=0;
        if(has_cart){
            if(weight==0){
                count_offset=-1;
            }
        }else{
            count_offset=1;
        }
        $scope.glb_count_total=$scope.glb_count_total*1+count_offset*1;
        var item_price=item_menu.price;
        $scope.glb_price_total=(($scope.glb_price_total*100+item_price*weight-item_price*weight_old)/100);
        $scope.glb_price_fixed=$scope.glb_price_total.toFixed(2);
        for(i in $scope.cat_list){
            if($scope.cat_list[i].id==item_menu.categoryId){
                $scope.cat_list[i]._count=$scope.cat_list[i]._count*1+count_offset*1;
                break;
            }
        }
        $scope.cart_list=$scope.deal_cart();
    }
});

function json_search(obj,key,value){
    for(var i=0; i<obj.length; i++){
        if (obj[i][key]==value) {
            return obj[i];
        };
    }
}
Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
