import { MockServerOptions } from '../../../../../integration-tests/src/util'

export function getAdoFixtures(port: number): MockServerOptions {
  const host = `https://localhost:${port}`

  const workItem1Url = '/adoApiOrg/adoApiProject/_apis/wit/workitems/1'
  const workItem2Url = '/adoApiOrg/adoApiProject/_apis/wit/workitems/2'
  const workItem3Url = '/adoApiOrg/adoApiProject/_apis/wit/workitems/3'
  const workItem4Url = '/adoApiOrg/adoApiProject/_apis/wit/workitems/4'

  return {
    port,
    https: true,
    responses: {
      [`/adoApiOrg/adoApiProject/_apis/wit/wiql`]: {
        post: {
          responseStatus: 200,
          responseBody: {
            workItems: [
              {
                id: 1,
                url: `${host}${workItem1Url}`,
              },
            ],
          },
        },
      },
      [workItem1Url]: {
        get: {
          responseStatus: 200,
          responseBody: {
            id: 1,
            url: workItem1Url,
            relations: [
              {
                url: `${host}${workItem2Url}`,
                attributes: {
                  name: 'Related',
                },
              },
              {
                url: `${host}${workItem3Url}`,
                attributes: {
                  name: 'Related',
                },
              },
              {
                url: `${host}${workItem4Url}`,
                attributes: {
                  name: 'Child',
                },
              },
            ],
            fields: {
              foo: 'fooW1',
              bar: 'barW1',
              state: 'stateW1',
              title: 'titleW1',
              some: 'value',
            },
          },
        },
      },
      [workItem2Url]: {
        get: {
          responseStatus: 200,
          responseBody: {
            id: 2,
            url: workItem2Url,
            relations: [
              {
                url: `${host}${workItem3Url}`,
                attributes: {
                  name: 'Related',
                },
              },
            ],
            fields: {
              Foo: 'fooW2',
              Bar: 'barW2',
              State: 'stateW2',
              Title: 'titleW2',
              some: 'value',
            },
          },
        },
      },
      [workItem3Url]: {
        get: {
          responseStatus: 200,
          responseBody: {
            id: 3,
            url: workItem3Url,
            relations: [],
            fields: {
              abcFoo: 'fooW3',
              abcBar: 'barW3',
              abcState: 'stateW3',
              abcTitle: 'titleW3',
              some: 'value',
            },
          },
        },
      },
      [workItem4Url]: {
        get: {
          responseStatus: 200,
          responseBody: {
            id: 4,
            url: workItem4Url,
            relations: [],
            fields: {
              foo: 'fooW4',
              bar: 'barW4',
              state: 'stateW4',
              title: 'titleW4',
              some: 'value',
            },
          },
        },
      },
    },
  }
}
