interface IWS extends WebSocket {
    /** 推送一个消息，等待回调用 */
    fetch: (url: string, data?: any) => Promise<any>;
    /** 创建一个监听 */
    on: (url: string, handle: (data: any) => any) => () => any;
    /** 推送一个消息，不等待回调用 */
    push: (url: string, data: any) => any;
}
/** 创建一个会自动管理重连的ws, 每当客户端主动发起消息，如果未链接ws，会主动重连 */
export declare const createClientWS: (wsURL: string, fetchTimeOut?: number) => IWS;
export {};
