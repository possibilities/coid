const puppeteer = require('puppeteer')
const dedent = require('dedent')
const { parseUrl } = require('url')
const { exec } = require('shelljs')

const puppeteerConfig = { headless: false, devtools: true }

const curlCommandForRequest = request =>
  `
    curl -v '${request.url()}' -H 'user-agent: ${
    request.headers()['user-agent']
  }' -H 'referer: ${request.headers()['referer']}'`

const main = async () => {
  const browser = await puppeteer.launch(puppeteerConfig)
  const page = await browser.newPage()

  await page.setRequestInterception(true)

  page.on('request', request => {
    const url = request.url()
    if (url.startsWith('https://conduit.productionready.io/api')) {
      const curl = curlCommandForRequest(request)
      const result = exec(curl)
      const statusLine = result.stderr
        .split('\n')
        .find(line => line.startsWith('< status: '))
      const status = statusLine && parseInt(statusLine.match(/(\d){3}/g)[0])

      if (status) {
        return request.respond({
          headers: {
            'access-control-allow-origin': '*',
          },
          contentType: 'application/json',
          body: result,
          status,
        })
      }
    }
    request.continue()
  })

  await Promise.all([
    page.waitForNavigation(),
    page.goto('https://react-redux.realworld.io'),
  ])

  const articleSelector = '.article-preview:first-child a'

  await page.waitFor(articleSelector)

  await page.evaluate(selector => {
    document.querySelector(selector).click()
  }, articleSelector)

  await browser.close()
}

main()
