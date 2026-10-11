import {
  createLighthouseServer,
  isLocalDevtoolsRequest,
} from '@reactloom/devtools/lighthouse-server'

const server = createLighthouseServer(process.cwd(), 'http://127.0.0.1:4318/')

function allowed(request: Request) {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEVTOOLS !== 'false' &&
    isLocalDevtoolsRequest(request.headers.get('host'), request.headers.get('origin'))
  )
}

export async function GET(request: Request) {
  if (!allowed(request)) return new Response(null, { status: 404 })
  return Response.json(await server.state(), { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  if (!allowed(request)) return new Response(null, { status: 404 })
  server.run()
  return Response.json(await server.state(), { headers: { 'Cache-Control': 'no-store' } })
}
