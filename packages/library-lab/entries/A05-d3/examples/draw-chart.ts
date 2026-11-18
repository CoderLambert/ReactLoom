import { axisBottom, axisLeft, select } from 'd3'
import { createGeometry, createMetricPaths, MARGIN } from './chart-geometry'
import type { ReadingPoint } from './chart-policy'

export type Level = 'basic' | 'business' | 'advanced'
export function clearChart(element: SVGSVGElement) {
  const svg = select(element)
  svg.interrupt()
  svg.selectAll('*').interrupt().on('.a05', null).remove()
  element.dataset.d3Cleaned = 'true'
}
export function drawChart(
  element: SVGSVGElement,
  rows: ReadingPoint[],
  width: number,
  level: Level,
  selected: string | null,
  choose: (day: string) => void,
) {
  const svg = select(element)
  svg.selectAll('*').interrupt()
  element.dataset.d3Cleaned = 'false'
  const geometry = createGeometry(rows, width)
  const { x, y, height } = geometry
  svg.attr('viewBox', `0 0 ${geometry.width} ${height}`)
  const ticks =
    width < 380 ? rows.filter((_, index) => index % 2 === 0).map((row) => row.day) : x.domain()
  svg
    .selectAll<SVGGElement, null>('g.a05-x-axis')
    .data([null])
    .join('g')
    .attr('class', 'a05-x-axis')
    .attr('transform', `translate(0,${height - MARGIN.bottom})`)
    .call(axisBottom(x).tickValues(ticks).tickSizeOuter(0))
  svg
    .selectAll<SVGGElement, null>('g.a05-y-axis')
    .data([null])
    .join('g')
    .attr('class', 'a05-y-axis')
    .attr('transform', `translate(${MARGIN.left},0)`)
    .call(axisLeft(y).ticks(5))
  svg
    .selectAll<SVGTextElement, null>('text.a05-axis-label')
    .data([null])
    .join('text')
    .attr('class', 'a05-axis-label')
    .attr('x', MARGIN.left)
    .attr('y', 15)
    .attr('fill', 'currentColor')
    .attr('font-size', 11)
    .text(level === 'basic' ? '阅读数' : '阅读数 / 收藏数')
  const bars = svg
    .selectAll<SVGRectElement, ReadingPoint>('rect.a05-bar')
    .data(level === 'basic' ? rows : [], (row) => row.day)
  const circles = svg
    .selectAll<SVGCircleElement, ReadingPoint>('circle.a05-dot')
    .data(level === 'basic' ? [] : rows, (row) => row.day)
  const primary = level === 'basic' ? bars : circles
  const joined = {
    entered: primary.enter().size(),
    updated: primary.size(),
    exited: primary.exit().size(),
  }
  bars
    .join(
      (enter) => enter.append('rect').attr('class', 'a05-bar'),
      (update) => update,
      (exit) => exit.interrupt().on('.a05', null).remove(),
    )
    .attr('data-day', (row) => row.day)
    .attr('data-selected', (row) => row.day === selected)
    .attr('x', (row) => x(row.day) ?? MARGIN.left)
    .attr('width', x.bandwidth())
    .attr('y', (row) => y(row.views))
    .attr('height', (row) => y(0) - y(row.views))
    .attr('rx', 3)
    .attr('fill', '#357761')
    .on('pointerenter.a05', (_, row) => choose(row.day))
  const paths = createMetricPaths(rows, geometry)
  svg
    .selectAll<SVGPathElement, (typeof paths)[number]>('path.a05-line')
    .data(level === 'basic' || rows.length === 0 ? [] : paths, (row) => row.key)
    .join('path')
    .attr('class', 'a05-line')
    .attr('data-series', (row) => row.key)
    .attr('d', (row) => row.path)
    .attr('fill', 'none')
    .attr('stroke', (row) => (row.key === 'views' ? '#357761' : '#ce8557'))
    .attr('stroke-width', (row) => (row.key === 'views' ? 3 : 2))
  circles
    .join(
      (enter) => enter.append('circle').attr('class', 'a05-dot'),
      (update) => update,
      (exit) => exit.interrupt().on('.a05', null).remove(),
    )
    .attr('data-day', (row) => row.day)
    .attr('data-selected', (row) => row.day === selected)
    .attr('cx', geometry.center)
    .attr('cy', (row) => y(row.views))
    .attr('r', 5)
    .attr('fill', '#357761')
    .on('pointerenter.a05', (_, row) => choose(row.day))
  return {
    width: geometry.width,
    height,
    xDomain: x.domain(),
    xRange: x.range(),
    bandwidth: x.bandwidth(),
    yDomain: y.domain(),
    yRange: y.range(),
    yTicks: y.ticks(5),
    joined,
    marks: Array.from(element.querySelectorAll<SVGElement>('.a05-bar,.a05-dot'), (node) => ({
      day: node.getAttribute('data-day'),
      x: node.getAttribute('x') ?? node.getAttribute('cx'),
      y: node.getAttribute('y') ?? node.getAttribute('cy'),
      selected: node.getAttribute('data-selected'),
    })),
    paths: Array.from(element.querySelectorAll<SVGPathElement>('.a05-line'), (node) => ({
      series: node.getAttribute('data-series'),
      d: node.getAttribute('d'),
    })),
  }
}
