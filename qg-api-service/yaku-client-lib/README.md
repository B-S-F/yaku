# yaku-client-lib

### Description

The `yaku-client-lib` is a client library used for the yaku-cli tool, but being published as a separate package, it can be also used on its own. It provides an `ApiClient` class which receives a custom `Yaku Config`, containing the following:

- baseUrl
- token
- agent

The `ApiClient` class allows users to interact with Yaku entities such as `Namespace`, `Config`, `Run`, `Secret`, `Token`, or `Findings`.

One of the key features of this library is its ability to work with a custom HTTP or HTTPS agent, allowing users to customize the underlying network behavior for all requests made to the specified `baseUrl`.

### Installation

`npm install yaku-client-lib`

### How to use

```ts
import { ApiClient } from '@B-S-F/yaku-client-lib'
import { Dispatcher } from 'undici'

// Create a custom HTTP/HTTPS agent
let agent: Dispatcher = new Dispatcher()

// Initialize the ApiClient with the Yaku Config
const client = new ApiClient({
  baseUrl: 'baseUrl',
  token: 'token',
  agent: agent,
})
```

Note: [undici](https://www.npmjs.com/package/undici) library is utilized for the creation of `Dispatcher` instance, representing a placeholder for either an `Agent` or a `ProxyAgent`.

---
