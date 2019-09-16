# uWebSockets 的扩展

众所周知，每次短小的请求，大部分时间开销都在握手上；使用 webSockets 可以有效减少每次握手时间，但是它不如 http 使用直观。
此库的目的是 让 ws 和 http 请求一样直观，为了更好的兼容，此库仅是在 uWebSockets 基础上进行扩展。

## server:

将每个 webSockets 消息抽象成路由，进行处理

```js
const { App } = require('@nuage/uws'); // @nuage/uws 仅是 uWebSockets 的nodejs发布版本
const { bindUWS } = require('uws-extends/lib/server-ws');

const uws = bindUWS(App());

uws.on('/hello', async data => {
  console.log(data); // {hello:'world'}

  return { name: 'dog', age: 5 };
});

uws.listen(4000, listener => {
  if (listener) {
    // tslint:disable-next-line
    console.log(`uws runing: ws://0.0.0.0:5000`);
  }
});
```

## client

客户端每次发起请求时，会检查是否断链，如果断开连接，会重新连接 webSockets；如果客户端超过 30 秒未和服务端通讯，客户端会主动断开连接。

客户端请求之后，会模拟 http 的请求回调用，达到和编写 http 类似的行为

```js
import { createClientWS } from 'uws-extends/lib/client-ws';

const cws = createClientWS('ws://127.0.0.1:4010');

const fetchSometing = async () => {
  const res = await cws.fetch(`/hello`, { hello: 'world' });

  console.log(res); // { name: 'dog', age: 5 };
};

fetchSometing();
```
