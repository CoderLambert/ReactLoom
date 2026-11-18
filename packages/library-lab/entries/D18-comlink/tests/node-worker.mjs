import { parentPort } from 'node:worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/esm/node-adapter.mjs'
import { api } from '../examples/worker-api.ts'

Comlink.expose(api, nodeEndpoint(parentPort))
