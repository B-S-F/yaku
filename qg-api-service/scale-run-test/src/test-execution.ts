import {
  ApiClient,
  QueryOptions,
  Run,
  RunPaginated,
} from '@B-S-F/yaku-client-lib'
import { randomUUID } from 'crypto'
import path from 'path'
import { setTimeout } from 'timers/promises'

export default async function executeTest(
  baseUrl: string,
  token: string,
  namespaceId: number,
  rounds: number
): Promise<void> {
  try {
    const client = new ApiClient({ baseUrl, token })
    const uuid = randomUUID()

    const qgConfig1 = await client.createConfigWithFiles(
      namespaceId,
      `test-qgas-${uuid}`,
      'Test schema for scale test',
      [
        {
          filename: 'qg-config.yaml',
          filepath: path.join('config', 'qg-config1.yaml'),
        },
      ]
    )
    console.log(`Created config with id ${qgConfig1.id}`)
    const qgConfig2 = await client.createConfigWithFiles(
      namespaceId,
      `test-qgas-${uuid}`,
      'Test schema for scale test',
      [
        {
          filename: 'qg-config.yaml',
          filepath: path.join('config', 'qg-config2.yaml'),
        },
      ]
    )
    console.log(`Created config with id ${qgConfig2.id}`)

    const promises: Array<Promise<Run>> = []
    for (let i = 0; i < rounds / 2; i++) {
      promises.push(
        client.startRun(namespaceId, qgConfig1.id, {}).then((run) => {
          console.log(`Created run ${run.id}`)
          return run
        })
      )
      promises.push(
        client.startRun(namespaceId, qgConfig2.id, {}).then((run) => {
          console.log(`Created run ${run.id}`)
          return run
        })
      )
    }
    const results = (await Promise.all(promises)).map((run) => run.id)

    await waitForTestToFinish(client, namespaceId, rounds)

    let succeeded = 0
    let longest = 0.0
    let shortest = 10000.0
    let total = 0.0
    for (const id of results) {
      let run: Run
      try {
        run = await client.getRun(namespaceId, id)
      } catch (err) {
        const { data, ...relevant } = err as any
        relevant.message = err instanceof Error ? err.message : ''
        console.error(JSON.stringify(relevant, null, 2))
        break
      }
      let durationAppendix = ''
      if (run.status === 'completed') {
        const duration = calculateDuration(run)
        if (!Number.isNaN(duration)) {
          longest = duration > longest ? duration : longest
          shortest = duration < shortest ? duration : shortest
          total += duration
          durationAppendix = ` -- Duration: ${duration} sec`
          succeeded++
        } else {
          durationAppendix = ' -- Endtime is not defined!'
        }
      }
      console.log(`Run: ${id} --  Result: ${run.status}${durationAppendix}`)
      if (run.status !== 'completed') {
        console.log(JSON.stringify(run, null, 2))
      }
      try {
        await client.deleteRun(namespaceId, run.id)
      } catch (err) {
        console.error(`Could not delete run with id ${run.id}`)
      }
    }
    console.log(
      `${succeeded} of ${results.length} runs (${
        (succeeded * 100.0) / results.length
      }%) succeeded`
    )
    console.log(`Average runtime of a run was ${total / succeeded} sec`)
    console.log(`Longest runtime of a run was ${longest} sec`)
    console.log(`Shortest runtime of a run was ${shortest} sec`)
    try {
      await client.deleteConfig(namespaceId, qgConfig2.id)
    } catch (err) {
      console.error(`Could not delete config ${qgConfig2.id}`)
    }
    try {
      await client.deleteConfig(namespaceId, qgConfig1.id)
    } catch (err) {
      console.error(`Could not delete config ${qgConfig1.id}`)
    }
  } catch (err) {
    const { data, ...relevant } = err as any
    relevant.message = err instanceof Error ? err.message : ''
    console.error(JSON.stringify(relevant, null, 2))
  }
}

async function waitForTestToFinish(
  client: ApiClient,
  namespaceId: number,
  rounds: number
): Promise<void> {
  const window = rounds > 50 ? 50 : rounds

  for (;;) {
    await setTimeout(60000)
    console.log('Check runs')

    try {
      const runsOfWindow: RunPaginated = await client.listRuns(
        namespaceId,
        new QueryOptions(1, window, [''], [[]], '', false)
      )
      const finished = runsOfWindow.data.filter(
        (run) => run.status === 'running'
      ).length
      console.log(
        `${finished} of ${window} runs still active in control window`
      )
      if (finished === 0) {
        return
      }
    } catch (err) {
      const { data, ...relevant } = err as any
      relevant.message = err instanceof Error ? err.message : ''
      console.error(JSON.stringify(relevant, null, 2))
    }
  }
}

function calculateDuration(run: Run): number {
  const startTime = new Date(run.creationTime)
  if (run.completionTime) {
    const endTime = new Date(run.completionTime)
    return (endTime.getTime() - startTime.getTime()) / 1000.0
  }
  return Number.NaN
}
