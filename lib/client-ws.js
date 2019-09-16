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
const subscribs = new Map();
/** 创建一个会自动管理重连的ws, 每当客户端主动发起消息，如果未链接ws，会主动重连 */
exports.createClientWS = (wsURL, fetchTimeOut = 8500) => {
    let ws = new WebSocket(wsURL);
    let autoTimer;
    const autoReConnect = () => {
        if (ws.readyState > 1) {
            if (autoTimer) {
                clearTimeout(autoTimer);
                autoTimer = null;
            }
            autoTimer = setTimeout(() => {
                ws = exports.createClientWS(wsURL);
            }, 200);
        }
    };
    ws.on = (url, handle) => {
        subscribs.set(url, handle);
        return () => {
            subscribs.delete(url);
        };
    };
    ws.push = (url, data = {}) => {
        autoReConnect();
        let timer;
        const reFetch = () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            if (ws.readyState !== 1) {
                timer = setTimeout(() => {
                    reFetch();
                }, 30);
            }
            else {
                ws.send(JSON.stringify({ url, data }));
            }
        };
        reFetch();
    };
    ws.fetch = (url, data = {}) => __awaiter(this, void 0, void 0, function* () {
        autoReConnect();
        let timer;
        const reFetch = () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            if (ws.readyState !== 1) {
                timer = setTimeout(() => {
                    reFetch();
                }, 30);
            }
            else {
                ws.send(JSON.stringify({ url, data }));
            }
        };
        return new Promise(res => {
            let timeOutTimer = setTimeout(() => {
                res({ error: 'error: time-out', data: null });
                subscribs.delete(url);
            }, fetchTimeOut);
            ws.on(url, (response) => {
                if (timeOutTimer) {
                    clearTimeout(timeOutTimer);
                    timeOutTimer = null;
                }
                if (response && response.data) {
                    res(response.data);
                }
                else {
                    res({ error: 'error: no-data', response });
                }
                subscribs.delete(url);
            });
            reFetch();
        });
    });
    ws.addEventListener('message', msg => {
        let res;
        try {
            res = JSON.parse(msg.data);
            subscribs.get(res.url)(res);
        }
        catch (err) {
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
