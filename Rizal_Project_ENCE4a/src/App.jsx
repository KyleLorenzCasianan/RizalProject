import { useEffect, useMemo, useState } from 'react'
import {
  geoGraticule,
  geoMercator,
  geoNaturalEarth1,
  geoPath,
} from 'd3-geo'
import { feature } from 'topojson-client'
import land110m from 'world-atlas/land-110m.json'
import philippinesGeoJson from './assets/philippines-50m.geo.json'
import './App.css'

const WORLD_WIDTH = 1000
const WORLD_HEIGHT = 500
const PH_WIDTH = 700
const PH_HEIGHT = 900
const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 1.2

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const mapTabs = [
  {
    key: 'world',
    label: 'World Map',
    title: 'Jose Rizal Across the World',
    subtitle: 'Follow his studies, activism, writing, and exile beyond the Philippines.',
    points: [
      {
        id: 'calamba',
        name: 'Calamba, Laguna',
        years: '1861-1872',
        lon: 121.165,
        lat: 14.211,
        what: 'Rizal was born here and developed his early love for learning, nature, and reform ideas from family influence.',
        during: 'While he was growing up, the Philippines was under Spanish colonial rule, and the Cavite Mutiny period would soon intensify repression and reform debates.',
      },
      {
        id: 'singapore',
        name: 'Singapore',
        years: '1882 (en route)',
        lon: 103.8198,
        lat: 1.3521,
        what: 'Rizal passed through Singapore on his first voyage to Europe, observing a major trading port shaped by global commerce.',
        during: 'British colonial trade networks were transforming Asian port cities, showing Rizal a model of rapid urban and commercial development.',
      },
      {
        id: 'barcelona',
        name: 'Barcelona, Spain',
        years: '1882',
        lon: 2.1734,
        lat: 41.3851,
        what: 'He arrived in Spain and began writing for reform publications, including pieces advocating civil liberties for Filipinos.',
        during: 'Spain was experiencing political contestation between conservatives and liberals, which influenced reform discourse in the empire.',
      },
      {
        id: 'madrid',
        name: 'Madrid, Spain',
        years: '1882-1885',
        lon: -3.7038,
        lat: 40.4168,
        what: 'He studied medicine and philosophy at Universidad Central and joined reform circles that shaped his political thought.',
        during: 'The Propaganda Movement gained momentum, with Filipino students and intellectuals using print culture to argue for representation and rights.',
      },
      {
        id: 'paris',
        name: 'Paris, France',
        years: '1885-1886',
        lon: 2.3522,
        lat: 48.8566,
        what: 'Rizal trained under leading ophthalmologists and expanded his multilingual and scientific interests.',
        during: 'Paris was a center of scientific progress and republican thought, exposing Rizal to new ideas in medicine, arts, and politics.',
      },
      {
        id: 'heidelberg',
        name: 'Heidelberg, Germany',
        years: '1886',
        lon: 8.6724,
        lat: 49.3988,
        what: 'He refined his medical specialization and completed key sections of Noli Me Tangere while abroad.',
        during: 'German universities and scholarly circles gave Rizal access to rigorous research culture that shaped his nationalist writing style.',
      },
      {
        id: 'berlin',
        name: 'Berlin, Germany',
        years: '1886-1887',
        lon: 13.405,
        lat: 52.52,
        what: 'Rizal worked to secure publication support for Noli Me Tangere and built links with scholars interested in Philippine history.',
        during: 'Berlin was a major imperial capital in Europe, where industrial and political modernity strongly contrasted with conditions in the colony.',
      },
      {
        id: 'london',
        name: 'London, United Kingdom',
        years: '1888-1889',
        lon: -0.1276,
        lat: 51.5072,
        what: 'He researched at the British Museum and annotated Antonio de Morga to recover a pre-colonial Filipino historical perspective.',
        during: 'Late-Victorian Britain was at the height of global influence; debates on empire and liberalism framed Rizal\'s comparative thinking.',
      },
      {
        id: 'brussels',
        name: 'Brussels, Belgium',
        years: '1890',
        lon: 4.3517,
        lat: 50.8503,
        what: 'Rizal continued writing El Filibusterismo in Brussels while managing financial constraints and political pressure.',
        during: 'Across Europe, social and nationalist movements were reshaping politics, reinforcing Rizal\'s urgency for reform at home.',
      },
      {
        id: 'hong-kong',
        name: 'Hong Kong',
        years: '1891-1892',
        lon: 114.1694,
        lat: 22.3193,
        what: 'He practiced medicine, assisted fellow Filipinos, and continued writing and organizing reformist support.',
        during: 'Hong Kong served as a strategic refuge and communication hub for expatriate Filipinos under intensifying Spanish surveillance.',
      },
      {
        id: 'yokohama',
        name: 'Yokohama, Japan',
        years: '1888',
        lon: 139.638,
        lat: 35.4437,
        what: 'Rizal stayed in Yokohama and admired Japan\'s modernization, discipline, and strong national identity.',
        during: 'Meiji-era Japan was rapidly modernizing, offering Rizal a living example of Asian reform without Western colonization.',
      },
    ],
  },
  {
    key: 'philippines',
    label: 'Philippines Map',
    title: 'Jose Rizal in the Philippines',
    subtitle: 'Key places in his homeland where his life and legacy took decisive turns.',
    points: [
      {
        id: 'manila',
        name: 'Manila',
        years: '1872-1882, 1892',
        lon: 120.9842,
        lat: 14.5995,
        what: 'He studied at Ateneo and UST, and later founded La Liga Filipina to pursue peaceful reforms.',
        during: 'Manila was the colonial center where censorship, clerical power, and social inequality were most visible to young reformists.',
      },
      {
        id: 'binan',
        name: 'Biñan, Laguna',
        years: 'Early schooling',
        lon: 121.0819,
        lat: 14.3334,
        what: 'Rizal studied in Biñan under Maestro Justiniano Aquino Cruz, sharpening his academic discipline at an early age.',
        during: 'Provincial education in this period reflected class and racial hierarchies that later became targets of Rizal\'s critique.',
      },
      {
        id: 'dapitan',
        name: 'Dapitan, Zamboanga',
        years: '1892-1896',
        lon: 123.4244,
        lat: 8.6549,
        what: 'During exile, Rizal built a school, practiced medicine, designed civic projects, and served the community.',
        during: 'Even in exile, he demonstrated practical nation-building through education, sanitation, and local development projects.',
      },
      {
        id: 'cebu',
        name: 'Cebu (transit)',
        years: '1892',
        lon: 123.8854,
        lat: 10.3157,
        what: 'Rizal passed through the Visayas en route to exile, a reminder that his fate was being decided by colonial authorities.',
        during: 'Inter-island movement of political prisoners reflected how the colonial state controlled dissent across the archipelago.',
      },
      {
        id: 'fort-santiago',
        name: 'Fort Santiago',
        years: '1896',
        lon: 120.9712,
        lat: 14.5975,
        what: 'He was imprisoned here before trial, writing final letters and preparing for his final sacrifice.',
        during: 'As the Philippine Revolution spread, colonial authorities accelerated prosecutions and symbolic punishment of reform leaders.',
      },
      {
        id: 'bagumbayan',
        name: 'Bagumbayan (Luneta)',
        years: 'December 30, 1896',
        lon: 120.9822,
        lat: 14.5827,
        what: 'Rizal was executed here, inspiring generations in the struggle for national freedom and identity.',
        during: 'His execution transformed him into a unifying symbol, strengthening nationalist resolve during the revolution.',
      },
      {
        id: 'calamba-ph',
        name: 'Calamba, Laguna',
        years: 'Childhood and Returns',
        lon: 121.165,
        lat: 14.211,
        what: 'His hometown remained central to his social awareness, especially on agrarian injustice and colonial abuse.',
        during: 'The Calamba agrarian conflict deepened his conviction that social reform required structural political change.',
      },
    ],
  },
]

