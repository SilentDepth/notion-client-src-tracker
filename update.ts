import fs from 'fs'
import url from 'url'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import prettier from 'prettier'

const updated: string[] = []

async function update (mode: string, host: string): Promise<void> {
  console.log('Mode:', mode, `(${host})`)

  const lastHash = fs.readdirSync(__dirname)
    .filter(name => name.startsWith(mode) && name.endsWith('.min.js'))
    .sort((a, b) => {
      const aVer = a.match(/^\w+-(\d+\.\d+\.\d+\.\d+\.\d+)/)![1].split('.').map(Number)
      const bVer = b.match(/^\w+-(\d+\.\d+\.\d+\.\d+\.\d+)/)![1].split('.').map(Number)
      for (let i = 0; i < aVer.length; i++) {
        const _a = aVer[i]
        const _b = bVer[i]
        if (_a < _b) return 1
        else if (_a > _b) return -1
      }
      return 0
    })[0]
    .match(/([0-9a-f]{20})\.min\.js$/)?.[1] ?? null

  if (lastHash) {
    console.log('Last hash:', lastHash)
  } else {
    console.log('No exist hash found')
  }

  console.log('Fetching index HTML...')
  const $ = cheerio.load(await fetch(host).then(res => res.text()))

  const appJsUri = $('script[src^="/app-"]').attr('src')!
  const remoteHash = appJsUri.match(/([0-9a-f]{20})\.js$/)![1]
  console.log('Remote hash:', remoteHash)

  if (lastHash !== remoteHash) {
    console.log('Fetching client JS...')
    const js = await fetch(url.resolve(host, appJsUri)).then(res => res.text())

    const notionVersion = js.match(/"Notion (\d+\.\d+)\."/)![1]
    const clientVersion = js.match(/,version:"(\d+(\.\d+)*)",/)![1]

    if (mode === 'app') {
      await fetch(`${process.env.TG_BOT_WEBHOOK_URL}?ver=${notionVersion}.${clientVersion}`).catch()
    }

    const name = `${mode}-${notionVersion}.${clientVersion}-${remoteHash}`
    fs.writeFileSync(`./${name}.min.js`, js, 'utf-8')

    console.log('Generating formatted source...')
    const formatted = prettier.format(js, await prettier.resolveConfig(await prettier.resolveConfigFile(__filename) as string) ?? undefined)
    fs.writeFileSync(`./${name}.js`, formatted, 'utf-8')

    updated.push(`${mode}-${notionVersion}.${clientVersion}`)
    console.log('✔')
  } else {
    console.log('No update')
  }
}

Promise.resolve()
  .then(() => update('app', 'https://www.notion.so/login'))
  .then(() => update('dev', 'https://dev.notion.so/login'))
  .then(() => {
    if (updated.length) {
      fs.writeFileSync('./UPDATED', updated.join(', '), 'utf-8')
    }
  })
