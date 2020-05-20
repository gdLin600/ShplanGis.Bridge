"use strict";
;(function () {
    if (!_ShplanGis){
        throw Error("请先引入ShplanGis.Bridge.js文件,此文件不是必要的只是对ShplanGis.Bridge.js进行拓展 但是这个给你提供方法的封装及必要的常量!");
    }
}());(function (__ShplanGis,_window) {
    function addDefineProperty(obj,p,value) {
        Object.defineProperty(obj, p, {
            configurable: false,
            writable: false,
            enumerable: false,
            value: value,
        });
    }
    function Constant(actionName, msg){
        addDefineProperty(this,"getActionName",function () {
            return actionName;
        })
        addDefineProperty(this,"getMsg",function () {
            return msg;
        })
    }
    var subscriptions = {
        handleReady: new Constant("handleReady","当地图加载完成可以操作的时候给予回调"),
        mapClicked: new Constant("mapClicked","map 被点击了 返回当前点击的坐标及地图坐标"),
        mapPointerMove: new Constant("mapPointerMove","鼠标在地图上面移动事件 返回屏幕的坐标及地图坐标"),
    };
    var broadcasts = {
        zoomIn: new Constant('zoomIn','放大操作, callback 返回操作后的zoom'),
        zoomOut: new Constant("zoomOut", '缩小操作, callback 返回操作后的zoom'),
        zoomTo: new Constant("zoomTo", '缩放到指定的zoom,需要参数zoom: ps:{zoom:1}, callback 返回操作后的zoom'),
        toHome: new Constant("toHome", '还原到初始化状态, callback 返回操作后的 mapView的extent属性'),
        fullScreen: new Constant("fullScreen", '全屏显示, 嵌入iframe影像该功能还没有实现'),
        identify: new Constant("identify", '检索查询指定type(默认: point 用来指定检索的范围)'),
        identifyForGeometry: new Constant("identifyForGeometry", '检索查询指定Geometry'),
        drawCircle: new Constant("drawCircle", '指定中心点画圆center可以在identify 回调中获取,只能画一个 前面画的会自动清除, 返回geometry, 用于查询使用'),
        cleanGeometry: new Constant("cleanGeometry", '清除指定layerId的集合图形, 如果知道layerId 否则不需要传入默认清除所有'),
        locationByGeometry: new Constant("locationByGeometry", '给定一个空间位置给予定位,isDraw: 是否给给定的空间画边框,isZoom: 是否定位后以这个空间位置设置extent'),
        boundarys: new Constant("boundarys", '获取边界线: type:(zj: 镇界,cj:村界,zuj: 组界,xq:小区(查小区的时候返回小区的state 可以算出年度开盘数,待开盘,在售楼盘))'),
        drawZj: new Constant("drawZj", '画镇界显示'),
        drawXqCenter: new Constant("drawXqCenter", '画小区中心点颜色'),
        xiaoshouStateCount: new Constant("xiaoshouStateCount", '获取小区开盘数量(dkp: 待开盘,ndkp:年度开盘, zslp:在售楼盘) 无参数'),
    };
    _window.ShplanGis = _window.ShplanGis|| (function (___ShplanGis) {
        function ShplanGisExt(iframeIds) {
            /*___ShplanGis.apply(this,arguments);*/
            this.__proto__.init(iframeIds);
            addAttributes(this);
            addFunExt(this);
            addWatchFunExt(this);
        }
        // 添加属性
        function addAttributes(_this){
            addDefineProperty(ShplanGisExt,'subscriptions',subscriptions);
            addDefineProperty(ShplanGisExt,'broadcasts',broadcasts);
            var layers = ['JIADINGQU_AREA','JIADINGQU','ZHENJIE','ZUJIE','CUNJIE','YICHURANGDIKUAI','DAICHURANGDIKUAI',
                'GAOSUCHURUKOU','GONGYUANLVDI','GONGDIANSHESHI','GUIDAOJIAOTONGZHANDIAN','JIAOTONGSHUNIU','YIYUAN','XUEXIAO','SHANGYE','WENTIZHONGXIN',
                'WUSHUIYUSHUICHULISHESHI','XIAOQU','XIAOQU_AREA','MENPAIZHUANG','BANKUAIHUAFEN'];
            addDefineProperty(_this,'layers',layers);

        }
        // 添加订阅
        function addWatchFunExt(_this) {
            addDefineProperty(_this,'watchMapClicked',function (callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'mapClicked',callback);
            });
            addDefineProperty(_this,'handleReady',function (callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'handleReady',callback);
            });
            addDefineProperty(_this,'watchMapPointerMove',function (callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'mapPointerMove',callback);
            });
            addDefineProperty(_this,'watchMapGrag',function (callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'mapGrag',callback);
            });
        }

        function getIframeId(iframeId) {
            if (typeof iframeId === "undefined"){
                iframeId = 0;
            }
            return iframeId;
        }
        // 添加事件
        function addFunExt(_this) {
            addDefineProperty(_this,'zoomIn',function (callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'zoomIn',{},callback);
            });
            addDefineProperty(_this,'zoomOut',function (callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'zoomOut',{},callback);
            });
            addDefineProperty(_this,'zoomTo',function (zoom,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'zoomTo',{zoom:zoom},callback);
            });
            addDefineProperty(_this,'mapDrag',function (flag,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'mapDrag',{isDrag:flag},callback);
            });
            addDefineProperty(_this,'toHome',function (callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'toHome',{},callback);
            });

            addDefineProperty(_this,'drawDistrictBj',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'drawDistrictBj',p||{},callback);
            });

            addDefineProperty(_this,'getBlocks',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'getBlocks',p||{},callback);
            });

            addDefineProperty(_this,'drawBlocks',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'drawBlocks',p|| {},callback);
            });

            addDefineProperty(_this,'getSellBlocks',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'getSellBlocks',p|| {},callback);
            });
            addDefineProperty(_this,'showSellBlocks',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'showSellBlocks',p|| {},callback);
            });
            addDefineProperty(_this,'showSellBlock',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'showSellBlocks',p|| {},callback);
            });
            addDefineProperty(_this,'sellBlockEvent',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'sellBlockEvent',p||{},callback);
            });
            addDefineProperty(_this,'watchSellBlockEvent',function (p,callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'watchSellBlockEvent',watchSellBlockEvent(p,callback));
                //return this.broadcast(getIframeId(iframeId),'sellBlockEvent',p||{},watchSellBlockEvent(this,p,callback,iframeId));
            });
            addDefineProperty(_this,'watchXiaoquEvent',function (p,callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'watchXiaoquEvent',watchSellBlockEvent(p,callback));
            });
            addDefineProperty(_this,'getXiaoqus',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'getXiaoqus',p||{},callback);
            });
            addDefineProperty(_this,'showXiaoqus',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'showXiaoqus',p||{},callback);
            });
            addDefineProperty(_this,'getZjs',function (callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'boundarys',{type:'zj'},callback);
            });
            addDefineProperty(_this,'drawZj',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'drawZj',p||{},callback);
            });
            addDefineProperty(_this,'drawDikuai',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'drawDikuai',p||{},callback);
            });
            addDefineProperty(_this,'drawYcrDikuai',function (p,callback,iframeId) {
                p = p||{};
                p.type = 'ycr'
                return this.broadcast(getIframeId(iframeId),'drawDikuai',p||{},callback);
            });
            addDefineProperty(_this,'drawWcrDikuai',function (p,callback,iframeId) {
                p = p||{};
                p.type = 'wcr'
                return this.broadcast(getIframeId(iframeId),'drawDikuai',p,callback);
            });
            addDefineProperty(_this,'drawBankuai',function (p,callback,iframeId) {
                p = p||{};
                p.type = 'bk'
                return this.broadcast(getIframeId(iframeId),'drawDikuai',p,callback);
            });
            addDefineProperty(_this,'drawCircleQurey',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'drawCircleQurey',p||{},callback);
            });
            addDefineProperty(_this,'showZhoubian',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'showZhoubian',p||{},callback);
            });
            addDefineProperty(_this,'showZhoubians',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'showZhoubians',p||{},callback);
            });
            addDefineProperty(_this,'cleanMap',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'cleanMap',p||{},callback);
            });

            addDefineProperty(_this,'getPoint',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'getPoint',p||{},callback);
            });
            addDefineProperty(_this,'getXiaoquPoint',function (p,callback,iframeId) {
                p = p||{};
                p.type = 'xq';
                this.getPoint(p,callback,iframeId);
            });
            addDefineProperty(_this,'switchHeatmap',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'switchHeatmap',p||{},callback);
            });
            addDefineProperty(_this,'mouseWheelZoomEnabled',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'mouseWheelZoomEnabled',p||{},callback);
            });
            addDefineProperty(_this,'cleanLayers',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'cleanLayers',p||{},callback);
            });
            addCleanLayers(_this);

            addDefineProperty(_this,'getBaseLayers',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'getBaseLayers',p||{},callback);
            });
            addDefineProperty(_this,'changeBaseLayer',function (p,callback,iframeId) {
                return this.broadcast(getIframeId(iframeId),'changeBaseLayer',p||{},callback);
            });

        }
        function addCleanLayers(_this) {
            var cleanLayers = _this.layers;
            for (var i = 0;i<cleanLayers.length;i++){
                var fun = cleanLayers[i]||'';
                if (fun.length<=0){
                    continue;
                }
                fun = fun.toLowerCase();
                fun = fun.substring(0, 1).toUpperCase() + fun.substring(1);
                addDefineProperty(_this,'clean'+fun,(function (_fun) {
                    return function (p,callback,iframeId) {
                        p = {}
                        p.layerIds = [_fun];
                        return  this.cleanLayers(p,callback,iframeId);
                    }
                })(fun));
            }
        }

        function watchSellBlockEvent(p,callback) {
            return function (data) {
                p = p||{};
                var eventType = p.eventType||'click';
                data = data||{};
                var handleType = data.handleType;
                if (handleType.indexOf(eventType)===0){
                    typeof callback === "function"&&callback(data);
                }
            }
        }
        ShplanGisExt.prototype = new ___ShplanGis();
        return  ShplanGisExt;
    }(__ShplanGis));
}(_ShplanGis,window));
