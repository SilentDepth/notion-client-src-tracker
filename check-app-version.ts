import fs from 'fs'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import prettier from 'prettier'

import clean from './clean'

const URLS = {
  'app': 'https://www.notion.so/login',
}

const updated: [string, [string, string]][] = []
let lastCheck: any

export default async function checkAppVersion () {
  lastCheck = JSON.parse(fs.readFileSync('./last-check.json', 'utf-8'))
  for (const type of Object.keys(URLS)) {
    await check(type as keyof typeof URLS)
  }
  if (updated.length) {
    fs.writeFileSync('./last-check.json', JSON.stringify(lastCheck), 'utf-8')
  }
  return updated
}

async function check (type: keyof typeof URLS) {
  console.log(`Start checking version update for ${type}`)

  const $ = cheerio.load(await fetch(URLS[type]).then(res => res.text()))
  const appJsUri = $('script[src^="/app-"]').attr('src')!
  const remoteHash = appJsUri.match(/[0-9a-f]{20}/)![0]
  console.log(`Remote hash: ${remoteHash}`)

  if (remoteHash !== lastCheck.app.hash) {
    console.log(`....is different from last check (${lastCheck.app.hash})`)

    const js = await fetch(new URL(appJsUri, URLS[type]).href).then(res => res.text())
    const notionVersion = js.match(/("|')Notion (\d+\.\d+)\.\1/)![2]
    const appVersion = js.match(/,version:("|')(\d+(\.\d+){2,})\1,/)![2]
    const fullVersion = `${notionVersion}.${appVersion}`
    updated.push([type, [lastCheck.app.version, fullVersion]])
    console.log(`Got remote version as ${notionVersion} . ${appVersion}. Saving script files...`)

    const name = `${type}-${fullVersion}-${remoteHash}`
    fs.writeFileSync(`./files/${name}.min.js`, js, 'utf-8')

    const formatted = prettier.format(js, await prettier.resolveConfig(await prettier.resolveConfigFile(__filename) as string) ?? undefined)
    fs.writeFileSync(`./files/${name}.js`, formatted, 'utf-8')

    lastCheck.app.version = fullVersion
    lastCheck.app.hash = remoteHash
  } else {
    console.log('....matched last check')
  }

  clean(type)
  console.log('✔')
}
