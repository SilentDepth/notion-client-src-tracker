import fs from 'fs'
import fetch from 'node-fetch'

import {compareVersion} from './utils'

const URLS = {
  'windows': 'https://www.notion.so/desktop/windows/download',
  'mac-intel': 'https://www.notion.so/desktop/mac/download',
  'mac-apple-silicon': 'https://www.notion.so/desktop/apple-silicon/download',
}

const updated: [string, [string, string]][] = []
let lastCheck: any

export default async function checkDesktopVersion () {
  console.log('Start checking desktop versions')

  lastCheck = JSON.parse(fs.readFileSync('./last-check.json', 'utf-8'))
  for (const type of Object.keys(URLS)) {
    await check(type as keyof typeof URLS)
  }
  if (updated.length) {
    fs.writeFileSync('./last-check.json', JSON.stringify(lastCheck), 'utf-8')
  }

  console.log('✔')
  return updated
}

async function check (type: keyof typeof URLS) {
  const res = await fetch(URLS[type], {method: 'HEAD'})
  const filename = decodeURI(res.url).match(/([^/]+)\.(exe|dmg)$/)![0]
  const version = filename.match(/\d+(\.\d+)+/)![0]
  if (compareVersion(version, lastCheck[type]) > 0) {
    console.log(`Detected a new version of ${type}`)
    updated.push([type, [lastCheck[type], version]])
    lastCheck[type] = version
  }
}
