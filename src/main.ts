#!/usr/bin/env node

/**
 * This is a sample HTTP server.
 * Replace this with your implementation.
 */

import 'dotenv/config'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { Config } from './config.js'
import fs from 'fs'
import path from 'path'

const nodePath = resolve(process.argv[1])
const modulePath = resolve(fileURLToPath(import.meta.url))
const isCLI = nodePath === modulePath

let counter = 20

export default function main(port: number = Config.port) {
  const requestListener = (request: IncomingMessage, response: ServerResponse) => {
    const p = path.join('/var/lib/app/files', `${counter}.txt`)
    counter += 1
    fs.writeFileSync(p, 'test')
    const dir = fs.readdirSync('/var/lib/app/files')
    response.setHeader('content-type', 'text/plain;charset=utf8')
    response.writeHead(200, 'OK')
    response.end(`Olá, Hola, Hello! ${dir.join(',')}`)
  }

  const server = createServer(requestListener)

  if (isCLI) {
    server.listen(port)
    // eslint-disable-next-line no-console
    console.log(`Listening on port: ${port}`)
  }

  return server
}

if (isCLI) {
  main()
}
