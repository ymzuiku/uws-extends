import {
  App,
  AppOptions,
  HttpRequest,
  HttpResponse,
  RecognizedString,
  TemplatedApp,
} from '@nuage/uws';
import * as querystring from 'querystring-number';

export interface IHttpRequest extends HttpRequest {
  GET_BODY(): Promise<any>;
  GET_PAEAMS(len: number): string[];
  GET_QUERY(): any;
}

export interface IHttpResponse extends HttpResponse {
  SEND(obj: any): void;
}

export interface ITemplatedApp extends TemplatedApp {
  AFTER?(
    url: RecognizedString,
    res: IHttpResponse,
    req: IHttpRequest,
    data: any,
  ): any;
  /** Registers an HTTP handler matching specified URL pattern on any HTTP method. */
  ANY(
    pattern: RecognizedString,
    handler: (res: IHttpResponse, req: IHttpRequest) => any,
  ): ITemplatedApp;
  BEFORE?(url: RecognizedString, res: IHttpResponse, req: IHttpRequest): any;
  /** Registers an HTTP DELETE handler matching specified URL pattern. */
  DEL(
    pattern: RecognizedString,
    handler: (res: IHttpResponse, req: IHttpRequest) => any,
  ): ITemplatedApp;
  /** Registers an HTTP GET handler matching specified URL pattern. */
  GET(
    pattern: RecognizedString,
    handler: (res: IHttpResponse, req: IHttpRequest) => any,
  ): ITemplatedApp;
  /** Registers an HTTP OPTIONS handler matching specified URL pattern. */
  OPTIONS(
    pattern: RecognizedString,
    handler: (res: IHttpResponse, req: IHttpRequest) => any,
  ): ITemplatedApp;
  /** Registers an HTTP PATCH handler matching specified URL pattern. */
  PATCH(
    pattern: RecognizedString,
    handler: (res: IHttpResponse, req: IHttpRequest) => any,
  ): ITemplatedApp;
  /** Registers an HTTP POST handler matching specified URL pattern. */
  POST(
    pattern: RecognizedString,
    handler: (res: IHttpResponse, req: IHttpRequest) => any,
  ): TemplatedApp;
  /** Registers an HTTP PUT handler matching specified URL pattern. */
  PUT(
    pattern: RecognizedString,
    handler: (res: IHttpResponse, req: IHttpRequest) => any,
  ): ITemplatedApp;
  /** Registers an HTTP CONNECT handler matching specified URL pattern. */
  TRACE(
    pattern: RecognizedString,
    handler: (res: IHttpResponse, req: IHttpRequest) => any,
  ): ITemplatedApp;
}

export const send = (res: any, obj: any) => {
  res.end(JSON.stringify(obj));
};

export const query = (req: HttpRequest) => {
  return querystring.parse(req.getQuery());
};

/* Helper function for reading a posted JSON body */
export const body = async (res: HttpResponse): Promise<any> => {
  return new Promise((cb, rej) => {
    let buffer: Buffer;
    /* Register data cb */
    res.onData((ab: any, isLast: boolean) => {
      const chunk = Buffer.from(ab);
      if (isLast) {
        let json;
        if (buffer) {
          try {
            json = JSON.parse(Buffer.concat([buffer, chunk]) as any);
          } catch (e) {
            /* res.close calls onAborted */
            return;
          }
          cb(json);
        } else {
          try {
            json = JSON.parse(chunk as any);
          } catch (e) {
            /* res.close calls onAborted */
            return;
          }
          cb(json);
        }
      } else {
        if (buffer) {
          buffer = Buffer.concat([buffer, chunk]);
        } else {
          buffer = Buffer.concat([chunk]);
        }
      }
    });

    /* Register error cb */
    res.onAborted(rej);
  });
};

export const bindApp = (app: TemplatedApp): ITemplatedApp => {
  const matchKeys = {
    ANY: 'any',
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DEL: 'del',
    TRACE: 'trace',
    OPTIONS: 'options',
  };

  Object.keys(matchKeys).forEach(k => {
    const v = (matchKeys as any)[k];
    (app as any)[k] = (url: string, cb: any) => {
      return (app as any)[v](url, (res: IHttpResponse, req: IHttpRequest) => {
        // 扩展 res，req
        req.GET_BODY = () => body(res);
        req.GET_QUERY = () => query(req);
        req.GET_PAEAMS = (len: number) => {
          const arr = [];
          for (let i = 0; i < len; i++) {
            arr.push(req.getParameter(i));
          }

          return arr;
        };
        res.SEND = obj => send(res, obj);

        // 处理前置
        if ((app as ITemplatedApp).BEFORE) {
          (app as ITemplatedApp).BEFORE!(url, res, req);
        }

        // 使用 BEFORE 处理跨域的例子
        // app.BEFORE = (url, res, req) => {
        //   res.writeHeader('Access-Control-Allow-Origin', '*');
        // };

        // 如果异步行为，需要设定 onAborted
        res.onAborted(() => {
          res.aborted = true;
          // 处理后置
          if ((app as ITemplatedApp).AFTER) {
            (app as ITemplatedApp).AFTER!(url, res, req, null);
          }
        });

        // 处理 Promise 返回值
        Promise.resolve(cb(res, req)).then((data: any) => {
          if (!res.aborted) {
            // 返回内容异常时
            if (!data) {
              const error = JSON.stringify({
                code: 500,
                msg: 'serveice error',
              });
              // 处理后置
              if ((app as ITemplatedApp).AFTER) {
                (app as ITemplatedApp).AFTER!(url, res, req, error);
              }
              res.end(error);
            } else {
              // 处理后置
              if ((app as ITemplatedApp).AFTER) {
                (app as ITemplatedApp).AFTER!(url, res, req, data);
              }
              res.end(JSON.stringify(data));
            }
          }
        });
      }) as ITemplatedApp;
    };
  });

  return app as ITemplatedApp;
};