function App() {
  const [activeTab, setActiveTab] = useState('world')
  const [isLocationFocusOpen, setIsLocationFocusOpen] = useState(false)
  const [isAboutPageOpen, setIsAboutPageOpen] = useState(false)
  const [zoomByMap, setZoomByMap] = useState({
    world: { scale: 1, x: 0, y: 0 },
    philippines: { scale: 1, x: 0, y: 0 },
  })
  const [isDraggingMap, setIsDraggingMap] = useState(false)
  const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 })
  const activeMap = useMemo(
    () => mapTabs.find((tab) => tab.key === activeTab) ?? mapTabs[0],
    [activeTab],
  )

  const [activePointId, setActivePointId] = useState(mapTabs[0].points[0].id)

  useEffect(() => {
    setActivePointId(activeMap.points[0].id)
    setIsLocationFocusOpen(false)
    setIsAboutPageOpen(false)
  }, [activeMap])

  const activePoint =
    activeMap.points.find((point) => point.id === activePointId) ??
    activeMap.points[0]

  const worldLand = useMemo(
    () => feature(land110m, land110m.objects.land),
    [],
  )

  const philippinesGeo = useMemo(
    () => philippinesGeoJson,
    [],
  )

  const worldProjection = useMemo(() => {
    const projection = geoNaturalEarth1()
    projection.fitSize([WORLD_WIDTH, WORLD_HEIGHT], worldLand)
    return projection
  }, [worldLand])

  const philippinesProjection = useMemo(() => {
    const projection = geoMercator()
    if (philippinesGeo) {
      projection.fitExtent(
        [
          [80, 60],
          [PH_WIDTH - 80, PH_HEIGHT - 60],
        ],
        philippinesGeo,
      )
    }
    return projection
  }, [philippinesGeo])

  const getPinPosition = (point) => {
    const isWorld = activeMap.key === 'world'
    const projection = isWorld ? worldProjection : philippinesProjection
    const [x = 0, y = 0] = projection([point.lon, point.lat]) ?? []
    const width = isWorld ? WORLD_WIDTH : PH_WIDTH
    const height = isWorld ? WORLD_HEIGHT : PH_HEIGHT

    return {
      left: `${Math.min(Math.max((x / width) * 100, 2), 98)}%`,
      top: `${Math.min(Math.max((y / height) * 100, 2), 98)}%`,
    }
  }

  const updateActiveMapZoom = (updater) => {
    setZoomByMap((prev) => ({
      ...prev,
      [activeMap.key]: updater(prev[activeMap.key]),
    }))
  }

  const isMapControlInteraction = (target) =>
    target instanceof Element && Boolean(target.closest('.map-controls'))

  const handleMapWheel = (event) => {
    if (isMapControlInteraction(event.target)) {
      return
    }

    event.preventDefault()

    const rect = event.currentTarget.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top

    updateActiveMapZoom((current) => {
      const scaleFactor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
      const newScale = clamp(current.scale * scaleFactor, MIN_ZOOM, MAX_ZOOM)

      if (newScale === current.scale) {
        return current
      }

      const newX = pointerX - ((pointerX - current.x) * newScale) / current.scale
      const newY = pointerY - ((pointerY - current.y) * newScale) / current.scale

      return { scale: newScale, x: newX, y: newY }
    })
  }

  const handlePointerDown = (event) => {
    if (isMapControlInteraction(event.target)) {
      return
    }

    if (event.button !== 0) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDraggingMap(true)
    setLastPointer({ x: event.clientX, y: event.clientY })
  }

  const handlePointerMove = (event) => {
    if (!isDraggingMap) {
      return
    }

    const deltaX = event.clientX - lastPointer.x
    const deltaY = event.clientY - lastPointer.y

    setLastPointer({ x: event.clientX, y: event.clientY })
    updateActiveMapZoom((current) => ({
      ...current,
      x: current.x + deltaX,
      y: current.y + deltaY,
    }))
  }

  const stopDraggingMap = () => {
    setIsDraggingMap(false)
  }

  const zoomIn = () => {
    updateActiveMapZoom((current) => ({
      ...current,
      scale: clamp(current.scale * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM),
    }))
  }

  const zoomOut = () => {
    updateActiveMapZoom((current) => ({
      ...current,
      scale: clamp(current.scale / ZOOM_STEP, MIN_ZOOM, MAX_ZOOM),
    }))
  }

  const resetZoom = () => {
    updateActiveMapZoom(() => ({ scale: 1, x: 0, y: 0 }))
  }

  return (
    <main className="rizal-app">
      <header className="hero-panel">
        <p className="eyebrow">Interactive Learning Experience</p>
        <h1>Jose Rizal Travel Atlas</h1>
      </header>

      {isAboutPageOpen ? (
        <section className="about-page" aria-label="About this page">
          <button
            className="back-button"
            onClick={() => setIsAboutPageOpen(false)}
          >
            Back to Map
          </button>
          <h2>About this page</h2>
          <p>
            This page is an interactive learning atlas about Jose Rizal. It helps
            you explore the places he lived in, traveled to, studied in, and wrote
            from, while showing what happened in those locations and why they
            mattered in Philippine history.
          </p>
          <p>
            Use the World Map and Philippines Map tabs to compare local and global
            contexts, click map markers for location-specific summaries, and open
            View Details for deeper narrative content.
          </p>
        </section>
      ) : isLocationFocusOpen ? (
        <section className="location-focus" aria-label="Focused location details">
          <button
            className="back-button"
            onClick={() => setIsLocationFocusOpen(false)}
          >
            Back to Map
          </button>

          <p className="detail-label">Focused Rizal Location</p>
          <h2>{activePoint.name}</h2>
          <p className="year-chip">{activePoint.years}</p>
          <p className="focus-copy">{activePoint.what}</p>
          <p className="focus-copy">
            <strong>Wider context:</strong> {activePoint.during}
          </p>

          <div className="focus-context">
            <p>
              This location is part of the <strong>{activeMap.label}</strong> journey.
              Use the back button to continue exploring other Rizal locations.
            </p>
          </div>
        </section>
      ) : (
        <section className="tab-shell" aria-label="Map selector">
          <div className="tab-bar" role="tablist" aria-label="Choose map view">
            {mapTabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="map-grid">
            <article className={`map-board ${activeTab}`}>
              <div className="map-title-wrap">
                <h2>{activeMap.title}</h2>
                <p>{activeMap.subtitle}</p>
              </div>

              <div
                className={`map-canvas ${activeMap.key} ${isDraggingMap ? 'dragging' : ''}`}
                aria-label={`${activeMap.label} with Rizal locations`}
                onWheel={handleMapWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDraggingMap}
                onPointerCancel={stopDraggingMap}
              >
                <div
                  className="map-zoom-layer"
                  style={{
                    transform: `translate(${zoomByMap[activeMap.key].x}px, ${zoomByMap[activeMap.key].y}px) scale(${zoomByMap[activeMap.key].scale})`,
                  }}
                >
                  {activeMap.key === 'world' ? (
                    <WorldMapSvg worldLand={worldLand} projection={worldProjection} />
                  ) : (
                    <PhilippinesMapSvg
                      philippinesGeo={philippinesGeo}
                      projection={philippinesProjection}
                    />
                  )}

                  {activeMap.points.map((point) => (
                    <button
                      key={point.id}
                      className={`pin ${activePoint.id === point.id ? 'selected' : ''}`}
                      style={{
                        ...getPinPosition(point),
                        '--label-x': `${point.labelDx ?? 0}px`,
                        '--label-y': `${point.labelDy ?? 0}px`,
                      }}
                      onClick={() => setActivePointId(point.id)}
                      aria-label={`View ${point.name}`}
                    />
                  ))}
                </div>

                <div
                  className="map-controls"
                  role="group"
                  aria-label="Map zoom controls"
                  onPointerDown={(event) => event.stopPropagation()}
                  onWheel={(event) => event.stopPropagation()}
                >
                  <button type="button" onClick={zoomIn} aria-label="Zoom in">
                    +
                  </button>
                  <button type="button" onClick={zoomOut} aria-label="Zoom out">
                    -
                  </button>
                  <button type="button" onClick={resetZoom} aria-label="Reset zoom">
                    Reset
                  </button>
                </div>
              </div>
            </article>

            <div className="side-column">
              <div className="side-top-actions">
                <button
                  className="focus-button"
                  onClick={() => {
                    setIsAboutPageOpen(true)
                    setIsLocationFocusOpen(false)
                  }}
                >
                  About this page
                </button>
                <button
                  className="focus-button"
                  onClick={() => {
                    setIsLocationFocusOpen(true)
                    setIsAboutPageOpen(false)
                  }}
                >
                  View Details
                </button>
              </div>

              <aside className="details-panel">
                <div className="details-header-row">
                  <p className="detail-label">Selected Location</p>
                </div>
                <h3>{activePoint.name}</h3>
                <p className="year-chip">{activePoint.years}</p>
                <p>{activePoint.what}</p>

                <div className="trail-scroll">
                  <h4>Rizal Trail</h4>
                  <ul className="trail-list">
                    {activeMap.points.map((point) => (
                      <li key={`${activeMap.key}-${point.id}`}>
                        <button
                          className={`trail-item ${activePoint.id === point.id ? 'current' : ''}`}
                          onClick={() => setActivePointId(point.id)}
                        >
                          <strong>{point.name}</strong>
                          <span>{point.years}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      <section className="footer-note">
        <p>
          Tip: Click map pins or items in the Rizal Trail to switch stories and
          compare his impact by region.
        </p>
      </section>
    </main>
  )
}

function WorldMapSvg({ worldLand, projection }) {
  const pathGen = useMemo(() => geoPath(projection), [projection])
  const graticulePath = useMemo(() => {
    const graticule = geoGraticule().step([20, 20])
    return pathGen(graticule())
  }, [pathGen])

  return (
    <svg
      className="map-svg"
      viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
      role="presentation"
      aria-hidden="true"
    >
      <rect className="map-ocean" x="0" y="0" width={WORLD_WIDTH} height={WORLD_HEIGHT} />
      <path className="graticule-path" d={graticulePath} />
      <path className="world-land" d={pathGen(worldLand) ?? ''} />
    </svg>
  )
}

function PhilippinesMapSvg({ philippinesGeo, projection }) {
  const pathGen = useMemo(() => geoPath(projection), [projection])
  const graticulePath = useMemo(() => {
    const graticule = geoGraticule()
      .extent([
        [116, 4],
        [127, 22],
      ])
      .step([1, 1])
    return pathGen(graticule())
  }, [pathGen])

  return (
    <svg
      className="map-svg"
      viewBox={`0 0 ${PH_WIDTH} ${PH_HEIGHT}`}
      role="presentation"
      aria-hidden="true"
    >
      <rect className="map-ocean" x="0" y="0" width={PH_WIDTH} height={PH_HEIGHT} />
      <path className="graticule-path" d={graticulePath} />
      {philippinesGeo ? (
        <path className="ph-country" d={pathGen(philippinesGeo) ?? ''} />
      ) : null}
    </svg>
  )
}

export default App
