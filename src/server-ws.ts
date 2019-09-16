import { TemplatedApp, WebSocket } from '@nuage/uws';

const decoder = new TextDecoder('utf-8');

function arrayBufferToString(buf: ArrayBuffer) {
  return decoder.decode(new Uint8Array(buf));
}

export interface IUWS extends TemplatedApp {
  on(
    url: string,
    handle: (data: any, ws: WebSocket, isBinary: boolean) => any,
  ): void;
}

export const bindUWS = (uws: TemplatedApp): IUWS => {
  const fns = new Map();

  (uws as IUWS).on = (url, handle) => {
    fns.set(url, handle);
  };

  (uws as IUWS).ws('/*', {
    /* Options */
    compression: 1,
    maxPayloadLength: 32 * 1024 * 1024,
    idleTimeout: 10,
    /* Handlers */
    open: (ws, req) => {
      ws.isOpen = true;
    },
    message: (ws, msg, isBinary) => {
      let res: any;
      try {
        res = JSON.parse(arrayBufferToString(msg));
      } catch (err) {
        //
      }

      if (process.env.NODE_ENV === 'development') {
        // tslint:disable-next-line
        console.log('message:', res);
      }

      if (res && res.url && fns.has(res.url)) {
        const { url, data } = res;
        let response;

        if (url.indexOf('::') > 0) {
          response = fns.get(url.split('::')[1])(data, ws, isBinary);
        } else {
          response = fns.get(url)(data, ws, isBinary);
        }

        if (response) {
          Promise.resolve(response).then(json => {
            ws.send(JSON.stringify({ url, data: json }), isBinary);
          });
        }
      }
    },
    close: (ws, code, msg) => {
      ws.isClose = true;
    },
  });

  return uws as IUWS;
};
