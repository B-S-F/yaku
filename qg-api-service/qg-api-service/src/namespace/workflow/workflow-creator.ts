import { AssertionError } from 'assert'
import crypto from 'crypto'
import * as path from 'path'
import { parse } from 'yaml'

export type SupportedVersion = 'v1' | 'v2'
export type Version = SupportedVersion | 'v0'

type Format<T extends SupportedVersion> = {
  version: T
  execCall: string
  evidencePath: string
  resultPath: string
  // eslint-disable-next-line no-unused-vars
  singleCheck: (_c: CheckIdentifier) => string
}

export const supportedFormats: { [key in SupportedVersion]: Format<key> } = {
  ['v1']: {
    version: 'v1',
    execCall: 'onyx exec . --strict',
    evidencePath: '/home/qguser/mnt/evidence.zip',
    resultPath: '/home/qguser/mnt/qg-result.yaml',
    singleCheck: (c) => {
      return ` -c ${c.chapter}_${c.requirement}_${c.check}`
    },
  },
  ['v2']: {
    version: 'v2',
    execCall: 'onyx exec . --strict',
    evidencePath: '/home/qguser/mnt/evidence.zip',
    resultPath: '/home/qguser/mnt/qg-result.yaml',
    singleCheck: (c) => {
      return ` -c ${c.chapter}_${c.requirement}_${c.check}`
    },
  },
}

export type EnvList = {
  [key: string]: string
}

export type ConfigList = {
  [filename: string]: string
}

export type CheckIdentifier = {
  chapter: string
  requirement: string
  check: string
}

export function newWorkflow(): WorkflowCreator {
  return new WorkflowCreator()
}

export class WorkflowCreator {
  private workflow: any
  private environments: EnvList = {}
  private configs: ConfigList = {}
  private documentedEnvs: EnvList = {}
  private format: Format<SupportedVersion>
  private singleCheck = ''

  constructor() {
    this.workflow = {
      Workflow: {
        metadata: {
          generateName: 'qg-run-',
        },
        spec: {
          entrypoint: 'run',
          securityContext: {
            runAsUser: 1001,
            fsGroup: 1000,
          },
          imagePullSecrets: [],
          templates: [
            {
              name: 'autopilot',
              script: {},
              inputs: {
                artifacts: [],
              },
              outputs: {
                artifacts: [],
              },
              activeDeadlineSeconds: 30 * 60, // 30 minutes timeout for workflow
            },
            {
              name: 'run',
              dag: {
                tasks: [
                  {
                    name: 'cli',
                    template: 'autopilot',
                  },
                ],
              },
            },
          ],
        },
      },
    }
  }

  // Always call first after creation to determine the config format needed to specify the workflow
  setConfigFiles(files: ConfigList, singleCheck?: CheckIdentifier): this {
    const qgConfig = files['qg-config.yaml']
    if (!qgConfig) {
      throw new AssertionError({
        message: 'No qg-config.yaml defined for config',
      })
    }
    this.configs = files
    this.determineConfigVersion(qgConfig)

    if (singleCheck) {
      this.singleCheck = this.format.singleCheck(singleCheck)
    }

    return this
  }

  private determineConfigVersion(configFile: string) {
    const configContent = parse(configFile)
    switch (configContent.metadata?.version) {
      case 'v1':
        this.format = supportedFormats['v1']
        break
      case 'v2':
        this.format = supportedFormats['v2']
        break
      default:
        throw new AssertionError({ message: 'Format Error: Unknown format' })
    }
  }

  setCloudType(
    inPrivateCloud: boolean,
    proxy?: string,
    noProxyOn?: string,
    pullSecretName?: string
  ): this {
    if (inPrivateCloud) {
      this.workflow.Workflow.spec.imagePullSecrets.push({
        name: pullSecretName,
      })
      const envs: EnvList = {
        http_proxy: proxy,
        https_proxy: proxy,
        HTTP_PROXY: proxy,
        HTTPS_PROXY: proxy,
        no_proxy: noProxyOn,
        NO_PROXY: noProxyOn,
        REQUESTS_CA_BUNDLE: '/etc/ssl/certs/ca-certificates.crt',
        NODE_EXTRA_CA_CERTS: '/etc/ssl/certs/ca-certificates.crt',
        SSL_CERT_FILE: '/etc/ssl/certs/BOSCH-CA-DE_pem.pem',
        HTTPLIB2_CA_CERTS: '/etc/ssl/certs/ca-certificates.crt',
      }
      this.environments = { ...this.environments, ...envs }
      this.documentedEnvs = { ...this.documentedEnvs, ...envs }
    }
    return this
  }

  setOverwrittenVariables(overwritten: EnvList): this {
    this.configs['.vars'] = JSON.stringify(overwritten, null, 2)
    return this
  }

  setSecrets(secrets: EnvList): this {
    this.configs['.secrets'] = JSON.stringify(secrets, null, 2)
    return this
  }

  addExecutionInformation(
    image: string,
    versions: { [_key in SupportedVersion]: string },
    pullPolicy = 'Always'
  ): this {
    const execCall = this.format.execCall
    this.workflow.Workflow.spec.templates[0].script = {
      image: `${image}:${versions[this.format.version]}`,
      imagePullPolicy: pullPolicy,
      command: ['bash'],
      env: [],
      source: execCall + this.singleCheck,
    }
    return this
  }

  addOutputs(storagePath: string): this {
    this.workflow.Workflow.spec.templates[0].outputs.artifacts.push({
      name: 'evidencezip',
      path: this.format.evidencePath,
      s3: { key: path.join(storagePath, 'evidences.zip') },
      archive: {
        none: {},
      },
    })
    this.workflow.Workflow.spec.templates[0].outputs.artifacts.push({
      name: 'qgresultyaml',
      path: this.format.resultPath,
      s3: { key: path.join(storagePath, 'qg-result.yaml') },
      archive: {
        none: {},
      },
    })
    return this
  }

  addEnvironmentSection(): this {
    for (const [key, value] of Object.entries(this.environments)) {
      this.workflow.Workflow.spec.templates[0].script.env.push({
        name: key,
        value: value,
      })
    }
    this.configs['environment-variables.json'] = JSON.stringify(
      this.documentedEnvs,
      null,
      2
    )
    return this
  }

  addInputs(storagePath: string): this {
    for (const filename of Object.keys(this.configs)) {
      this.workflow.Workflow.spec.templates[0].inputs.artifacts.push({
        // NOTE: name must be unique but is not related to the actual file name
        name: crypto.randomUUID(),
        path: `/home/qguser/mnt/${filename}`,
        s3: { key: path.join(storagePath, filename) },
      })
    }
    return this
  }

  create(): { configs: ConfigList; workflow: string } {
    return { configs: this.configs, workflow: JSON.stringify(this.workflow) }
  }
}
