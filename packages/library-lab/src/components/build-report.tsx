import { useEffect, useState } from 'react'
import { readLimitedJsonResponse } from '../lib/bounded-json.mjs'
import { requestGeneratedResource } from '../lib/resource-fetch.mjs'

type Build = {
  variant: string
  initialBytes: number
  initialGzipBytes: number
  totalBytes: number
}
type Summary = {
  generatedAt: string
  builds: Build[]
  versions: { vite: string; visualizer: string }
}
function isSummary(value: unknown): value is Summary {
  if (
    !value ||
    typeof value !== 'object' ||
    !('builds' in value) ||
    !Array.isArray(value.builds) ||
    value.builds.length < 1 ||
    value.builds.length > 2
  )
    return false
  if (
    !('generatedAt' in value) ||
    typeof value.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.generatedAt))
  )
    return false
  if (
    !('versions' in value) ||
    !value.versions ||
    typeof value.versions !== 'object' ||
    !('vite' in value.versions) ||
    !('visualizer' in value.versions) ||
    typeof value.versions.vite !== 'string' ||
    typeof value.versions.visualizer !== 'string'
  )
    return false
  return value.builds.every((build: unknown) => {
    if (
      !build ||
      typeof build !== 'object' ||
      !('variant' in build) ||
      !['static', 'lazy'].includes(String(build.variant))
    )
      return false
    return ['initialBytes', 'initialGzipBytes', 'totalBytes'].every(
      (key) =>
        key in build &&
        typeof Reflect.get(build, key) === 'number' &&
        Number.isFinite(Reflect.get(build, key)) &&
        Reflect.get(build, key) >= 0,
    )
  })
}
const bytes = (value: number) => `${value.toLocaleString('zh-CN')} B`
export default function BuildReport({ available }: { available: boolean }) {
  const [summary, setSummary] = useState<Summary>()
  const [error, setError] = useState('')
  useEffect(() => {
    if (!available) return
    const controller = new AbortController()
    requestGeneratedResource(
      `${import.meta.env.BASE_URL}raw/F18/build-summary.json`,
      async (response) => {
        const value: unknown = await readLimitedJsonResponse(response, 256_000)
        if (!isSummary(value)) throw new Error('构建摘要格式不正确，请重新生成')
        return value
      },
      { signal: controller.signal },
    )
      .then((value) => {
        if (!controller.signal.aborted) setSummary(value)
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(String(cause))
      })
    return () => controller.abort()
  }, [available])
  if (!available)
    return (
      <section className="notice">
        <h3>还没有当前输入的构建结果</h3>
        <p>执行上方命令生成报告，再运行 Library Lab 的 catalog:generate 更新页面数据。</p>
      </section>
    )
  if (error) return <p role="alert">{error}</p>
  if (!summary) return <p role="status">正在读取真实构建结果…</p>
  const eager = summary.builds.find((build) => build.variant === 'static')
  const lazy = summary.builds.find((build) => build.variant === 'lazy')
  const delta = eager && lazy ? lazy.initialGzipBytes - eager.initialGzipBytes : undefined
  return (
    <section className="build-report prose" aria-label="实际构建结果">
      <h3>这次真实构建得到了什么</h3>
      <p>
        Vite {summary.versions.vite} · visualizer {summary.versions.visualizer} ·{' '}
        {summary.generatedAt}
      </p>
      <table>
        <caption>相同功能，比较静态导入与点击后导入的实际 JS 文件</caption>
        <thead>
          <tr>
            <th scope="col">导入方式</th>
            <th scope="col">入口及静态依赖</th>
            <th scope="col">入口 gzip</th>
            <th scope="col">异步 JS</th>
            <th scope="col">总 JS</th>
          </tr>
        </thead>
        <tbody>
          {summary.builds.map((build) => (
            <tr key={build.variant}>
              <th scope="row">{build.variant === 'static' ? '静态导入' : '点击后导入'}</th>
              <td>{bytes(build.initialBytes)}</td>
              <td>{bytes(build.initialGzipBytes)}</td>
              <td>{bytes(build.totalBytes - build.initialBytes)}</td>
              <td>{bytes(build.totalBytes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {delta !== undefined && (
        <p>
          <strong>
            入口 gzip {delta >= 0 ? '增加' : '减少'}了 {bytes(Math.abs(delta))}。
          </strong>{' '}
          {delta >= 0
            ? '这个小模块的拆包收益不足以抵消加载辅助代码，不能据此认为延迟加载一定更小。'
            : '这是本次 fixture 的结果；仍需结合真实功能与浏览器请求判断是否值得拆分。'}
        </p>
      )}
      <p>
        数据来自实际产物并在发布时核对输入与文件摘要。gzip
        是每个文件的压缩估算，加载时机需要浏览器另行观察；这份摘要不替代 SDK 或浏览器验收收据。
      </p>
    </section>
  )
}
