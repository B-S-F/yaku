export function getFilenameFromUrl(url: string): string {
  const pathParts = new URL(url).pathname.split('/')
  let filename: string | undefined = ''
  while (filename === undefined || filename === '') {
    filename = pathParts.pop()
  }
  return filename
}

export async function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })
}
