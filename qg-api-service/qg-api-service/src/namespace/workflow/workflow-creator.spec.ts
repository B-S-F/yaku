import * as path from 'path'
import { ConfigEntity, FileEntity } from '../configs/config.entity'
import { CheckIdentifier, newWorkflow } from './workflow-creator'

const baseWorkflow = {
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

function createTestConfig(): ConfigEntity {
  const config = new ConfigEntity()
  config.namespace = { id: 100, name: '' }
  config.id = 15
  config.name = 'Strange name'
  config.files = []
  const file1 = new FileEntity()
  file1.config = config
  file1.filename = 'qg-config.yaml'
  file1.id = 100
  config.files.push(file1)
  const file2 = new FileEntity()
  file2.config = config
  file2.filename = 'additional-config.yaml'
  file2.id = 101
  return config
}

const v1configFiles = {
  'qg-config.yaml':
    'header:\n  name: Test\n  version: "1.1"\nmetadata:\n  version: "v1"\n',
  'additional-config.yaml': 'Cool Additional Config',
}

const v0configFiles = {
  'qg-config.yaml': 'header:\n  name: Test\n  version: "1.1"\n',
  'additional-config.yaml': 'Cool Additional Config',
}

const proxy = 'http://localhost:3128'
const noProxy = 'bosch.com'

const standardEnvs = {
  http_proxy: proxy,
  https_proxy: proxy,
  HTTP_PROXY: proxy,
  HTTPS_PROXY: proxy,
  no_proxy: noProxy,
  NO_PROXY: noProxy,
  REQUESTS_CA_BUNDLE: '/etc/ssl/certs/ca-certificates.crt',
  NODE_EXTRA_CA_CERTS: '/etc/ssl/certs/ca-certificates.crt',
  SSL_CERT_FILE: '/etc/ssl/certs/BOSCH-CA-DE_pem.pem',
  HTTPLIB2_CA_CERTS: '/etc/ssl/certs/ca-certificates.crt',
}

const stdSecrets = {
  SECRET1: 'Hidden Value',
  SECRET2: 'Secret Value',
}

const stdVars = {
  KEY1: 'VALUE1',
  KEY2: 'VALUE2',
}

describe('Constructor', () => {
  it('should create a new WorkflowCreator with the base workflow', () => {
    const creator = newWorkflow()

    expect(creator['workflow']).toEqual(baseWorkflow)
    expect(creator['environments']).toEqual({})
    expect(creator['configs']).toEqual({})
    expect(creator['documentedEnvs']).toEqual({})
    expect(creator['format']).toBeUndefined()
  })
})

describe('Set config', () => {
  it('should set a config in v1 format', () => {
    const creator = newWorkflow().setConfigFiles(v1configFiles)

    expect(creator['workflow']).toEqual(baseWorkflow)
    expect(creator['environments']).toEqual({})
    expect(creator['documentedEnvs']).toEqual({})

    expect(creator['configs']).toEqual(v1configFiles)
    expect(creator['format']['version']).toBe('v1')
    expect(creator['singleCheck']).toBe('')
  })

  it('should throw when v0 format is used', () => {
    expect(() => {
      newWorkflow().setConfigFiles(v0configFiles)
    }).toThrow('Format Error: Unknown format')
  })

  it('should support v2 format', () => {
    const creator = newWorkflow().setConfigFiles({
      'qg-config.yaml':
        'header:\n  name: Test\n  version: "1.1"\nmetadata:\n  version: "v2"\n',
    })

    expect(creator['workflow']).toEqual(baseWorkflow)
    expect(creator['environments']).toEqual({})
    expect(creator['documentedEnvs']).toEqual({})

    expect(creator['configs']).toEqual({
      'qg-config.yaml':
        'header:\n  name: Test\n  version: "1.1"\nmetadata:\n  version: "v2"\n',
    })
    expect(creator['format']['version']).toBe('v2')
  })

  it('should allow to define a single check for v1 format', () => {
    const creator = newWorkflow().setConfigFiles(v1configFiles, {
      chapter: '1',
      requirement: '1',
      check: '1',
    })

    expect(creator['workflow']).toEqual(baseWorkflow)
    expect(creator['environments']).toEqual({})
    expect(creator['documentedEnvs']).toEqual({})

    expect(creator['configs']).toEqual(v1configFiles)
    expect(creator['format']['version']).toBe('v1')
    expect(creator['singleCheck']).toBe(' -c 1_1_1')
  })

  it('should throw an error if the config does not contain a config file', () => {
    const config = new ConfigEntity()
    config.namespace = { id: 100, name: '' }
    config.id = 333
    config.name = 'Incomplete'
    config.files = []

    expect(() =>
      newWorkflow().setConfigFiles({ 'otherConfig.yaml': 'bla' })
    ).toThrow()
  })

  it('should throw an error if the format in the config is not known', () => {
    expect(() =>
      newWorkflow().setConfigFiles({
        'qg-config.yaml':
          'header:\n  name: Test\n  version: "1.1"\nmetadata:\n  version: "1.0"\n',
      })
    ).toThrow()
  })
})

describe('Set cloud type', () => {
  const prepareWorkflow = () => {
    return newWorkflow().setConfigFiles(v1configFiles)
  }

  it('should do nothing for public clouds', () => {
    const creator = prepareWorkflow().setCloudType(false)

    expect(creator['workflow']).toEqual(baseWorkflow)
    expect(creator['environments']).toEqual({})
    expect(creator['documentedEnvs']).toEqual({})
    expect(creator['configs']).toEqual(v1configFiles)
    expect(creator['format']['version']).toBe('v1')
  })

  it('should set some properties for a private cloud', () => {
    const creator = prepareWorkflow().setCloudType(
      true,
      proxy,
      noProxy,
      'secretName'
    )

    expect(creator['workflow']).not.toEqual(baseWorkflow)
    expect(creator['workflow'].Workflow.spec.imagePullSecrets[0].name).toBe(
      'secretName'
    )
    expect(creator['environments']).toEqual({ ...standardEnvs })
    expect(creator['documentedEnvs']).toEqual({ ...standardEnvs })
    expect(creator['configs']).toEqual(v1configFiles)
    expect(creator['format']['version']).toBe('v1')
  })
})

describe('Set external environment variables', () => {
  const prepareWorkflow = (priv: boolean) => {
    const configs = v1configFiles
    return newWorkflow()
      .setConfigFiles(configs)
      .setCloudType(priv, proxy, noProxy, 'dummy')
  }

  it.each([
    [
      'private cloud, format v1',
      true,
      standardEnvs,
      standardEnvs,
      stdSecrets,
      stdVars,
    ],
    ['public cloud, format v1', false, {}, {}, stdSecrets, stdVars],
  ])('test case %s', (name, priv, expEnvs, expDocs, expSec, expVar) => {
    const creator = prepareWorkflow(priv)
      .setOverwrittenVariables(stdVars)
      .setSecrets(stdSecrets)

    expect(creator['environments']).toEqual({ ...expEnvs })
    expect(creator['documentedEnvs']).toEqual({ ...expDocs })
    if (expSec) {
      expect(JSON.parse(creator['configs']['.secrets'])).toEqual(expSec)
    } else {
      expect(creator['configs']['.secrets']).toBeUndefined()
    }
    if (expVar) {
      expect(JSON.parse(creator['configs']['.vars'])).toEqual(expVar)
    } else {
      expect(creator['configs']['.vars']).toBeUndefined()
    }
  })

  it.each([
    [
      'var override standard, secret override standard and var, format v1',
      { ...stdVars, no_proxy: 'somedomain.com' },
      {
        ...stdSecrets,
        KEY1: 'Secret secret',
        NO_PROXY: 'somesecretdomain.com',
      },
      standardEnvs,
      standardEnvs,
      {
        ...stdSecrets,
        KEY1: 'Secret secret',
        NO_PROXY: 'somesecretdomain.com',
      },
      { ...stdVars, no_proxy: 'somedomain.com' },
    ],
  ])(
    'should cover overriding case for %s',
    (name, vars, secrets, expEnvs, expDocs, expSec, expVar) => {
      const creator = prepareWorkflow(true)
        .setOverwrittenVariables(vars)
        .setSecrets(secrets)

      expect(creator['environments']).toEqual({ ...expEnvs })
      expect(creator['documentedEnvs']).toEqual({ ...expDocs })
      if (expSec) {
        expect(JSON.parse(creator['configs']['.secrets'])).toEqual(expSec)
      } else {
        expect(creator['configs']['.secrets']).toBeUndefined()
      }
      if (expVar) {
        expect(JSON.parse(creator['configs']['.vars'])).toEqual(expVar)
      } else {
        expect(creator['configs']['.vars']).toBeUndefined()
      }
    }
  )

  it('should handle multiline variable content right', () => {
    const multiLineString = 'line1\nline2\nline3'
    const expectedMLString = 'line1\\nline2\\nline3'

    const creator = prepareWorkflow(false)
      .setOverwrittenVariables({ VAR1: multiLineString })
      .setSecrets({ SECRET1: multiLineString })

    expect(creator['configs']['.vars']).toContain(expectedMLString)
    expect(creator['configs']['.secrets']).toContain(expectedMLString)
  })
})

describe('Add some version dependent stuff', () => {
  const prepareWorkflow = (singleCheck?: CheckIdentifier) => {
    const configs = v1configFiles
    return newWorkflow()
      .setConfigFiles(configs, singleCheck)
      .setCloudType(false)
  }

  it.each([
    ['onyx exec . --strict', undefined, 'latest'],
    [
      'onyx exec . --strict -c 1_1_1',
      { chapter: '1', requirement: '1', check: '1' },
      'latest',
    ],
  ])(
    'should set execution environment for version %s',
    (execCall, singleCheck, version) => {
      const creator = prepareWorkflow(singleCheck).addExecutionInformation(
        'workflow-image',
        { v1: 'latest', v2: 'latest' },
        'Never'
      )

      const workflow = creator['workflow']
      const expected = {
        image: `workflow-image:${version}`,
        imagePullPolicy: 'Never',
        command: ['bash'],
        env: [],
        source: execCall,
      }
      expect(workflow.Workflow.spec.templates[0].script).toEqual(expected)
    }
  )

  it.each([
    ['/home/qguser/mnt/evidence.zip', '/home/qguser/mnt/qg-result.yaml'],
  ])(
    'should set the outputs according to the version %s',
    (evPath, resPath) => {
      const storagePath = 'tmp-something'
      const creator = prepareWorkflow().addOutputs(storagePath)

      const workflow = creator['workflow']
      const expectedEv = {
        name: 'evidencezip',
        path: evPath,
        s3: { key: path.join(storagePath, 'evidences.zip') },
        archive: {
          none: {},
        },
      }
      const expectedRes = {
        name: 'qgresultyaml',
        path: resPath,
        s3: { key: path.join(storagePath, 'qg-result.yaml') },
        archive: {
          none: {},
        },
      }
      expect(
        workflow.Workflow.spec.templates[0].outputs.artifacts
      ).toContainEqual(expectedEv)
      expect(
        workflow.Workflow.spec.templates[0].outputs.artifacts
      ).toContainEqual(expectedRes)
    }
  )
})

describe('Add created envs and inputs', () => {
  const prepareWorkflow = () => {
    const configs = v1configFiles
    return newWorkflow()
      .setConfigFiles(configs)
      .setCloudType(true, proxy, noProxy, 'dummy')
      .setOverwrittenVariables(stdVars)
      .setSecrets(stdSecrets)
      .addExecutionInformation('executor', { v1: 'latest', v2: 'latest' })
  }

  it.each([[{ ...standardEnvs }, { ...standardEnvs }]])(
    'should add the environment variables for format %s',
    (expEnv, expFile) => {
      const creator = prepareWorkflow().addEnvironmentSection()
      const envs = creator['workflow'].Workflow.spec.templates[0].script.env
      expect(envs.length).toBe(Object.keys(expEnv).length)
      for (const key of Object.keys(expEnv)) {
        const elem = envs.filter((e) => e.name === key)[0]
        expect(elem.value).toEqual(expEnv[key])
      }
      expect(
        JSON.parse(creator['configs']['environment-variables.json'])
      ).toEqual(expFile)
    }
  )

  it.each([
    [
      'v1',
      [
        ...Object.keys(v1configFiles),
        '.vars',
        '.secrets',
        'environment-variables.json',
      ],
    ],
  ])(
    'should add all inputs for the workflow for version %s',
    (format, files) => {
      const storagePath = 'tmp-storage'
      const creator = prepareWorkflow()
        .addEnvironmentSection()
        .addInputs(storagePath)

      const artifacts =
        creator['workflow'].Workflow.spec.templates[0].inputs.artifacts
      expect(artifacts.length).toBe(files.length)
      for (const name of files) {
        const entry = artifacts.filter((elem) => elem.path.endsWith(name))[0]
        expect(entry).toBeDefined()
        expect(entry.path).toEqual(`/home/qguser/mnt/${name}`)
        expect(entry.s3.key).toEqual(path.join(storagePath, name))
        expect(entry.name).toBeTruthy()
      }
    }
  )
})

describe('Workflow execution', () => {
  it('should call the workflow starter with a json representation of the workflow', () => {
    const creator = newWorkflow()

    const { configs, workflow } = creator.create()
    expect(JSON.parse(workflow)).toEqual(creator['workflow'])
    expect(configs).toEqual({})
  })
})
