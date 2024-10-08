import { RestApiRequestError, executeRestCall } from './call-wrapper.js'

export type FileData = {
  data: Buffer
  filename: string
}

export async function createResource<T>(
  url: string,
  body: any,
  token: string
): Promise<T> {
  try {
    const response: Response = await executeRestCall(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = (await response.json()) as T
    return data
  } catch (err) {
    throw err
  }
}

export async function uploadData(
  url: string,
  body: FormData,
  token: string,
  replace = false
): Promise<void> {
  await executeRestCall(url, {
    method: replace ? 'PATCH' : 'POST',
    body,
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function updateResource<T>(
  url: string,
  body: any,
  token: string
): Promise<T> {
  const response = await executeRestCall(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  return (await response.json()) as T
}

export async function transformData(
  url: string,
  body: any,
  token: string
): Promise<FileData> {
  const response = await executeRestCall(url, {
    method: 'PATCH',
    body,
    headers: { Authorization: `Bearer ${token}` },
  })
  return extractFileData(response)
}

export async function getResource<T>(url: string, token: string): Promise<T> {
  try {
    const response: Response = await executeRestCall(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = (await response.json()) as T
    return data
  } catch (err) {
    throw err
  }
}

export async function listAllResources<T>(
  url: string,
  token: string
): Promise<T[]> {
  let next = url
  const items: T[] = []
  while (next !== undefined) {
    try {
      const response: Response = await executeRestCall(next, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const raw = await response.json()

      next = raw?.links?.next

      items.push(...raw.data)
    } catch (err) {
      throw err
    }
  }

  return items
}

export async function getResourceBinaryData(
  url: string,
  token: string
): Promise<FileData> {
  const response = await executeRestCall(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

  return extractFileData(response)
}

export async function deleteResource(
  url: string,
  token: string
): Promise<void> {
  await executeRestCall(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function callViaPost(url: string, token: string): Promise<void> {
  await executeRestCall(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

async function extractFileData(response: any): Promise<FileData> {
  const filename = response.headers.get('Content-Disposition').split('"')[1]
  return {
    data: Buffer.from(await response.arrayBuffer()),
    filename,
  }
}
