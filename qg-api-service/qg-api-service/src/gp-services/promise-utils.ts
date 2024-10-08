export async function promiseOnTime(
  promise: Promise<any>,
  timeout: number
): Promise<any> {
  let timeoutId: any
  const result = await Promise.race([
    new Promise((_, reject) => {
      timeoutId = setTimeout(reject, timeout, new Error('Timeout'))
      return timeoutId
    }),
    promise,
  ])
  clearTimeout(timeoutId)
  return result
}
