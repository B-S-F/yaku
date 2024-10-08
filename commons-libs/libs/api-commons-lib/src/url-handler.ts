import { Response } from 'express'
import { Inject, Injectable } from '@nestjs/common'

export class UrlHandler {
  private readonly protocol: string
  private readonly host: string
  private readonly pathParts: string[]

  /**
   * Takes the request send to an endpoint and retrieves the endpoint url used to
   * state the request.
   *
   * @param response The Response object of the endpoint call which contains the request
   */
  constructor(response: Response, protocol: string) {
    this.protocol = protocol
    this.host = response.req.headers.host
    this.pathParts = response.req.url.split('?')[0].split('/')
  }

  /**
   * Returns a use case specific url used in a response from an endpoint.
   * Could be the location header, but also the reference of an contained
   * object in a body or whenever a link releative to the endpoint url is
   * needed.
   *
   * @param appendix A part that needs to be added to the end of the created url.
   *                 The algorithm adds the appendix directly, so how the
   *                 appendix is separated from the rest has to be part of the
   *                 appendix.
   * @param numberOfPartsToRemove The number of url parts to be removed from
   *                              the end of the endpoint url, e.g. to get
   *                              rid of specific functional parts in the url.
   * @return A generated url that is relative to the endpoint url defined in the
   *         request object.
   */
  url(appendix: string = null, numberOfPartsToRemove = 0): string {
    if (numberOfPartsToRemove < 0) {
      throw new Error('Cannot remove a negative number of items from url')
    }
    let urlparts = this.pathParts
    if (numberOfPartsToRemove > 0) {
      urlparts = urlparts.slice(0, -1 * numberOfPartsToRemove)
    }
    const urlpath = urlparts.join('/')
    let url = `${this.protocol}://${this.host}${urlpath}`
    if (appendix) {
      url = `${url}${appendix}`
    }
    return url
  }
}

@Injectable()
export class UrlProtocolConfig {
  constructor(
    readonly serviceProtocol: string, // either 'https', 'http' or 'request'
  ) {}
}

@Injectable()
export class UrlHandlerFactory {
  constructor(
    @Inject(UrlProtocolConfig)
    private readonly protocolConfig: UrlProtocolConfig,
  ) {}

  getHandler(response: Response): UrlHandler {
    const protocol = this.determineProtocol(
      response.req.protocol,
      this.protocolConfig.serviceProtocol,
    )
    return new UrlHandler(response, protocol)
  }

  private determineProtocol(requestProtocol: string, configProtocol: string) {
    switch (configProtocol) {
      case 'https':
      case 'http':
        return configProtocol
      default:
        return requestProtocol
    }
  }
}
