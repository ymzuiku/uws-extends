import { TemplatedApp, WebSocket } from '@nuage/uws';
export interface IUWS extends TemplatedApp {
    on(url: string, handle: (data: any, ws: WebSocket, isBinary: boolean) => any): void;
}
export declare const bindUWS: (uws: TemplatedApp) => IUWS;
