import { BlockList, isIP } from 'node:net'

// Host and Origin headers can be forged by non-browser clients. The dev-only
// Lighthouse endpoint must also verify the actual TCP peer before returning
// reports or launching a resource-intensive audit.
const loopback = new BlockList()
loopback.addSubnet('127.0.0.0', 8, 'ipv4')
loopback.addAddress('::1', 'ipv6')
loopback.addSubnet('::ffff:127.0.0.0', 104, 'ipv6')

export function isLoopbackDevtoolsPeer(address: string | null | undefined): boolean {
  if (!address) return false
  const family = isIP(address)
  if (family === 4) return loopback.check(address, 'ipv4')
  if (family === 6) return loopback.check(address, 'ipv6')
  return false
}
