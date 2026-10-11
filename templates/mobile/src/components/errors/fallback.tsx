import { type DevStackFrame, devInspectorPath, parseDevStack } from '@reactloom/devtools/stack'
import Constants from 'expo-constants'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

declare const __DEV__: boolean

type MetroFrame = {
  file?: string
  methodName?: string
  lineNumber?: number
  column?: number
}

export function DevErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const [frames, setFrames] = useState<DevStackFrame[]>(() =>
    __DEV__ && error.stack ? parseDevStack(error.stack) : [],
  )

  useEffect(() => {
    if (!__DEV__ || !error.stack) return
    const base = devServerBase()
    if (!base) return
    const stack = parseDevStack(error.stack)
      .filter((frame) => frame.file && frame.line !== undefined)
      .map((frame) => ({
        file: frame.file,
        methodName: '<unknown>',
        lineNumber: frame.line,
        column: frame.column ?? 0,
      }))
    if (stack.length === 0) return
    let cancelled = false
    void fetch(`${base}symbolicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stack }),
    })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((body: { stack?: MetroFrame[] } | undefined) => {
        if (cancelled || !body?.stack) return
        setFrames(
          body.stack.map((frame) => ({
            text: `${frame.methodName ?? 'at'} (${frame.file ?? 'unknown'}:${frame.lineNumber ?? 0}:${frame.column ?? 0})`,
            file: frame.file,
            line: frame.lineNumber,
            column: frame.column,
          })),
        )
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [error])

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>This screen hit a snag.</Text>
      <Text style={styles.message}>{error.message}</Text>
      {__DEV__ ? (
        <Text style={styles.hint}>
          Tap a project frame to open it. Compile errors and uncaught exceptions stay in LogBox,
          with source-mapped locations. The lightning button is the other click-to-source path.
        </Text>
      ) : null}
      {__DEV__ && frames.length > 0 ? (
        <ScrollView style={styles.stack}>
          {frames.map((frame) => {
            const located = frame.file && frame.line !== undefined
            const label =
              frame.text.trim() ||
              devInspectorPath({
                file: frame.file ?? 'unknown',
                line: frame.line ?? 0,
                column: frame.column ?? 0,
              })
            const key = frameKey(frame, label)
            if (!located) {
              return (
                <Text key={key} style={styles.frame}>
                  {label}
                </Text>
              )
            }
            return (
              <Pressable key={key} onPress={() => openExpoFrame(frame.file, frame.line)}>
                <Text style={styles.link}>{label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
      ) : null}
      <Pressable onPress={retry} style={styles.button}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  )
}

function frameKey(frame: DevStackFrame, label: string): string {
  return `${frame.file ?? 'plain'}:${frame.line ?? 0}:${frame.column ?? 0}:${label}`
}

function devServerBase(): string | undefined {
  const host = Constants.expoConfig?.hostUri
  if (!host) return undefined
  const withProtocol = host.startsWith('http') ? host : `http://${host}`
  return withProtocol.endsWith('/') ? withProtocol : `${withProtocol}/`
}

function openExpoFrame(file: string | undefined, line: number | undefined) {
  if (!file || line === undefined) return
  const base = devServerBase()
  if (!base) return
  void fetch(`${base}open-stack-frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, lineNumber: line }),
  }).catch(() => undefined)
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f0e6', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1c1915' },
  message: { fontSize: 16, color: '#5c564c' },
  hint: { fontSize: 13, color: '#5c564c' },
  stack: { flex: 1 },
  frame: { fontSize: 12, color: '#5c564c', marginBottom: 6 },
  link: { fontSize: 12, color: '#9a3412', marginBottom: 6 },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#1c1915',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: { color: '#f4f0e6', fontSize: 14, fontWeight: '600' },
})
