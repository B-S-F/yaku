import stream from 'stream'

type Chunk = string | Buffer | Uint8Array
type Encoding = BufferEncoding | undefined
type Callback = (error?: Error | null) => void
type WriteStream = typeof process.stdout.write

const urlPattern = new RegExp(
  /https?:\/\/(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@%_+.~#?&//=]*)/gi
)
const colorsPattern = new RegExp(
  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/gi
)

export class Logger {
  private logStream: stream.PassThrough
  private originalStdoutWrite: WriteStream

  constructor() {
    this.logStream = new stream.PassThrough()
    this.originalStdoutWrite = process.stdout.write

    process.stdout.write = this.writeToStream.bind(this) as WriteStream
  }

  writeToStream(chunk: Chunk, encoding?: Encoding, callback?: Callback) {
    this.logStream.write(chunk, encoding, callback)
    this.originalStdoutWrite.apply(process.stdout, [chunk, encoding, callback])
  }

  end() {
    this.logStream.end()
  }

  restore() {
    process.stdout.write = this.originalStdoutWrite
  }

  getLogString() {
    return new Promise((resolve, reject) => {
      const logChunks: string[] = []
      this.logStream.on('data', (chunk) => {
        let str = chunk.toString()
        str = str.replace(colorsPattern, '') // remove color codes
        str = str.replace(urlPattern, (match: string) => `[${match}](${match})`) // make urls clickable
        logChunks.push(str)
      })

      this.logStream.on('end', () => {
        resolve(logChunks.join(''))
      })

      this.logStream.on('error', (error) => {
        reject(error)
      })
    })
  }
}
