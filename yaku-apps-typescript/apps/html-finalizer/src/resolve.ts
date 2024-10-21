import path from 'path'
import url from 'url'

/**
 * Starting from a file url, resolves a relative path to an absolute file path
 * @param metaUrl file url of the file to start from, typically `import.meta.url`
 * @param relativePath relative path to a file
 * @returns the absolute path to the file
 */
export default function resolve(metaUrl: string | URL, relativePath: string) {
  return path.join(path.dirname(url.fileURLToPath(metaUrl)), relativePath)
}
