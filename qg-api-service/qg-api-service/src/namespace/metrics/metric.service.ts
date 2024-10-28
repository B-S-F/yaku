import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateMetricDTO } from './dto/createMetric.dto'
import { GetFindingsDTO } from './dto/getFindings.dto'
import { GetMetricDTO } from './dto/getMetric.dto'
import { UpdateFindingDTO } from './dto/updateFinding.dto'
import { Metric } from './entity/metric.entity'
import { StatusType } from '../findings/utils/enums/statusType.enum'
import { ServiceType } from './utils/enums/serviceType.enum'
import { Logger, PinoLogger, InjectPinoLogger } from 'nestjs-pino'
import { ListQueryHandler } from '@B-S-F/api-commons-lib'

@Injectable()
export class MetricService {
  @InjectPinoLogger(MetricService.name)
  private readonly logger = new Logger(
    new PinoLogger({
      pinoHttp: {
        level: 'debug',
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),
    {}
  )

  constructor(
    @InjectRepository(Metric)
    private repository: Repository<Metric>
  ) {}

  async create(metricDTO: CreateMetricDTO): Promise<GetMetricDTO> {
    const metric = this.repository.create(metricDTO)
    const newMetric = await this.repository.save(metric)
    const newMetricDTO = new GetMetricDTO(newMetric)

    return newMetricDTO
  }

  async getNrOfFindings(
    namespaceId: number,
    status: StatusType,
    paginateQueryOptions?: ListQueryHandler
  ) {
    const rawQuery = `WITH cte_findings AS (
      SELECT
        m.metric::jsonb->>'runId' AS run_id,
        m.metric::jsonb->>'configId' AS config_id,
        SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END) AS count,
        MIN(m."creationTime") AS min_creationTime,
        MAX(m."creationTime") AS max_creationTime,
        LAG(SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END), 1) OVER (
          PARTITION BY m.metric::jsonb->>'configId'
          ORDER BY
            m.metric::jsonb->>'configId',
            m.metric::jsonb->>'runId'
        ) AS previous_count
      FROM public.metric AS m
        WHERE (m.metric ::jsonb ->> 'namespaceId')::bigint = $1
            AND m.service = $2
        GROUP BY run_id, config_id
      )
      SELECT
        run_id::bigint AS "runId",
        config_id::bigint AS "configId",
        count,
        min_creationTime AS "datetime",
        SUM(CASE WHEN previous_count IS NULL THEN count ELSE count - previous_count END)::bigint AS diff
      FROM cte_findings
      GROUP BY run_id, config_id, count, min_creationTime, max_creationTime, datetime`

    const rawPaginatedQuery =
      rawQuery +
      ` ORDER BY "${paginateQueryOptions.sortBy}" ${paginateQueryOptions.sortOrder} OFFSET $4 LIMIT $5;`

    const entities: GetFindingsDTO[] = await this.repository.query(
      rawPaginatedQuery,
      [
        namespaceId,
        ServiceType.FINDINGS,
        status,
        (paginateQueryOptions.page - 1) * paginateQueryOptions.items,
        paginateQueryOptions.items,
      ]
    )
    const itemCount: number = (
      await this.repository.query(rawQuery, [
        namespaceId,
        ServiceType.FINDINGS,
        status,
      ])
    ).length

    return { entities, itemCount }
  }

  async getNrOfFindingsByConfigId(
    namespaceId: number,
    status: StatusType,
    configId: number,
    paginateQueryOptions?: ListQueryHandler
  ) {
    const rawQuery = `WITH cte_findings AS (
      SELECT
        m.metric::jsonb->>'runId' AS run_id,
        m.metric::jsonb->>'configId' AS config_id,
        SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END) AS count,
        MIN(m."creationTime") AS min_creationTime,
        MAX(m."creationTime") AS max_creationTime,
        LAG(SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END), 1) OVER (
          PARTITION BY m.metric::jsonb->>'configId'
          ORDER BY
            m.metric::jsonb->>'configId',
            m.metric::jsonb->>'runId'
        ) AS previous_count
      FROM public.metric AS m
        WHERE (m.metric ::jsonb ->> 'namespaceId')::bigint = $1
            AND m.service = $2
            AND (m.metric ::jsonb ->> 'configId')::bigint = $4
        GROUP BY run_id, config_id
      )
      SELECT
        run_id::bigint AS "runId",
        config_id::bigint AS "configId",
        count,
        min_creationTime AS "datetime",
        SUM(CASE WHEN previous_count IS NULL THEN count ELSE count - previous_count END)::bigint AS diff
      FROM cte_findings
      GROUP BY run_id, config_id, count, min_creationTime, max_creationTime, datetime`

    const rawPaginatedQuery =
      rawQuery +
      ` ORDER BY "${paginateQueryOptions.sortBy}" ${paginateQueryOptions.sortOrder} OFFSET $5 LIMIT $6;`

    const entities: GetFindingsDTO[] = await this.repository.query(
      rawPaginatedQuery,
      [
        namespaceId,
        ServiceType.FINDINGS,
        status,
        configId,
        (paginateQueryOptions.page - 1) * paginateQueryOptions.items,
        paginateQueryOptions.items,
      ]
    )
    const itemCount: number = (
      await this.repository.query(rawQuery, [
        namespaceId,
        ServiceType.FINDINGS,
        status,
        configId,
      ])
    ).length

    return { entities, itemCount }
  }

  async getLatestRunNrOfFindings(
    namespaceId: number,
    status: StatusType,
    paginateQueryOptions?: ListQueryHandler
  ) {
    const rawQuery = `WITH cte_findings AS (
      SELECT
        m.metric::jsonb->>'runId' AS run_id,
        m.metric::jsonb->>'configId' AS config_id,
        SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END) AS count,
        MIN(m."creationTime") AS min_creationTime,
        MAX(m."creationTime") AS max_creationTime,
        LAG(SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END), 1) OVER (
          PARTITION BY m.metric::jsonb->>'configId'
          ORDER BY
            m.metric::jsonb->>'configId',
            m.metric::jsonb->>'runId'
        ) AS previous_count,
        MAX(m.metric::jsonb->>'runId') OVER (
          PARTITION BY m.metric::jsonb->>'configId'
          ORDER BY m.metric::jsonb->>'configId'
        ) AS last_run_id
      FROM public.metric AS m
        WHERE (m.metric ::jsonb ->> 'namespaceId')::bigint = $1
            AND m.service = $2
        GROUP BY run_id, config_id
      )
      SELECT
        run_id::bigint AS "runId",
        config_id::bigint AS "configId",
        count,
        min_creationTime AS "datetime",
        SUM(CASE WHEN previous_count IS NULL THEN count ELSE count - previous_count END)::bigint AS diff
      FROM cte_findings
      WHERE last_run_id = run_id
      GROUP BY run_id, config_id, count, min_creationTime, max_creationTime, datetime`

    const rawPaginatedQuery =
      rawQuery +
      ` ORDER BY "${paginateQueryOptions.sortBy}" ${paginateQueryOptions.sortOrder} OFFSET $4 LIMIT $5;`

    const entities: GetFindingsDTO[] = await this.repository.query(
      rawPaginatedQuery,
      [
        namespaceId,
        ServiceType.FINDINGS,
        status,
        (paginateQueryOptions.page - 1) * paginateQueryOptions.items,
        paginateQueryOptions.items,
      ]
    )
    const itemCount: number = (
      await this.repository.query(rawQuery, [
        namespaceId,
        ServiceType.FINDINGS,
        status,
      ])
    ).length

    return { entities, itemCount }
  }

  async getNrOfFindingsInRange(
    namespaceId: number,
    status: StatusType,
    startRange: string,
    endRange: string,
    paginateQueryOptions?: ListQueryHandler
  ) {
    let startRangeDate: string
    let endRangeDate: string
    try {
      startRangeDate = new Date(startRange).toISOString()
      endRangeDate = new Date(endRange).toISOString()
    } catch (error) {
      throw new BadRequestException()
    }

    const rawQuery = `WITH cte_findings AS (
      SELECT
        m.metric::jsonb->>'runId' AS run_id,
        m.metric::jsonb->>'configId' AS config_id,
        SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END) AS count,
        MIN(m."creationTime") AS min_creationTime,
        MAX(m."creationTime") AS max_creationTime,
        LAG(SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END), 1) OVER (
          PARTITION BY m.metric::jsonb->>'configId'
          ORDER BY
            m.metric::jsonb->>'configId',
            m.metric::jsonb->>'runId'
        ) AS previous_count
      FROM public.metric AS m
        WHERE (m.metric ::jsonb ->> 'namespaceId')::bigint = $1
            AND m.service = $2
        GROUP BY run_id, config_id
      )
      SELECT
        run_id::bigint AS "runId",
        config_id::bigint AS "configId",
        count,
        min_creationTime AS "datetime",
        SUM(CASE WHEN previous_count IS NULL THEN count ELSE count - previous_count END)::bigint AS diff
      FROM cte_findings
      WHERE min_creationTime BETWEEN $4 AND $5 OR max_creationTime BETWEEN $4 AND $5
      GROUP BY run_id, config_id, count, min_creationTime, max_creationTime, datetime`

    const rawPaginatedQuery =
      rawQuery +
      ` ORDER BY "${paginateQueryOptions.sortBy}" ${paginateQueryOptions.sortOrder} OFFSET $6 LIMIT $7;`

    const entities: GetFindingsDTO[] = await this.repository.query(
      rawPaginatedQuery,
      [
        namespaceId,
        ServiceType.FINDINGS,
        status,
        startRangeDate,
        endRangeDate,
        (paginateQueryOptions.page - 1) * paginateQueryOptions.items,
        paginateQueryOptions.items,
      ]
    )
    const itemCount: number = (
      await this.repository.query(rawQuery, [
        namespaceId,
        ServiceType.FINDINGS,
        status,
        startRangeDate,
        endRangeDate,
      ])
    ).length

    return { entities, itemCount }
  }

  async getNrOfFindingsInRangeByConfigId(
    namespaceId: number,
    status: StatusType,
    startRange: string,
    endRange: string,
    configId: number,
    paginateQueryOptions?: ListQueryHandler
  ) {
    let startRangeDate: string
    let endRangeDate: string
    try {
      startRangeDate = new Date(startRange).toISOString()
      endRangeDate = new Date(endRange).toISOString()
    } catch (error) {
      throw new BadRequestException()
    }

    const rawQuery = `WITH cte_findings AS (
      SELECT
        m.metric::jsonb->>'runId' AS run_id,
        m.metric::jsonb->>'configId' AS config_id,
        SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END) AS count,
        MIN(m."creationTime") AS min_creationTime,
        MAX(m."creationTime") AS max_creationTime,
        LAG(SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END), 1) OVER (
          PARTITION BY m.metric::jsonb->>'configId'
          ORDER BY
            m.metric::jsonb->>'configId',
            m.metric::jsonb->>'runId'
        ) AS previous_count
      FROM public.metric AS m
        WHERE (m.metric ::jsonb ->> 'namespaceId')::bigint = $1
            AND m.service = $2
            AND (m.metric ::jsonb ->> 'configId')::bigint = $4
        GROUP BY run_id, config_id
      )
      SELECT
        run_id::bigint AS "runId",
        config_id::bigint AS "configId",
        count,
        min_creationTime AS "datetime",
        SUM(CASE WHEN previous_count IS NULL THEN count ELSE count - previous_count END)::bigint AS diff
      FROM cte_findings
      WHERE min_creationTime BETWEEN $5 AND $6 OR max_creationTime BETWEEN $5 AND $6
      GROUP BY run_id, config_id, count, min_creationTime, max_creationTime, datetime`

    const rawPaginatedQuery =
      rawQuery +
      ` ORDER BY "${paginateQueryOptions.sortBy}" ${paginateQueryOptions.sortOrder} OFFSET $7 LIMIT $8;`

    const entities: GetFindingsDTO[] = await this.repository.query(
      rawPaginatedQuery,
      [
        namespaceId,
        ServiceType.FINDINGS,
        status,
        configId,
        startRangeDate,
        endRangeDate,
        (paginateQueryOptions.page - 1) * paginateQueryOptions.items,
        paginateQueryOptions.items,
      ]
    )
    const itemCount: number = (
      await this.repository.query(rawQuery, [
        namespaceId,
        ServiceType.FINDINGS,
        status,
        configId,
        startRangeDate,
        endRangeDate,
      ])
    ).length

    return { entities, itemCount }
  }

  async getLatestRunNrOfFindingsInRange(
    namespaceId: number,
    status: StatusType,
    startRange: string,
    endRange: string,
    paginateQueryOptions?: ListQueryHandler
  ) {
    let startRangeDate: string
    let endRangeDate: string
    try {
      startRangeDate = new Date(startRange).toISOString()
      endRangeDate = new Date(endRange).toISOString()
    } catch (error) {
      throw new BadRequestException()
    }

    const rawQuery = `WITH cte_findingsInRange AS (
      WITH cte_findings AS (
        SELECT
          m.metric::jsonb->>'runId' AS run_id,
          m.metric::jsonb->>'configId' AS config_id,
          SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END) AS count,
          MIN(m."creationTime") AS min_creationTime,
          MAX(m."creationTime") AS max_creationTime,
          LAG(SUM(CASE WHEN m.metric::jsonb->>'status' = $3 THEN 1 ELSE 0 END), 1) OVER (
            PARTITION BY m.metric::jsonb->>'configId'
            ORDER BY
              m.metric::jsonb->>'configId',
              m.metric::jsonb->>'runId'
          ) AS previous_count
        FROM public.metric AS m
          WHERE (m.metric ::jsonb ->> 'namespaceId')::bigint = $1
              AND m.service = $2
          GROUP BY run_id, config_id
        )
        SELECT
          run_id::bigint,
          config_id::bigint,
          count,
          min_creationTime AS "datetime",
          SUM(CASE WHEN previous_count IS NULL THEN count ELSE count - previous_count END)::bigint AS diff,
          (MAX(run_id) OVER (PARTITION BY config_id ORDER BY config_id))::bigint AS last_run_id
        FROM cte_findings
        WHERE min_creationTime BETWEEN $4 AND $5 OR max_creationTime BETWEEN $4 AND $5
        GROUP BY run_id, config_id, count, min_creationTime, max_creationTime, datetime
      )
      SELECT
		    run_id::bigint AS "runId",
		    config_id::bigint AS "configId",
		    count,
		    datetime,
		    diff
	    FROM cte_findingsInRange
	    WHERE datetime BETWEEN $4 AND $5
	      AND last_run_id = run_id
	    GROUP BY run_id, config_id, count, datetime, diff`

    const rawPaginatedQuery =
      rawQuery +
      ` ORDER BY "${paginateQueryOptions.sortBy}" ${paginateQueryOptions.sortOrder} OFFSET $6 LIMIT $7;`

    const entities: GetFindingsDTO[] = await this.repository.query(
      rawPaginatedQuery,
      [
        namespaceId,
        ServiceType.FINDINGS,
        status,
        startRangeDate,
        endRangeDate,
        (paginateQueryOptions.page - 1) * paginateQueryOptions.items,
        paginateQueryOptions.items,
      ]
    )
    const itemCount: number = (
      await this.repository.query(rawQuery, [
        namespaceId,
        ServiceType.FINDINGS,
        status,
        startRangeDate,
        endRangeDate,
      ])
    ).length

    return { entities, itemCount }
  }

  async updateFindingMetric(
    namespaceId: number,
    findingId: string,
    updateFindingMetricDTO: UpdateFindingDTO
  ) {
    const metric: Metric = new Metric()
    metric.metric = {
      id: findingId,
      namespaceId: updateFindingMetricDTO.namespaceId,
      configId: updateFindingMetricDTO.configId,
      runId: updateFindingMetricDTO.runId,
      status: updateFindingMetricDTO.status,
      severity: updateFindingMetricDTO.severity,
      updated: updateFindingMetricDTO.updated,
    }
    metric.service = ServiceType.FINDINGS
    const updateFindingMetric = await this.repository
      .createQueryBuilder('metric')
      .update(Metric)
      .set(metric)
      .where(`metric.metric ::jsonb ->> 'namespaceId' = :namespaceId`, {
        namespaceId,
      })
      .andWhere(`metric.metric ::jsonb ->> 'configId' = :configId`, {
        configId: updateFindingMetricDTO.configId,
      })
      .andWhere(`metric.metric ::jsonb ->> 'runId' = :runId`, {
        runId: updateFindingMetricDTO.runId,
      })
      .andWhere(`metric.metric ::jsonb ->> 'id' = :id`, {
        id: findingId,
      })
      .execute()

    if (!updateFindingMetric.affected) {
      this.logger.debug(`Update of metric failed`, Metric)
      throw new NotFoundException(
        `Metric of Finding with id: ${findingId} not found in run ${updateFindingMetricDTO.runId}`
      )
    }

    const updatedMetric = await this.repository.findOneBy({
      metric: { id: findingId },
    })
    if (updatedMetric) {
      return new GetMetricDTO(updatedMetric)
    }
  }
}
