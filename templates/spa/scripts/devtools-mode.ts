// Vite loadEnv() resolves .env files and process overrides. Both development
// integrations must obey the same resolved VITE_DEVTOOLS value.
// The client env schema defaults to 'true' when the variable is absent.
export function resolveDevtoolsMode(command: string, value: string | undefined) {
  const enabled = command === 'serve' && value !== 'false'
  return { clickToSource: enabled, lighthouse: enabled }
}
