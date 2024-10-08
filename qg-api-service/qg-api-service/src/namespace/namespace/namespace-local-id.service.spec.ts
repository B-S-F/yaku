import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { testingNamespaceId } from '@B-S-F/api-commons-lib'
import {
  NamespaceLocalIdService,
  NamespaceSequenceConfig,
} from './namespace-local-id.service'
import { NamespaceMemberSequence } from './namespace-member-sequence.entity'

describe('NamespaceLocalIdService', () => {
  type Mutable<T> = {
    -readonly [k in keyof T]: T[k]
  }

  let service: NamespaceLocalIdService
  let repository: Repository<NamespaceMemberSequence>

  const entityName = 'CrashTestDummy'

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NamespaceLocalIdService,
        {
          provide: NamespaceSequenceConfig,
          useValue: new NamespaceSequenceConfig('postgres'),
        },
        {
          provide: getRepositoryToken(NamespaceMemberSequence),
          useValue: {
            insert: jest.fn(),
            query: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<NamespaceLocalIdService>(NamespaceLocalIdService)
    repository = module.get(getRepositoryToken(NamespaceMemberSequence))
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should initialize the database properly on request', async () => {
    await service.initializeIdCreation(entityName, testingNamespaceId)

    expect(repository.insert).toBeCalledTimes(1)
    expect(repository.insert).toBeCalledWith({
      namespace: { id: testingNamespaceId },
      entityName,
      lastId: 0,
    })
  })

  it('should create a new id on the postgres path', async () => {
    const querySpy = jest
      .spyOn(repository, 'query')
      .mockImplementation(async () => {
        return [[{ lastId: 10 }], 1]
      })

    const id = await service.nextId(entityName, testingNamespaceId)

    expect(id).toBe(10)
    expect(querySpy).toBeCalledTimes(1)
    expect(querySpy).toBeCalledWith(
      'update namespace_member_sequence set "lastId" = "lastId" + 1 where "namespaceId" = $1 and "entityName" = $2 returning "lastId"',
      [testingNamespaceId, entityName]
    )
  })

  it('should create a new id for other databases as well', async () => {
    const getSpy = jest
      .spyOn(repository, 'findOneBy')
      .mockImplementation(async () => {
        return {
          id: 45,
          namespace: { id: testingNamespaceId, name: 'anything', users: [] },
          entityName,
          lastId: 9,
        }
      })
    const mConfig = service.config as Mutable<NamespaceSequenceConfig>
    mConfig.databaseType = 'embedded_postgres'

    const id = await service.nextId(entityName, testingNamespaceId)

    expect(id).toBe(10)
    expect(getSpy).toBeCalledTimes(1)
    expect(getSpy).toBeCalledWith({
      namespace: { id: testingNamespaceId },
      entityName,
    })
    expect(repository.update).toBeCalledTimes(1)
    expect(repository.update).toBeCalledWith(
      { id: 45 },
      {
        id: 45,
        namespace: { id: testingNamespaceId, name: 'anything', users: [] },
        entityName,
        lastId: 10,
      }
    )
  })

  it('should create a sequence of numbers for a high amount of requests without duplications', async () => {
    let lastId = 0
    const querySpy = jest
      .spyOn(repository, 'query')
      .mockImplementation(async () => {
        const newId = lastId + 1
        await new Promise((resolve) => setTimeout(resolve, 1))
        lastId = newId
        return [[{ lastId }], 1]
      })

    const ids: number[] = []
    for (let index = 0; index < 1000; index++) {
      ids.push(await service.nextId(entityName, testingNamespaceId))
    }

    expect(querySpy).toBeCalledTimes(1000)
    for (let index = 1; index <= 1000; index++) {
      expect(ids).toContain(index)
    }
  })
})
