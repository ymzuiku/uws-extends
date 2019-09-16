interface IWS extends WebSocket {
  /** 推送一个消息，等待回调用 */
  fetch: (url: string, data?: any) => Promise<any>;
  /** 创建一个监听 */
  on: (url: string, handle: (data: any) => any) => () => any;
  /** 推送一个消息，不等待回调用 */
  push: (url: string, data: any) => any;
}
const subscribs = new Map();

/** 创建一个会自动管理重连的ws, 每当客户端主动发起消息，如果未链接ws，会主动重连 */
export const createClientWS = (wsURL: string, fetchTimeOut = 8500) => {
  let ws: IWS = new WebSocket(wsURL) as any;

  let autoTimer: any;
  const autoReConnect = () => {
    if (ws.readyState > 1) {
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
      autoTimer = setTimeout(() => {
        ws = createClientWS(wsURL);
      }, 200);
    }
  };

  ws.on = (url: string, handle: any) => {
    subscribs.set(url, handle);

    return () => {
      subscribs.delete(url);
    };
  };

  ws.push = (url, data = {}) => {
    autoReConnect();
    let timer: any;

    const reFetch = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (ws.readyState !== 1) {
        timer = setTimeout(() => {
          reFetch();
        }, 30);
      } else {
        ws.send(JSON.stringify({ url, data }));
      }
    };

    reFetch();
  };

  ws.fetch = async (url: string, data = {}): Promise<any> => {
    autoReConnect();
    let timer: any;

    const reFetch = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (ws.readyState !== 1) {
        timer = setTimeout(() => {
          reFetch();
        }, 30);
      } else {
        ws.send(JSON.stringify({ url, data }));
      }
    };

    return new Promise(res => {
      let timeOutTimer: any = setTimeout(() => {
        res({ error: 'error: time-out', data: null });
        subscribs.delete(url);
      }, fetchTimeOut);

      ws.on(url, (response: any) => {
        if (timeOutTimer) {
          clearTimeout(timeOutTimer);
          timeOutTimer = null;
        }
        if (response && response.data) {
          res(response.data);
        } else {
          res({ error: 'error: no-data', response });
        }
        subscribs.delete(url);
      });
      reFetch();
    });
  };

  ws.addEventListener('message', msg => {
    let res;
    try {
      res = JSON.parse(msg.data);
      subscribs.get(res.url)(res);
    } catch (err) {
      //
    }
  });
  ws.addEventListener('open', () => {
    // autoReConnect();
  });
  ws.addEventListener('close', () => {
    // autoReConnect();
  });

  return ws;
};
