import {
  DefaultBodyType,
  PathParams,
  RequestHandler,
  ResponseComposition,
  rest,
  RestContext,
  RestRequest,
} from 'msw'

export const ARGO_SERVER = 'http://argo-local:23456'
export const ARGO_NAMESPACE = 'argo-int'
export const ARGO_WORKFLOW_NAME = 'argo-test'
export const ARGO_WORKFLOW_UUID = '123-asdf-234'

export const MINIO_SERVER = 'https://minio-int:9000'
export const MINIO_BUCKET = 'minio-int'

const argoPost: RequestHandler = rest.post(
  `${ARGO_SERVER}/api/v1/workflows/${ARGO_NAMESPACE}`,
  (
    req: RestRequest<never, PathParams<string>>,
    res: ResponseComposition<DefaultBodyType>,
    ctx: RestContext
  ) => {
    return res(
      ctx.json({
        status: 200,
        metadata: {
          name: ARGO_WORKFLOW_NAME,
          namespace: ARGO_NAMESPACE,
          uid: ARGO_WORKFLOW_UUID,
          creationTimestamp: Date.now(),
        },
      })
    )
  }
)

const argoWorkflowStatus: RequestHandler = rest.get(
  `${ARGO_SERVER}/api/v1/workflows/${ARGO_NAMESPACE}/${ARGO_WORKFLOW_NAME}`,
  (
    req: RestRequest<never, PathParams<string>>,
    res: ResponseComposition<DefaultBodyType>,
    ctx: RestContext
  ) => {
    return res(
      ctx.json({
        status: {
          phase: 'Succeeded',
          finishedAt: Date.now(),
        },
        metadata: {
          name: ARGO_WORKFLOW_NAME,
          namespace: ARGO_NAMESPACE,
          uuid: ARGO_WORKFLOW_UUID,
          creationTimestamp: Date.now(),
        },
      })
    )
  }
)

const argoWorkflowLogs: RequestHandler = rest.get(
  `${ARGO_SERVER}/api/v1/workflows/${ARGO_NAMESPACE}/${ARGO_WORKFLOW_NAME}/log`,
  (
    req: RestRequest<never, PathParams<string>>,
    res: ResponseComposition<DefaultBodyType>,
    ctx: RestContext
  ) => {
    return res(ctx.text('Inconsequential logs'))
  }
)

export const handlers = [argoPost, argoWorkflowStatus, argoWorkflowLogs]
