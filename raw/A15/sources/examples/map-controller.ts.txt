import * as L from 'leaflet'
import type { Location } from './location-data'

type MarkerRecord = {
  marker: L.CircleMarker
  click: () => void
  label: string
}

function popupContent(location: Location) {
  const popup = document.createElement('div')
  const heading = document.createElement('strong')
  heading.textContent = location.label
  const detail = document.createElement('p')
  detail.textContent = `${location.city} · ${location.status === 'online' ? '已启用' : '已暂停'}`
  popup.append(heading, detail)
  return popup
}

/** Browser-only Leaflet owner. No tileLayer or provider request is created here. */
export function createMapController(
  host: HTMLElement,
  choose: (id: string) => void,
  changed: () => void,
) {
  const mount = document.createElement('div')
  mount.className = 'a15-owned-map'
  mount.dataset.testid = 'a15-owned-map'
  mount.dataset.mapRemoved = 'false'
  mount.dataset.unloadEvents = '0'
  mount.setAttribute('role', 'region')
  mount.setAttribute('aria-label', '可平移缩放的Leaflet点位地图')
  mount.tabIndex = 0
  host.append(mount)
  const map = L.map(mount, {
    scrollWheelZoom: false,
    keyboard: true,
    zoomControl: true,
    attributionControl: false,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
    inertia: false,
    minZoom: 2,
    maxZoom: 8,
  }).setView([39.5, -98], 4, { animate: false })
  const grid = L.layerGroup().addTo(map)
  for (const longitude of [-130, -120, -110, -100, -90, -80, -70]) {
    L.polyline(
      [
        [25, longitude],
        [51, longitude],
      ],
      {
        color: '#dce8dd',
        weight: 1,
        interactive: false,
      },
    ).addTo(grid)
  }
  for (const latitude of [25, 30, 35, 40, 45, 50]) {
    L.polyline(
      [
        [latitude, -132],
        [latitude, -67],
      ],
      {
        color: '#dce8dd',
        weight: 1,
        interactive: false,
      },
    ).addTo(grid)
  }
  const group = L.layerGroup().addTo(map)
  const route = L.polyline([], {
    color: '#739787',
    weight: 2,
    dashArray: '5 5',
    interactive: false,
  })
  const markers = new Map<string, MarkerRecord>()
  let disposed = false
  let resizeFrame = 0
  let resizeEvents = 0
  let unloadEvents = 0
  const notify = () => {
    if (!disposed) changed()
  }
  const onResize = () => {
    resizeEvents++
    notify()
  }
  const onUnload = () => {
    mount.dataset.unloadEvents = String(++unloadEvents)
  }
  map.on('moveend zoomend popupopen popupclose', notify)
  map.on('resize', onResize)
  map.once('unload', onUnload)
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame)
    if (disposed || mount.clientWidth < 1 || mount.clientHeight < 1) return
    resizeFrame = requestAnimationFrame(() => {
      if (disposed) return
      map.invalidateSize({ pan: false, animate: false })
      notify()
    })
  })
  observer.observe(mount)

  function removeMarker(id: string, record: MarkerRecord) {
    record.marker.off('click', record.click)
    record.marker.closePopup()
    record.marker.unbindPopup()
    group.removeLayer(record.marker)
    record.marker.off()
    markers.delete(id)
  }

  return {
    synchronize(locations: readonly Location[], selected: string) {
      if (disposed) return
      const visibleIds = new Set(locations.map((location) => location.id))
      for (const [id, record] of markers) if (!visibleIds.has(id)) removeMarker(id, record)
      for (const location of locations) {
        let record = markers.get(location.id)
        if (!record) {
          const marker = L.circleMarker(location.center).addTo(group)
          const click = () => choose(location.id)
          marker.on('click', click)
          record = { marker, click, label: '' }
          markers.set(location.id, record)
        }
        const { marker } = record
        if (!marker.getLatLng().equals(location.center)) marker.setLatLng(location.center)
        marker.setRadius(location.id === selected ? 12 : 8)
        marker.setStyle({
          weight: location.id === selected ? 3 : 1,
          color: '#285e46',
          fillColor: location.status === 'online' ? '#5db47b' : '#b8a38a',
          fillOpacity: 0.9,
        })
        const label = JSON.stringify([location.label, location.city, location.status])
        if (record.label !== label) {
          marker.bindPopup(popupContent(location), { autoPan: false })
          record.label = label
        }
        marker.getElement()?.setAttribute('data-location-id', location.id)
      }
      route.setLatLngs(locations.map((location) => location.center))
      if (locations.length > 1 && !group.hasLayer(route)) group.addLayer(route)
      if (locations.length < 2 && group.hasLayer(route)) group.removeLayer(route)
      notify()
    },
    focus(id: string) {
      const record = markers.get(id)
      if (disposed || !record) return
      map.panTo(record.marker.getLatLng(), { animate: false })
      record.marker.openPopup()
      notify()
    },
    fitVisible() {
      if (disposed || markers.size === 0) return
      map.fitBounds(L.latLngBounds([...markers.values()].map(({ marker }) => marker.getLatLng())), {
        padding: [24, 24],
        maxZoom: 5,
        animate: false,
      })
      notify()
    },
    resetView() {
      if (disposed) return
      map.setView([39.5, -98], 4, { animate: false })
      notify()
    },
    observe() {
      const size = map.getSize()
      const center = map.getCenter()
      const bounds = map.getBounds()
      let tileLayers = 0
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) tileLayers++
      })
      return {
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
        size: [size.x, size.y],
        bounds: {
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        },
        resizeEvents,
        tileLayers,
        gridLayers: grid.getLayers().length,
        groupLayers: group.getLayers().length,
        points: [...markers].map(([id, { marker }]) => {
          const latlng = marker.getLatLng()
          const point = map.latLngToContainerPoint(latlng)
          return {
            id,
            layerId: group.getLayerId(marker),
            latlng: [latlng.lat, latlng.lng],
            geojsonCoordinates: marker.toGeoJSON().geometry.coordinates,
            containerPoint: [point.x, point.y],
            radius: marker.getRadius(),
            inGroup: group.hasLayer(marker),
            popupOpen: marker.isPopupOpen(),
          }
        }),
        route: route
          .getLatLngs()
          .filter((point): point is L.LatLng => point instanceof L.LatLng)
          .map((point) => [point.lat, point.lng]),
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      observer.disconnect()
      cancelAnimationFrame(resizeFrame)
      map.off('moveend zoomend popupopen popupclose', notify)
      map.off('resize', onResize)
      try {
        for (const [id, record] of markers) removeMarker(id, record)
        route.off()
        group.clearLayers()
        grid.clearLayers()
        map.remove()
        mount.dataset.mapRemoved = 'true'
      } catch (error) {
        mount.dataset.cleanupError = String(error)
        throw error
      } finally {
        mount.remove()
      }
    },
  }
}

export type MapController = ReturnType<typeof createMapController>
