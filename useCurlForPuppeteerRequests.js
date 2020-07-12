const { parseUrl } = require('url')
const { spawn } = require('child_process')

const shouldFormatJson = process.argv.includes('--format')

const curlArgumentsForRequest = request => [
  '-v',
  request.url(),
  '-H',
  `user-agent: ${request.headers()['user-agent']}`,
  '-H',
  `referer: ${request.headers()['referer']}`,
]

const useCurlForPuppeteerRequests = async (
  page,
  { urlPrefix: urlToInterceptRequestsFor },
) => {
  await page.setRequestInterception(true)

  page.on('request', request => {
    const url = request.url()
    if (url.startsWith(urlToInterceptRequestsFor)) {
      const curling = spawn('curl', ['-v', request.url()])

      const allOutput = []

      const standardOutput = []
      curling.stdout.on('data', data => {
        allOutput.push(data)
        standardOutput.push(data)
      })

      const errorOutput = []
      curling.stderr.on('data', data => {
        allOutput.push(data)
        errorOutput.push(data)
      })

      curling.on('close', data => {
        const statusLine = errorOutput
          .join('')
          .split('\n')
          .find(line => line.startsWith('< status: '))
        const status = parseInt(statusLine.match(/(\d){3}/g)[0])

        process.stdout.write(`curl -v ${request.url()} \\\n`)
        process.stdout.write(`\n`)
        process.stdout.write(errorOutput.join(''))
        process.stdout.write(
          shouldFormatJson
            ? JSON.stringify(JSON.parse(standardOutput.join('')), null, 2)
            : standardOutput.join(''),
        )
        process.stdout.write('\n')
        return request.respond({
          headers: {
            'access-control-allow-origin': '*',
          },
          contentType: 'application/json',
          body: standardOutput.join(''),
          status,
        })
      })
    } else {
      request.continue()
    }
  })
}

module.exports = useCurlForPuppeteerRequests
