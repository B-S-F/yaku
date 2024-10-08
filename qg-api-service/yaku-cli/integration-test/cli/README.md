# Mock Server Usage

Some commands directly call the API. For testing purposes, a mock server is created.

## Guide

1. For each specific test file that tests an API calling command, a mock servers has to be initialized.

```ts
const port: number = 8080
const serverHost: ServerHost = new ServerHost(
  'http',
  'localhost',
  String(port),
  '/api/v1'
)
const mockServerOptions = createMockServerResponse(port)
let mockServer: MockServer | undefined
```

2. The `createMockServerResponse` function from the previous step has to be created with the responses the server should have. Examples can be found under [fixtures](../fixtures/).

3. If multiple responses have to be tested on the same endpoint, they can be added in the fixture as an array. These will be taken in order for each call to the endpoint. (If the mockserver is not reset between tests).
