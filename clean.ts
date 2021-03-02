import fs from 'fs'
import path from 'path'

import {compareVersion, extractVersion} from './utils'

const DIR = path.resolve(__dirname, 'files')
const REMAIN = 30

export default function clean (mode: string) {
  fs.readdirSync(DIR)
    .filter(name => name.startsWith(mode + '-') && name.endsWith('.min.js'))
    .sort((a, b) => compareVersion(extractVersion(a)!, extractVersion(b)!))
    .slice(0, -REMAIN)
    .forEach(name => {
      console.log(`Remove ${name}`)
      const file = path.resolve(DIR, name)
      fs.rmSync(file)
      const decompressed = file.replace(/\.min\.js$/, '.js')
      if (fs.existsSync(decompressed)) {
        fs.rmSync(decompressed)
      }
    })
}
