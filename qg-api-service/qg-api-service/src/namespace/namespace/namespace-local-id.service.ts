import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NamespaceMemberSequence } from './namespace-member-sequence.entity'

@Injectable()
export class NamespaceSequenceConfig {
  constructor(readonly databaseType: string) {}
}

@Injectable()
export class NamespaceLocalIdService {
  private readonly queues: { [queueName: string]: (() => Promise<void>)[] } = {}

  constructor(
    @Inject(NamespaceSequenceConfig) readonly config: NamespaceSequenceConfig,
    @InjectRepository(NamespaceMemberSequence)
    private readonly idRepository: Repository<NamespaceMemberSequence>
  ) {}

  async nextId(entityName: string, namespaceId: number): Promise<number> {
    return await this.queueTask(`${entityName}-${namespaceId}`, async () => {
      if (this.config.databaseType === 'postgres') {
        const newIdResult = await this.idRepository.query(
          'update namespace_member_sequence set "lastId" = "lastId" + 1 where "namespaceId" = $1 and "entityName" = $2 returning "lastId"',
          [namespaceId, entityName]
        )
        // newIdResult is an array, which contains two elements, an array of return values and the number of items in the return value arrays
        // We can expect always to get exactly one element or the database is corrupt, which motivates a 500 return value.
        // Since we ask for the only element, this is at index [0][0]. The result object has only one property as requested named 'lastId'
        const newId = newIdResult[0][0]['lastId']
        return newId as number
      } else {
        // For other databases, these are still two calls which need to be synchronized.
        // Therefore, no scale up by providing multiple service instances is possible and no database clustering to prevent reading the wrong value
        const sequence = await this.idRepository.findOneBy({
          namespace: { id: namespaceId },
          entityName,
        })
        sequence.lastId++
        await this.idRepository.update({ id: sequence.id }, sequence)
        return sequence.lastId
      }
    })
  }

  async initializeIdCreation(
    entityName: string,
    namespaceId: number
  ): Promise<void> {
    const sequence = {
      namespace: { id: namespaceId },
      entityName,
      lastId: 0,
    }
    await this.idRepository.insert(sequence)
  }

  /**
   * Queues tasks in queues. Tasks in the same queue are executed sequentially
   * @param queueName name of the queue
   * @param f async task to run
   * @returns result of the task
   */
  private async queueTask(
    queueName: string,
    f: () => Promise<number>
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.queues[queueName]) {
        this.queues[queueName] = []
      }
      const queue = this.queues[queueName]

      queue.push(async () => {
        try {
          resolve(await f())
        } catch (e) {
          reject(e)
        }

        queueMicrotask(() => {
          queue.shift()
          // execute next task in queue if any
          if (queue.length > 0) queue[0]()
        })
      })
      // start queue if new
      if (queue.length === 1) {
        queue[0]()
      }
    })
  }
}
