"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const querystring = require("querystring-number");
exports.send = (res, obj) => {
    res.end(JSON.stringify(obj));
};
exports.query = (req) => {
    return querystring.parse(req.getQuery());
};
/* Helper function for reading a posted JSON body */
exports.body = (res) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((cb, rej) => {
        let buffer;
        /* Register data cb */
        res.onData((ab, isLast) => {
            const chunk = Buffer.from(ab);
            if (isLast) {
                let json;
                if (buffer) {
                    try {
                        json = JSON.parse(Buffer.concat([buffer, chunk]));
                    }
                    catch (e) {
                        /* res.close calls onAborted */
                        return;
                    }
                    cb(json);
                }
                else {
                    try {
                        json = JSON.parse(chunk);
                    }
                    catch (e) {
                        /* res.close calls onAborted */
                        return;
                    }
                    cb(json);
                }
            }
            else {
                if (buffer) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                else {
                    buffer = Buffer.concat([chunk]);
                }
            }
        });
        /* Register error cb */
        res.onAborted(rej);
    });
});
exports.bindApp = (app) => {
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
        const v = matchKeys[k];
        app[k] = (url, cb) => {
            return app[v](url, (res, req) => {
                // 扩展 res，req
                req.GET_BODY = () => exports.body(res);
                req.GET_QUERY = () => exports.query(req);
                req.GET_PAEAMS = (len) => {
                    const arr = [];
                    for (let i = 0; i < len; i++) {
                        arr.push(req.getParameter(i));
                    }
                    return arr;
                };
                res.SEND = obj => exports.send(res, obj);
                // 处理前置
                if (app.BEFORE) {
                    app.BEFORE(url, res, req);
                }
                // 使用 BEFORE 处理跨域的例子
                // app.BEFORE = (url, res, req) => {
                //   res.writeHeader('Access-Control-Allow-Origin', '*');
                // };
                // 如果异步行为，需要设定 onAborted
                res.onAborted(() => {
                    res.aborted = true;
                    // 处理后置
                    if (app.AFTER) {
                        app.AFTER(url, res, req, null);
                    }
                });
                // 处理 Promise 返回值
                Promise.resolve(cb(res, req)).then((data) => {
                    if (!res.aborted) {
                        // 返回内容异常时
                        if (!data) {
                            const error = JSON.stringify({
                                code: 500,
                                msg: 'serveice error',
                            });
                            // 处理后置
                            if (app.AFTER) {
                                app.AFTER(url, res, req, error);
                            }
                            res.end(error);
                        }
                        else {
                            // 处理后置
                            if (app.AFTER) {
                                app.AFTER(url, res, req, data);
                            }
                            res.end(JSON.stringify(data));
                        }
                    }
                });
            });
        };
    });
    return app;
};
