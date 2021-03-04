import fs from 'fs'
import fetch from 'node-fetch'

import {compareVersion} from './utils'

const lastCheck = JSON.parse(fs.readFileSync('./last-check.json', 'utf-8'))

const URLS = {
  'Windows': 'https://www.notion.so/desktop/windows/download',
  'Mac (Apple Silicon)': 'https://www.notion.so/desktop/apple-silicon/download',
  'Mac (Intel)': 'https://www.notion.so/desktop/mac/download',
}

void async function () {
  for (const task of Object.keys(URLS).map(type => check.bind(null, type as keyof typeof URLS))) {
    await task()
  }
}()

async function check (type: keyof typeof URLS) {
  const res = await fetch(URLS[type], {method: 'HEAD'})
  const filename = decodeURI(res.url).match(/([^/]+)\.(exe|dmg)$/)![0]
  const version = filename.match(/\d+(\.\d+)+/)![0]
  if (compareVersion(version, lastCheck.desktop[type]) > 0) {
    console.log(type)
    lastCheck.desktop[type] = version
    saveLastCheck()
  }
}

function saveLastCheck () {
  fs.writeFileSync('./last-check.json', JSON.stringify(lastCheck), 'utf-8')
}
