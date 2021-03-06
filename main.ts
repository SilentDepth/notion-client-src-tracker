import fs from 'fs'
import fetch from 'node-fetch'

import checkAppVersion from './check-app-version'
import checkDesktopVersion from './check-desktop-version'

interface LastCheck {
  [type: string]: string | {
    version: string
    hash: string
  }
}

void async function main () {
  const updated = ([] as [string, [string, string]][]).concat(await checkAppVersion(), await checkDesktopVersion())
  const lastCheck = JSON.parse(fs.readFileSync('./last-check.json', 'utf-8')) as LastCheck

  await fetch(process.env.TG_BOT_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      versions: Object.fromEntries(Object.entries(lastCheck).map(([type, latest]) => {
        const found = updated.find(it => it[0] === type)
        return [type, found?.[1] ?? (typeof latest === 'string' ? latest : latest.version)]
      })),
    }),
  })

  fs.writeFileSync('./UPDATED', updated.map(([type]) => {
    const data = lastCheck[type]
    return `${type}-${typeof data === 'string' ? data : data.version}`
  }).join(', '), 'utf-8')
}()
