import assert from 'node:assert/strict'
import test from 'node:test'
import { isLoopbackDevtoolsPeer } from './devtools-peer.ts'

test('accepts actual IPv4, IPv6 and mapped loopback TCP peers', () => {
  for (const address of [
    '127.0.0.1',
    '127.8.9.10',
    '::1',
    '0:0:0:0:0:0:0:1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
  ]) {
    assert.equal(isLoopbackDevtoolsPeer(address), true, address)
  }
})

test('rejects non-loopback peers even when they claim localhost in Host', () => {
  // A forwarded or forged HTTP Host does not change socket.remoteAddress.
  for (const address of [
    '192.168.1.3',
    '10.0.2.2',
    '172.16.0.1',
    '8.8.8.8',
    '::ffff:192.168.1.3',
    '2001:db8::1',
    'fe80::1',
    '::',
  ]) {
    assert.equal(isLoopbackDevtoolsPeer(address), false, address)
  }
})

test('fails closed when the actual peer address is missing or invalid', () => {
  for (const address of [undefined, null, '', 'localhost', '127.0.0.1.evil', '127.0.0.999']) {
    assert.equal(isLoopbackDevtoolsPeer(address), false, String(address))
  }
})
