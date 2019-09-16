import { HttpRequest, HttpResponse, RecognizedString, TemplatedApp } from '@nuage/uws';
export interface IHttpRequest extends HttpRequest {
    GET_BODY(): Promise<any>;
    GET_PAEAMS(len: number): string[];
    GET_QUERY(): any;
}
export interface IHttpResponse extends HttpResponse {
    SEND(obj: any): void;
}
export interface ITemplatedApp extends TemplatedApp {
    AFTER?(url: RecognizedString, res: IHttpResponse, req: IHttpRequest, data: any): any;
    /** Registers an HTTP handler matching specified URL pattern on any HTTP method. */
    ANY(pattern: RecognizedString, handler: (res: IHttpResponse, req: IHttpRequest) => any): ITemplatedApp;
    BEFORE?(url: RecognizedString, res: IHttpResponse, req: IHttpRequest): any;
    /** Registers an HTTP DELETE handler matching specified URL pattern. */
    DEL(pattern: RecognizedString, handler: (res: IHttpResponse, req: IHttpRequest) => any): ITemplatedApp;
    /** Registers an HTTP GET handler matching specified URL pattern. */
    GET(pattern: RecognizedString, handler: (res: IHttpResponse, req: IHttpRequest) => any): ITemplatedApp;
    /** Registers an HTTP OPTIONS handler matching specified URL pattern. */
    OPTIONS(pattern: RecognizedString, handler: (res: IHttpResponse, req: IHttpRequest) => any): ITemplatedApp;
    /** Registers an HTTP PATCH handler matching specified URL pattern. */
    PATCH(pattern: RecognizedString, handler: (res: IHttpResponse, req: IHttpRequest) => any): ITemplatedApp;
    /** Registers an HTTP POST handler matching specified URL pattern. */
    POST(pattern: RecognizedString, handler: (res: IHttpResponse, req: IHttpRequest) => any): TemplatedApp;
    /** Registers an HTTP PUT handler matching specified URL pattern. */
    PUT(pattern: RecognizedString, handler: (res: IHttpResponse, req: IHttpRequest) => any): ITemplatedApp;
    /** Registers an HTTP CONNECT handler matching specified URL pattern. */
    TRACE(pattern: RecognizedString, handler: (res: IHttpResponse, req: IHttpRequest) => any): ITemplatedApp;
}
export declare const send: (res: any, obj: any) => void;
export declare const query: (req: HttpRequest) => any;
export declare const body: (res: HttpResponse) => Promise<any>;
export declare const bindApp: (app: TemplatedApp) => ITemplatedApp;
