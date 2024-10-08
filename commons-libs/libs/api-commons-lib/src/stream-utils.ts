import { Readable } from 'stream'

export async function streamToString(stream: Readable): Promise<string> {
  if (!stream) {
    throw new Error('Received stream is unexpectedly null')
  }
  let result = ''
  for await (const chunk of stream) {
    result += chunk
  }
  return result
}

export function decodeBufferToUTF8EncodedString(data: Buffer): string {
  try {
    return new TextDecoder('utf8', { fatal: true }).decode(data)
  } catch (err) {
    return undefined
  }
}
