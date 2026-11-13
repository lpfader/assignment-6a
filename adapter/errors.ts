// Builds an Error carrying the HTTP status and whatever the server said, so the
// page can show the real reason instead of a generic "error code" message.
export async function errorFromResponse (what: string, response: Response): Promise<Error> {
  let detail = ''
  try {
    const body = await response.text()
    if (body.length > 0) {
      detail = `: ${body}`
    }
  } catch {
    // The body was not readable; the status alone is still better than nothing.
  }
  return new Error(`${what} (HTTP ${response.status})${detail}`)
}
