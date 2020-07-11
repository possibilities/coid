const puppeteer = require('puppeteer')
const { parseUrl } = require('url')
const { spawn } = require('child_process')

const appUrl = 'https://react-redux.realworld.io'
const apiUrl = 'https://conduit.productionready.io/api'

const puppeteerConfig = { headless: false, devtools: true }

const curlArgumentsForRequest = request => [
  '-v',
  request.url(),
  '-H',
  `user-agent: ${request.headers()['user-agent']}`,
  '-H',
  `referer: ${request.headers()['referer']}`,
]

const main = async () => {
  const browser = await puppeteer.launch(puppeteerConfig)
  const page = await browser.newPage()

  await page.setRequestInterception(true)

  page.on('request', request => {
    const url = request.url()
    if (url.startsWith(apiUrl)) {
      const curlArgs = curlArgumentsForRequest(request)
      const curling = spawn('curl', curlArgs)

      const allOutput = []
      curling.stdout.on('data', data => {
        allOutput.push(data)
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

        console.info(allOutput.join(''))
        return request.respond({
          headers: {
            'access-control-allow-origin': '*',
          },
          contentType: 'application/json',
          body: allOutput.join(''),
          status,
        })
      })
    } else {
      request.continue()
    }
  })

  await Promise.all([page.waitForNavigation(), page.goto(appUrl)])

  const articleSelector = '.article-preview:first-child a'

  await page.waitFor(articleSelector)

  await page.evaluate(selector => {
    document.querySelector(selector).click()
  }, articleSelector)

  await browser.close()
}

main()
