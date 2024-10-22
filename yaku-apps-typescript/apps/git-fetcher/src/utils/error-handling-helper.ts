export const tryParseResponse = async (response: Response) => {
  try {
    const responseBody = await response.json()
    return responseBody
  } catch (error) {
    throw new Error(
      `Response status was 200, however, the response body failed to be parsed as json. This most likely means your token is invalid or the input data is not correct. Returned error is: ${error}`
    )
  }
}
