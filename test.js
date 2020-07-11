const puppeteer = require('puppeteer')
const useCurlForPuppeteerRequests = require('./useCurlForPuppeteerRequests')

const shouldShowBrowser = process.argv.includes('--browser')

const puppeteerConfig = { headless: !shouldShowBrowser, devtools: true }

const appUrl = 'https://react-redux.realworld.io'
const apiUrl = 'https://conduit.productionready.io/api'

const main = async () => {
  const browser = await puppeteer.launch(puppeteerConfig)
  const page = await browser.newPage()

  useCurlForPuppeteerRequests(page, { urlPrefix: apiUrl })

  await Promise.all([page.waitForNavigation(), page.goto(appUrl)])

  const articleSelector = '.article-preview:first-child a'

  await page.waitFor(articleSelector)

  await page.evaluate(selector => {
    document.querySelector(selector).click()
  }, articleSelector)

  await browser.close()
}

main()
