export const MAX_DEMO_UPDATE_BYTES = 64 * 1024;
// This envelope check prevents accidental cross-document application and unbounded demo packets.
// It DOES NOT authenticate senders or inspect decoded CRDT contents: production needs server ACL.
export function validateYjsEnvelope(envelope, expected) {
  if (!envelope || !expected || envelope.format !== 'yjs-v1' ||
      typeof expected.tenantId !== 'string' || !expected.tenantId ||
      typeof expected.documentId !== 'string' || !expected.documentId ||
      envelope.tenantId !== expected.tenantId || envelope.documentId !== expected.documentId) {
    throw new Error('Yjs tenant/document/protocol mismatch');
  }
  const bytes = envelope.update;
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1 || bytes.byteLength > MAX_DEMO_UPDATE_BYTES) {
    throw new Error('Yjs binary update missing or exceeds demo byte limit');
  }
  return bytes;
}
