export default class ShplanGis {
    private iframeLoadEd: boolean = false;
    private iframeId: string = '';
    private iframeType: string = '';
    private doMessagesEd: boolean = false;
    private viewReadyEd: boolean = false;
    private messageTokens: Set<string> = new Set<string>();
    // handleReady 完成时添加token作为下次请求验证
    private messageCallBacks: {[key: string]: {[key: string]: Function}} = {};
    private readonly callBacks: { [key: string]: Function } = {};
    constructor() {
      this.doMessageListener();
    }

    public getIframeLoadEd() {
      return this.iframeLoadEd;
    }

    public setViewReadyEd(flag: boolean) {
      this.viewReadyEd = flag;
      const token = this.uuid();
      if (flag) {
        this.messageTokens.add(token);
      }
      this.broadcast('handleReady', {
          ready: flag,
          token,
      }, () => {
        console.info('handleReady callback');
      });
    }
    public subscription(actionName: string, callBack: Function) {
      return   this.doMessages(actionName, callBack);
    }
    public broadcastCallBack(callbackFun: string, data: any= {}, callback?: Function) {
        data = data || {};
        data.callbackFun = callbackFun;
        this.broadcast('callback', data, callback);
    }
    public broadcast(actionName: string, data: any= {}, callback?: Function) {
      data.iframeId = this.iframeId;
      this.doPostMessage({
        actionName,
        data,
      }, callback);
    }
    public removeSubscription(actionName: string) {
      const messageCallBacks = this.messageCallBacks;
      delete messageCallBacks[actionName];
    }
    public removeSubscriptionBy(id: string) {
      const messageCallBacks = this.messageCallBacks;
      const callBacks = Object.values(messageCallBacks);
      for (let i = 0; i < callBacks.length; i++) {
        const callBack = callBacks[i];
        delete callBack[id];
      }
    }
    private doMessageListener() {
      if (this.doMessagesEd) {
          return;
      }
      this.doMessagesEd = true;
      window.addEventListener('message', (e) => {
        const _data = e.data;
        //
        const actionName = _data.actionName;
        if (!actionName) {
          return;
        }
        if (actionName === 'iframeLoaded') {
          this.iframeRegister(_data.data);
          return;
        }
        if (actionName === 'callback') {
          this.doCallBackHandle(_data.data);
          return;
        }
        const token = _data.token;
        const flag = this.messageTokens.has(token);
        if (!flag) {
          throw new Error('没有操作权限!');
          return;
        }
        // 处理订阅的
        this.doSubscriptionCallBackHandle(actionName, _data.data);

      });
    }

    private doSubscriptionCallBackHandle(actionName: string, data: any) {
      const actions = this.messageCallBacks[actionName];
      if (actions) {
        const values = Object.values(actions) || [];
        for (let i = 0; i < values.length; i++) {
          const fun: Function = values[i];
          typeof fun === 'function' && fun(data);
        }
      }
    }
    private doCallBackHandle(data: any) {
      const callbackFun = this.callBacks[data.iframeCallbackFun];
      if (callbackFun && typeof callbackFun === 'function') {
        delete this.callBacks[data.callbackFun];
        delete data.iframeCallbackFun;
        callbackFun(data);
      }
    }

    private doPostMessage(data: any = {}, callback?: Function) {
       const _data = data.data;
       if (_data) {
        if (typeof callback == 'function' || typeof _data.callback === 'function') {
          this.doPostMessageCallback(_data, callback);
        }
      }
       window.parent.postMessage(data, '*');
    }

    private doPostMessageCallback(data: any, callback?: Function) {
      let  callbackFun = null;
      if (typeof callback !== 'function') {
         callbackFun = data.callback;
      } else {
         callbackFun = callback;
      }
      delete  data.callback;
      data.iframeCallbackFun = this.callBackKey(this.iframeId);
      this.callBacks[data.iframeCallbackFun] = callbackFun;
    }
    private doMessages(actionName: string, callBack: Function) {
      let messageCallBacks = this.messageCallBacks[actionName];
      if (!messageCallBacks) {
        messageCallBacks = this.messageCallBacks[actionName] = {};
      }
      const key = this.callBackKey(this.iframeId);
      messageCallBacks[key] = callBack;
      return key;
    }
    private iframeRegister(data: {iframeId: string, iframeType: string, callbackFun: string}) {
      const iframeId = data.iframeId;
      if (!iframeId) {
        throw Error('请指定iframeId');
      }
      const iframeType = data.iframeType;
      if (!iframeType) {
        throw Error('请指定iframeType');
      }
      this.iframeId = iframeId;
      this.iframeType = iframeType;
      if (data.callbackFun) {
        this.broadcast('callback', {
          callbackFun: data.callbackFun,
          callback: (e: any) => {
            this.iframeLoadEd = true;
          },
        });
      }
    }
    private uuid() {
      const s = [];
      const hexDigits = '0123456789abcdef';
      for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
      }
      s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
      // @ts-ignore
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
      s[8] = s[13] = s[18] = s[23] = '-';
      return s.join('');
    }
    // 保证key 的唯一性
    private callBackKey(iframeId: string) {
      return  iframeId + '_' + new Date().getTime() / 1000 + '_' + this.uuid();
    }
}
