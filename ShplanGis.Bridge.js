"use strict";
//iframe返回的数据中含有 iframeCallbackFun broadcast可以给予回调 {actionName: 'callback',data:{iframeCallbackFun}}
;(function (_window) {
    _window._ShplanGis = _window._ShplanGis||(function (__window) {
        // 添加只读属性
        function addDefineProperty(obj,p,value) {
            Object.defineProperty(obj, p, {
                configurable: false,
                writable: false,
                enumerable: false,
                value: value,
            });
        }
        function uuid() {
            var s = [];
            var hexDigits = "0123456789abcdef";
            for (var i = 0; i < 36; i++) {
                s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
            }
            s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
            s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
            s[8] = s[13] = s[18] = s[23] = "-";
            return s.join("");
        }
        // 保证key 的唯一性
        function callBackKey(iframeId) {
            return  iframeId+'_'+new Date().getTime()/1000+'_'+uuid()+new Date().getTime()/1000+uuid();
        }

        //actionName: 'iframeLoaded'
        function doPostMessage2Iframe(iframe,data,callback) {
            var callbackId = null;
            if (!iframe||!iframe.contentWindow){
                return ;
            }
            data = typeof data === 'string'?JSON.parse(data):data;
            var _data = data.data;
            if (_data){
                if (typeof callback === "function"|| typeof _data.callback === "function"){
                    callbackId = doPostMessageCallback.call(this,iframe.dataset.id,_data,callback)
                }
            }
            data.token = iframe.dataset.token;
            iframe.contentWindow.postMessage(data,iframe.dataset.src);
            return callbackId
        }
        function doPostMessageCallback(iframeId,data,callback) {
            if (!callback){
                callback = data.callback;
                delete data.callback;
            }
            data.callbackFun = callBackKey(iframeId);
            this.callBacks[data.callbackFun] = callback;
            return data.callbackFun;
        }
        function doMessages(iframe,actionName,callBack) {
            var _this = this;
            var iframeId = iframe.dataset.id;
            var messageCallBack = this.messageCallBacks[iframeId];
            if (!messageCallBack){
                messageCallBack = this.messageCallBacks[iframeId] = {};
            }
            var key = callBackKey(iframeId);
            if (actionName&&typeof callBack === "function"){
               const callBacks = messageCallBack[actionName] = messageCallBack[actionName]||{};
               callBacks[key] = callBack;
            }
            _doMessages.call(_this);
            return key;
        }

        function _doMessages() {
            var _this = this;
            if (_this.isListener === true){
                return;
            }
            addDefineProperty(_this,'isListener',true);
            __window.addEventListener('message',function(e) {
                var _data = e.data;
                //
                var actionName = _data.actionName;
                if (!actionName){
                    return;
                }
                if (actionName === 'callback'){
                    doCallBackHandle.call(_this,_data.data);
                    return;
                }
                // 处理订阅的
                doSubscriptionCallBackHandle.call(_this,actionName,_data.data);

            })
        }
        function doSubscriptionCallBackHandle(actionName,data) {
            var iframeId = data.iframeId;
            var messageCallBack = this.messageCallBacks[iframeId];
            if (!messageCallBack){
                return;
            }
            var callBacks = messageCallBack[actionName];
            if (!callBacks||Object.keys(callBacks).length<=0){
                return;
            }
            for (var i = 0;i<Object.keys(callBacks).length;i++){
                var key = Object.keys(callBacks)[i];
                var callBack = callBacks[key];
                typeof callBack === "function"&&callBack(data);
            }
        }

        function doCallBackHandle(data) {
            var callbackFun = this.callBacks[data.callbackFun];
            if(callbackFun&&typeof callbackFun === "function"){
                // delete this.callBacks[data.callbackFun];
                this.removeCallBackBy(data.callbackFun);
                delete data.callbackFun;
                callbackFun(data);
            }
        }
        function unique(arr){
            arr = arr||[];
            var newArr = [];
            for(var i = 0; i < arr.length; i++){
                if(newArr.indexOf(arr[i]) == -1){
                    newArr.push(arr[i])
                }
            }
            return newArr;
        }
        function loadIframes(_this,iframeIds) {
            var iframes = _this.iframes||[];
            if (iframeIds === void 0){
                iframeIds = [];
            }
            if (typeof iframeIds === "string"){
                iframeIds = [iframeIds];
            }
            if (iframes&&iframes.length>0){
                var _iframes = iframes.reverse();
                for (var i = 0;i<_iframes.length;i++){
                    var iframe = _iframes[i];
                    var iframeId = iframe.getAttribute('id');
                    iframeIds.splice(0,0,iframeId);
                }
                iframes.splice(0,iframes.length);
            }

            // iframes.splice(0,iframes.length);
            /*var _iframeIds = [];
            for (var i = 0;i<iframes.length;i++){
                var iframe = iframes[i];
                var iframeId = iframe.getAttribute('id');
                if (iframeIds.indexOf(iframeId)>=0){
                    _iframeIds.push(iframeId);
                }
            }
            var tempIds = [];
            for (var i= 0;i<iframeIds.length;i++){
                if (_iframeIds.indexOf(iframeIds[i])<0){
                    tempIds.push(iframeIds[i]);
                }
            }
            if (tempIds.length>0){
                iframeIds = tempIds;
            }else {
                return iframes;
            }*/
            iframeIds = unique(iframeIds);
            for (var i = 0; i<iframeIds.length;i++){
                var iframeId = iframeIds[i];
                var element = document.getElementById(iframeId);
                if (!element){
                    throw Error("指定的iframe无效!")
                }
                iframes.push(element);
                // 在iframe 加载完成后自动和iframe进行验证
                element.onload = (function (_ele) {
                    var src = _ele.getAttribute('src');
                    var id  = _ele.getAttribute('id');
                    _ele.dataset.id = id;
                    _ele.dataset.src = src;
                    return function(e){
                        registerIframe(_this,id,_ele);
                    }
                }(element));
            }
            return iframes;
        }
        //进行iframe注册
        function registerIframe(_this,id,_ele) {
            var iframeType =  _ele.dataset.type;
            if (!iframeType){
                throw Error('请指定iframe的Type!');
            }
            _this.broadcast(id,'iframeLoaded',{
                iframeId:id,
                iframeType: iframeType,
                callback: function (data) {
                    _ele.dataset.isRegistered = true;
                    if (!data.iframeCallbackFun){
                        throw Error("注册iframe的时候模仿三次握手,条件不符合");
                    }
                    _this.broadcast(id,'callback',{
                        iframeCallbackFun: data.iframeCallbackFun
                    });
                }
            })
        }
        function getIframeBy(iframeId) {
            var iframes = this.iframes;
            if (typeof iframeId === "number"){
                if (iframeId<=0){
                    iframeId = 1;
                }else if (iframeId >= iframes.length){
                    iframeId = this.iframes.length;
                }else {
                    iframeId+=1;
                }
                return iframes[iframeId-1];
            }
            for (var i = 0;i<iframes.length;i++){
                var iframe = iframes[i];
                if (iframe.dataset.id === iframeId){
                    return iframe;
                }
            }
            throw Error("该iframe没有注册!");
        }
        //广播也就是触发向iframe传值 // parameters可以添加callback 获取iframe给返回的值
        // 广播出去的具有回调的话在回调完成后会将回到方法删除
        function broadcast(iframeId,actionName,parameters,callback) {
            var iframe = getIframeBy.call(this,iframeId);
            // 如果不传入iframeId 参数位移
           return  doPostMessage2Iframe.call(this,iframe,{
                actionName:actionName,
                data: parameters
            },callback);
        }
        function broadcastCallBack(iframeId,callbackFun,parameters,callback) {
            parameters = parameters||{};
            parameters.iframeCallbackFun = callbackFun;
            this.broadcast(iframeId,'callback',parameters,callback);
        }
        // 订阅 也就是获取iframe传过来的值 会返回监听事件的id 调用removeSubscriptionBy 可删除
        // 订阅的回调方法只有调用删除时候才会删除不然会一直保留 一直接受回调数据
        function subscription(iframeId,actionName,callBack) {
           var iframe = getIframeBy.call(this,iframeId);
           return doMessages.call(this,iframe,actionName,callBack);
        }
        // 删除订阅在action上面所有的方法
        function removeSubscription(iframeId,actionName) {
            var messageCallBacks = this.messageCallBacks;
            var iframeCallBacks = messageCallBacks[iframeId];
            if (!iframeCallBacks){
                return;
            }
           delete  iframeCallBacks[actionName];
        }
            // 删除订阅在action上面 指定id 的方法 id 在subscription 方法中有返回
        function removeSubscriptionBy(id) {
            var messageCallBacks = this.messageCallBacks;
            var iframeCallBacks = Object.keys(messageCallBacks)||[];
            for (var i = 0;i<iframeCallBacks.length;i++){
                var actionCallBacks =  messageCallBacks[iframeCallBacks[i]]||{};
                var actionCallBackKeys = Object.keys(actionCallBacks)||[];
                for (var j = 0;j<actionCallBackKeys.length;j++){
                    var key = actionCallBackKeys[j];
                    var callBacks = actionCallBacks[key]||{};
                    delete callBacks[id];
                }
            }
        }
        function removeCallBackBy(id) {
            if (this.callBacks){
                delete this.callBacks[id];
            }
        }
        function removeCallBackDefaultBy(id) {
            removeCallBackBy.call(this,id);
        }
        // 监听handleReady  看是否地图加载完成可以进行操作
        // 监听一直存在 不要指定的删除哦
        function handleReady(iframeId) {
            var _this = this;
            _this.subscription(iframeId,"handleReady",function (data){
                var iframe = getIframeBy.call(_this,iframeId);
                iframe.dataset.handleReady = data.ready;
                iframe.dataset.token = data.token;
            });
        }
        function broadcastDefault(actionName,parameters,callback) {
            this.broadcast(0,actionName,parameters,callback);
        }
        function broadcastCallBackDefault(callbackFun,parameters,callback) {
            this.broadcastCallBack(0,callbackFun,parameters,callback);
        }
        function subscriptionDefault(actionName,callBack) {
            return this.subscription(0,actionName,callBack);
        }
        function removeSubscriptionDefault(actionName) {
            this.removeSubscription(0, actionName);
        }
        function removeSubscriptionDefaultBy(id) {
            this.removeSubscriptionBy(id);
        }
        function ShplanGis(iframeIds) {
            // 根据iframeId及 事件添加callBack
            addDefineProperty(this,'messageCallBacks',{});
            // 回调数组 id 根据时间
            addDefineProperty(this,'callBacks',{});

            addDefineProperty(this,'broadcast',broadcast);
            addDefineProperty(this,'broadcastCallBack',broadcastCallBack);
            addDefineProperty(this,'subscription',subscription);
            addDefineProperty(this,'removeSubscription',removeSubscription);
            addDefineProperty(this,'removeSubscriptionBy',removeSubscriptionBy);
            addDefineProperty(this,'removeCallBackBy',removeCallBackBy);
            //Default 默认为第一个iframe
            addDefineProperty(this,'broadcastDefault',broadcastDefault);
            addDefineProperty(this,'broadcastCallBackDefault',broadcastCallBackDefault);
            addDefineProperty(this,'subscriptionDefault',subscriptionDefault);
            addDefineProperty(this,'removeSubscriptionDefault',removeSubscriptionDefault);
            addDefineProperty(this,'removeSubscriptionDefaultBy',removeSubscriptionDefaultBy);
            addDefineProperty(this,'removeCallBackDefaultBy',removeCallBackDefaultBy);
            if (iframeIds){
                init.call(this,iframeIds);
            }else {
                addDefineProperty(this,'init',function (_iframeIds) {
                    init.call(this,_iframeIds);
                });
            }

        }

        function init(iframeIds) {
            iframeIds = iframeIds||[];
            // 添加私有iframes数组属性
            var iframes = loadIframes(this,iframeIds);
            if (!this.iframes){
                addDefineProperty(this,'iframes',iframes);
            }else {
                iframes = loadIframes(this,iframeIds);
            }
            for (var i = 0;i< iframes.length;i++){
                var _iframe = getIframeBy.call(this,i);
                if (_iframe){
                    doMessages.call(this,_iframe);
                    // 添加handleReady
                    handleReady.call(this,_iframe.dataset.id);
                }
            }
            // 添加属性
            //addAttribute(this);
            // 添加接口方法
            // addFunExt(this);
            // 添加监听方法
            // addWatchFunExt(this);
        }

       /* // 添加属性
        function addAttribute(_this) {
            var layers = ['JIADINGQU_AREA','JIADINGQU','ZHENJIE','ZUJIE','CUNJIE','YICHURANGDIKUAI','DAICHURANGDIKUAI',
                'GAOSUCHURUKOU','GONGYUANLVDI','GONGDIANSHESHI','GUIDAOJIAOTONGZHANDIAN','JIAOTONGSHUNIU','YIYUAN','XUEXIAO','SHANGYE','WENTIZHONGXIN',
                'WUSHUIYUSHUICHULISHESHI','XIAOQU','XIAOQU_AREA','MENPAIZHUANG','BANKUAIHUAFEN'];
            addDefineProperty(_this,'layers',layers);

        }*/


        // 添加订阅
        /*function addWatchFunExt(_this) {
            addDefineProperty(_this,'watchMapClicked',function (callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'mapClicked',callback);
            });
            addDefineProperty(_this,'watchMapPointerMove',function (callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'mapPointerMove',callback);
            });
            addDefineProperty(_this,'watchMapGrag',function (callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'mapGrag',callback);
            });
        }*/
        /*// 添加事件
        function addFunExt(_this) {
            addDefineProperty(_this,'zoomIn',function (callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'zoomIn',{},callback);
            });
            addDefineProperty(_this,'zoomOut',function (callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'zoomOut',{},callback);
            });
            addDefineProperty(_this,'zoomTo',function (zoom,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'zoomTo',{zoom:zoom},callback);
            });
            addDefineProperty(_this,'mapDrag',function (flag,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'mapDrag',{isDrag:flag},callback);
            });
            addDefineProperty(_this,'toHome',function (callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'toHome',{},callback);
            });

            addDefineProperty(_this,'drawDistrictBj',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'drawDistrictBj',p||{},callback);
            });

            addDefineProperty(_this,'getBlocks',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'getBlocks',p||{},callback);
            });

            addDefineProperty(_this,'drawBlocks',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'drawBlocks',p|| {},callback);
            });

            addDefineProperty(_this,'getSellBlocks',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'getSellBlocks',p|| {},callback);
            });
            addDefineProperty(_this,'showSellBlocks',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'showSellBlocks',p|| {},callback);
            });
            addDefineProperty(_this,'showSellBlock',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'showSellBlocks',p|| {},callback);
            });
            addDefineProperty(_this,'sellBlockEvent',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'sellBlockEvent',p||{},callback);
            });
            addDefineProperty(_this,'watchSellBlockEvent',function (p,callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'watchSellBlockEvent',watchSellBlockEvent(p,callback));
                //this.broadcast(getIframeId(iframeId),'sellBlockEvent',p||{},watchSellBlockEvent(this,p,callback,iframeId));
            });
            addDefineProperty(_this,'watchXiaoquEvent',function (p,callback,iframeId) {
                return this.subscription(getIframeId(iframeId),'watchXiaoquEvent',watchSellBlockEvent(p,callback));
            });
            addDefineProperty(_this,'getXiaoqus',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'getXiaoqus',p||{},callback);
            });
            addDefineProperty(_this,'showXiaoqus',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'showXiaoqus',p||{},callback);
            });
            addDefineProperty(_this,'getZjs',function (callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'boundarys',{type:'zj'},callback);
            });
            addDefineProperty(_this,'drawZj',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'drawZj',p||{},callback);
            });
            addDefineProperty(_this,'drawDikuai',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'drawDikuai',p||{},callback);
            });
            addDefineProperty(_this,'drawYcrDikuai',function (p,callback,iframeId) {
                p = p||{};
                p.type = 'ycr'
                this.broadcast(getIframeId(iframeId),'drawDikuai',p||{},callback);
            });
            addDefineProperty(_this,'drawWcrDikuai',function (p,callback,iframeId) {
                p = p||{};
                p.type = 'wcr'
                this.broadcast(getIframeId(iframeId),'drawDikuai',p,callback);
            });
            addDefineProperty(_this,'drawBankuai',function (p,callback,iframeId) {
                p = p||{};
                p.type = 'bk'
                this.broadcast(getIframeId(iframeId),'drawDikuai',p,callback);
            });
            addDefineProperty(_this,'drawCircleQurey',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'drawCircleQurey',p||{},callback);
            });
            addDefineProperty(_this,'showZhoubian',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'showZhoubian',p||{},callback);
            });
            addDefineProperty(_this,'showZhoubians',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'showZhoubians',p||{},callback);
            });
            addDefineProperty(_this,'cleanMap',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'cleanMap',p||{},callback);
            });

            addDefineProperty(_this,'getPoint',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'getPoint',p||{},callback);
            });
            addDefineProperty(_this,'getXiaoquPoint',function (p,callback,iframeId) {
                p = p||{};
                p.type = 'xq';
                this.getPoint(p,callback,iframeId);
            });
            addDefineProperty(_this,'switchHeatmap',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'switchHeatmap',p||{},callback);
            });
            addDefineProperty(_this,'mouseWheelZoomEnabled',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'mouseWheelZoomEnabled',p||{},callback);
            });
            addDefineProperty(_this,'cleanLayers',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'cleanLayers',p||{},callback);
            });
            addCleanLayers(_this);

            addDefineProperty(_this,'getBaseLayers',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'getBaseLayers',p||{},callback);
            });
            addDefineProperty(_this,'changeBaseLayer',function (p,callback,iframeId) {
                this.broadcast(getIframeId(iframeId),'changeBaseLayer',p||{},callback);
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
                        this.cleanLayers(p,callback,iframeId);
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
        }*/
        return ShplanGis;
    }(_window))
}(window));
