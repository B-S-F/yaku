import { createMockResponse, testingNamespaceId } from './test-services'
import { UrlHandler, UrlHandlerFactory, UrlProtocolConfig } from './url-handler'

describe('Url Handler', () => {
  let urlHandler: UrlHandler
  const appendix = '/my-appendix/xyz'
  const url = `/api/v1/namespaces/${testingNamespaceId}${appendix}`

  beforeEach(async () => {
    const factory = new UrlHandlerFactory(new UrlProtocolConfig('https'))
    const response = createMockResponse(url)
    urlHandler = factory.getHandler(response)
  })

  it('should retrieve the correct url from a response', () => {
    expect(urlHandler.url()).toBe(
      `https://localhost:3000/api/v1/namespaces/${testingNamespaceId}${appendix}`,
    )
  })

  it('should add an appendix to the delivered base', () => {
    const testappendix = '/yaattu'
    expect(urlHandler.url(testappendix)).toBe(
      `https://localhost:3000/api/v1/namespaces/${testingNamespaceId}${appendix}${testappendix}`,
    )
  })

  it('should remove parts without appending stuff', () => {
    expect(urlHandler.url('', 2)).toBe(
      `https://localhost:3000/api/v1/namespaces/${testingNamespaceId}`,
    )
  })

  it('should remove parts, even if undefined is given as appendix', () => {
    expect(urlHandler.url(undefined, 4)).toBe(`https://localhost:3000/api/v1`)
  })

  it('should remove parts even if null is given as appendix', () => {
    expect(urlHandler.url(null, 3)).toBe(
      `https://localhost:3000/api/v1/namespaces`,
    )
  })

  it('should remove parts and add an appendix', () => {
    const testappendix = '/yaattu'
    expect(urlHandler.url(testappendix, 2)).toBe(
      `https://localhost:3000/api/v1/namespaces/${testingNamespaceId}${testappendix}`,
    )
  })

  it('should accept 0 elements to remove like no parameter given', () => {
    expect(urlHandler.url(null, 0)).toBe(
      `https://localhost:3000/api/v1/namespaces/${testingNamespaceId}${appendix}`,
    )
  })

  it('should throw error if a negative number of parts should be removed', () => {
    expect(() => urlHandler.url(null, -1)).toThrow()
  })

  it('should also support "request" as factory parameter', () => {
    const factory = new UrlHandlerFactory({
      serviceProtocol: 'request',
    } as UrlProtocolConfig)
    const response = createMockResponse(url)
    urlHandler = factory.getHandler(response)
    expect(urlHandler.url()).toBe(
      `https://localhost:3000/api/v1/namespaces/${testingNamespaceId}${appendix}`,
    )
  })

  it('should also support "http" as factory parameter', () => {
    const factory = new UrlHandlerFactory({
      serviceProtocol: 'http',
    } as UrlProtocolConfig)
    const response = createMockResponse(url)
    urlHandler = factory.getHandler(response)
    expect(urlHandler.url()).toBe(
      `http://localhost:3000/api/v1/namespaces/${testingNamespaceId}${appendix}`,
    )
  })
})
