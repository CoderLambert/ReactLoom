import * as Comlink from 'comlink'
import { api } from './worker-api'

Comlink.expose(api)
