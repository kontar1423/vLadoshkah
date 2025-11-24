import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MAP_SRC = '/maps/moscow-districts.svg';

const numberToRegion = {
  1: 'cao',
  2: 'sao',
  3: 'svao',
  4: 'vao',
  5: 'yuvao',
  6: 'yao',
  7: 'yuzao',
  8: 'zao',
  9: 'szao',
  10: 'zelao',
  11: 'nao',
  12: 'tinao',
};

const colorConfigByNumber = {
  1: { name: 'Центральный', hex: '#F7B7C7' },
  2: { name: 'Северный', hex: '#F7E7A9' },
  3: { name: 'Северо-Восточный', hex: '#F4E8C5' },
  4: { name: 'Восточный', hex: '#C4E7B7' },
  5: { name: 'Юго-Восточный', hex: '#C4F0F3' },
  6: { name: 'Южный', hex: '#CADAFA' },
  7: { name: 'Юго-Западный', hex: '#C8B9F8' },
  8: { name: 'Западный', hex: '#E6BAE9' },
  9: { name: 'Северо-Западный', hex: '#E5C29B' },
  10: { name: 'Зеленоградский', hex: '#E8A873' },
  11: { name: 'Новомосковский', hex: '#C7F4C3' },
  12: { name: 'Троицкий', hex: '#F3F76C' },
};

const fallbackAnchors = {
  cao: { x: 0.52, y: 0.48 },
  sao: { x: 0.52, y: 0.24 },
  szao: { x: 0.34, y: 0.26 },
  svao: { x: 0.66, y: 0.27 },
  vao: { x: 0.72, y: 0.46 },
  yuvao: { x: 0.7, y: 0.6 },
  yao: { x: 0.54, y: 0.66 },
  yuzao: { x: 0.42, y: 0.64 },
  zao: { x: 0.32, y: 0.48 },
  zelao: { x: 0.14, y: 0.18 },
  tinao: { x: 0.2, y: 0.86 },
  nao: { x: 0.6, y: 0.86 },
};

const majorPathIds = [
  'path4281-23',
  'path1345',
  'path4281-17',
  'path4281-14',
  'path1177',
  'path1288',
  'path1155',
  'path1202',
  'path1232',
  'path4281-7-5',
  'path4247-4',
  'path4409',
];

const manualBindings = {};

const getFill = (el) => {
  const fillAttr = el.getAttribute('fill');
  if (fillAttr && fillAttr !== 'none') return fillAttr.trim().toLowerCase();
  const style = el.getAttribute('style') || '';
  const match = style.match(/fill:\s*([^;]+)/i);
  if (match && match[1] && match[1].trim() !== 'none') return match[1].trim().toLowerCase();
  return null;
};

const euclid = (ax, ay, bx, by) => Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);

const DistrictFilter = ({ isOpen, onClose, onApplyFilter }) => {
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [legendColors, setLegendColors] = useState({});
  const mapRef = useRef(null);
  const svgRootRef = useRef(null);
  const pathBindingsRef = useRef(new Map());
  const regionBindingsRef = useRef(new Map());
  const regionColorRef = useRef(new Map());
  const labelAnchorsRef = useRef(new Map());
  const selectedRef = useRef([]);

  const districts = useMemo(
    () =>
      Object.entries(colorConfigByNumber).reduce((acc, [num, cfg]) => {
        const id = numberToRegion[Number(num)];
        if (!id) return acc;
        acc.push({ id, num: Number(num), name: cfg.name, color: cfg.hex });
        return acc;
      }, []),
    [],
  );

  const colorToRegionId = useMemo(() => {
    const acc = {};
    Object.entries(colorConfigByNumber).forEach(([num, cfg]) => {
      const id = numberToRegion[Number(num)];
      if (id && cfg.hex) acc[cfg.hex.toLowerCase()] = id;
    });
    return acc;
  }, []);

  const toggleRegion = useCallback((regionId) => {
    setSelectedDistricts((prev) =>
      prev.includes(regionId) ? prev.filter((id) => id !== regionId) : [...prev, regionId],
    );
  }, []);

  const normalizeSize = useCallback(() => {
    const svg = svgRootRef.current;
    if (!svg) return;
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.maxWidth = '100%';
    svg.style.maxHeight = '100%';
    svg.style.display = 'block';
  }, []);

  const standardizeStyle = useCallback((el) => {
    el.style.pointerEvents = 'visiblePainted';
  }, []);

  const bindPath = useCallback(
    (el, regionId, color) => {
      const pathBindings = pathBindingsRef.current;
      const regionBindings = regionBindingsRef.current;
      const regionColor = regionColorRef.current;
      if (pathBindings.has(el)) return;
      pathBindings.set(el, regionId);
      if (!regionBindings.has(regionId)) regionBindings.set(regionId, new Set());
      regionBindings.get(regionId).add(el);
      if (color) regionColor.set(regionId, color);
    },
    [],
  );

  const applyManualBindings = useCallback(
    (paths) => {
      Object.entries(manualBindings).forEach(([regionId, ids]) => {
        ids.forEach((pathId) => {
          const el = paths.find((p) => p.id === pathId);
          if (el) {
            standardizeStyle(el);
            bindPath(el, regionId, getFill(el));
          }
        });
      });
    },
    [bindPath, standardizeStyle],
  );

  const collectLabelAnchors = useCallback((svg, viewBox) => {
    labelAnchorsRef.current.clear();
    const seenNumbers = new Set();
    Array.from(svg.querySelectorAll('text')).forEach((textEl) => {
      const value = parseInt((textEl.textContent || '').trim(), 10);
      if (!numberToRegion[value] || seenNumbers.has(value)) return;
      const box = textEl.getBBox();
      labelAnchorsRef.current.set(numberToRegion[value], { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      seenNumbers.add(value);
    });

    if (viewBox) {
      Object.entries(fallbackAnchors).forEach(([regionId, anchor]) => {
        if (!labelAnchorsRef.current.has(regionId)) {
          labelAnchorsRef.current.set(regionId, { x: anchor.x * viewBox.width, y: anchor.y * viewBox.height });
        }
      });
    }
  }, []);

  const makeSvgPoint = useCallback((pt) => {
    const svg = svgRootRef.current;
    if (!svg?.createSVGPoint) return null;
    const p = svg.createSVGPoint();
    p.x = pt.x;
    p.y = pt.y;
    return p;
  }, []);

  const findBestPathForAnchor = useCallback(
    (anchor, candidates) => {
      if (!anchor || !candidates?.length) return null;
      const point = makeSvgPoint(anchor);
      if (point) {
        const hit = candidates.find((el) => typeof el.isPointInFill === 'function' && el.isPointInFill(point));
        if (hit) return hit;
      }
      let best;
      candidates.forEach((el) => {
        const b = el.getBBox();
        const dist = euclid(anchor.x, anchor.y, b.x + b.width / 2, b.y + b.height / 2);
        if (!best || dist < best.dist) best = { el, dist };
      });
      return best?.el || null;
    },
    [makeSvgPoint],
  );

  const bindByLabels = useCallback(
    (paths, viewBox) => {
      const anchors = new Map(labelAnchorsRef.current);
      if (!anchors.size) return;
      const majors = paths.filter((p) => majorPathIds.includes(p.id));
      anchors.forEach((anchor, regionId) => {
        const target = findBestPathForAnchor(anchor, majors);
        if (!target) return;
        standardizeStyle(target);
        bindPath(target, regionId, getFill(target));
      });
    },
    [bindPath, findBestPathForAnchor, standardizeStyle],
  );

  const bindRemainingByColor = useCallback(
    (paths, viewBox) => {
      const anchors = labelAnchorsRef.current.size
        ? new Map(labelAnchorsRef.current)
        : new Map(
            Object.entries(fallbackAnchors).map(([regionId, a]) => [
              regionId,
              { x: a.x * viewBox.width, y: a.y * viewBox.height },
            ]),
          );

      const anchorEntries = Array.from(anchors.entries());

      const pickRegion = (fill, center) => {
        const normFill = (fill || '').toLowerCase();
        const matchingColor = anchorEntries.filter(
          ([regionId]) => (regionColorRef.current.get(regionId) || '').toLowerCase() === normFill,
        );
        const pool = matchingColor.length ? matchingColor : anchorEntries;
        if (!pool.length) return null;
        let best;
        pool.forEach(([regionId, anchor]) => {
          const dist = euclid(
            anchor.x / viewBox.width,
            anchor.y / viewBox.height,
            center.x / viewBox.width,
            center.y / viewBox.height,
          );
          if (!best || dist < best.dist) best = { regionId, dist };
        });
        return best?.regionId || null;
      };

      paths.forEach((el) => {
        if (pathBindingsRef.current.has(el)) return;
        const fill = getFill(el);
        if (!fill) return;
        standardizeStyle(el);
        const b = el.getBBox();
        const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        const regionId = pickRegion(fill, center);
        if (regionId) {
          bindPath(el, regionId, fill);
        }
      });
    },
    [bindPath, standardizeStyle],
  );

  const assignByColor = useCallback(
    (paths, viewBox) => {
      if (!svgRootRef.current) return;
      const vb = viewBox || svgRootRef.current.viewBox?.baseVal;
      if (vb) collectLabelAnchors(svgRootRef.current, vb);

      paths.forEach((el) => {
        if (pathBindingsRef.current.has(el)) return;
        const fill = getFill(el);
        if (!fill) return;
        const regionId = colorToRegionId[fill.toLowerCase()];
        if (!regionId) return;
        standardizeStyle(el);
        bindPath(el, regionId, fill);
      });

      if (vb) {
        bindByLabels(paths, vb);
        bindRemainingByColor(paths, vb);
      }
    },
    [bindByLabels, bindPath, bindRemainingByColor, collectLabelAnchors, colorToRegionId, standardizeStyle],
  );

  const colorizePaths = useCallback(
    (selectedList) => {
      const selectedSet = new Set(selectedList);
      pathBindingsRef.current.forEach((regionId, el) => {
        const conf = districts.find((d) => d.id === regionId);
        const regionFill = regionColorRef.current.get(regionId) || conf?.color;
        const isActive = selectedSet.has(regionId);
        el.style.fill = regionFill || '#dbe7d8';
        el.style.opacity = isActive ? '1' : '0.9';
        el.style.stroke = '#00381f';
        el.style.strokeWidth = isActive ? '2.2' : '1.3';
        el.style.transition = 'fill 150ms ease, opacity 150ms ease, stroke-width 150ms ease';
        el.style.cursor = 'pointer';
        el.style.pointerEvents = 'visiblePainted';
      });
    },
    [districts],
  );

  const bindHandlers = useCallback(() => {
    pathBindingsRef.current.forEach((regionId, el) => {
      el.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.parentNode?.appendChild?.(el);
        toggleRegion(regionId);
      };
      el.onmouseenter = () => {
        el.style.opacity = '1';
        el.style.strokeWidth = '2.5';
      };
      el.onmouseleave = () => {
        colorizePaths(selectedRef.current);
      };
    });
  }, [colorizePaths, toggleRegion]);

  const applyLegendPalette = useCallback(() => {
    const palette = {};
    districts.forEach((d) => {
      palette[d.id] = regionColorRef.current.get(d.id) || d.color;
    });
    setLegendColors(palette);
  }, [districts]);

  useEffect(() => {
    selectedRef.current = selectedDistricts;
    colorizePaths(selectedDistricts);
  }, [selectedDistricts, colorizePaths]);

  useEffect(() => {
    const mapEl = mapRef.current;
    if (!mapEl) return;

    const handleLoad = () => {
      pathBindingsRef.current.forEach((_, el) => {
        el.onclick = null;
        el.onmouseenter = null;
        el.onmouseleave = null;
      });
      pathBindingsRef.current.clear();
      regionBindingsRef.current.clear();
      regionColorRef.current.clear();
      labelAnchorsRef.current.clear();

      const svg = mapEl.contentDocument?.querySelector('svg');
      svgRootRef.current = svg;
      if (!svg) return;

      normalizeSize();

      const paths = Array.from(svg.querySelectorAll('path'));
      paths.forEach((p) => {
        p.style.pointerEvents = 'none';
        p.style.cursor = 'default';
        p.style.strokeLinejoin = 'round';
        p.style.strokeLinecap = 'round';
      });

      applyManualBindings(paths);
      assignByColor(paths, svg.viewBox?.baseVal);
      applyLegendPalette();
      bindHandlers();
      colorizePaths(selectedRef.current);

      const missing = districts.filter((d) => !regionBindingsRef.current.has(d.id));
      if (missing.length) {
        console.warn(
          `Не удалось автоматически привязать: ${missing.map((m) => m.id).join(', ')}. Добавьте id path в manualBindings при необходимости.`,
        );
      }
    };

    mapEl.addEventListener('load', handleLoad);
    return () => {
      mapEl.removeEventListener('load', handleLoad);
    };
  }, [applyLegendPalette, applyManualBindings, assignByColor, bindHandlers, colorizePaths, districts, normalizeSize]);

  useEffect(() => {
    const handleResize = () => normalizeSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [normalizeSize]);

  const handleApply = () => {
    if (selectedDistricts.length > 0) {
      const selectedDistrictNames = selectedDistricts.map((id) => districts.find((d) => d.id === id)?.name);
      onApplyFilter({
        districts: selectedDistrictNames,
        districtIds: selectedDistricts,
      });
    }
    onClose();
  };

  const handleReset = () => {
    setSelectedDistricts([]);
    onApplyFilter({ districts: [], districtIds: [] });
    onClose();
  };

  const legendColorFor = (regionId) =>
    legendColors[regionId] || districts.find((district) => district.id === regionId)?.color || '#cce8cf';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-green-95 rounded-custom w-full max-w-6xl flex flex-col items-start gap-6 p-8 relative max-h-[90vh] overflow-y-auto shadow-xl">
        <header className="flex items-center justify-between self-stretch w-full gap-4">
          <div>
            <h1 className="text-3xl font-sf-rounded font-bold text-green-30">Выберите округа Москвы</h1>
            <p className="text-green-40 font-inter mt-1">
              Карта подключена из файла 2.html и повторяет интерактив из макета map.html.
            </p>
          </div>
          <button
            onClick={onClose}
            className="relative w-8 h-8 cursor-pointer text-green-40 hover:text-green-30 transition-colors"
            aria-label="Закрыть фильтры"
          >
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="w-full bg-white rounded-custom-small p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-inter text-green-30 font-semibold">Карта округов Москвы</p>
                <p className="text-green-50 text-sm font-inter">
                  Источник карты: <code className="bg-green-90 px-2 py-0.5 rounded">/maps/moscow-districts.svg</code>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedDistricts.length === 0 ? (
                  <span className="text-green-50 text-sm font-inter">Нажмите на округ, чтобы выделить его.</span>
                ) : (
                  selectedDistricts.map((regionId) => {
                    const district = districts.find((d) => d.id === regionId);
                    const color = legendColorFor(regionId);
                    return (
                      <span
                        key={regionId}
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-green-90 border border-green-80 text-green-30 text-sm"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-green-30"
                          style={{ backgroundColor: color }}
                        />
                        {district?.name || regionId}
                        <button
                          onClick={() => toggleRegion(regionId)}
                          className="text-green-40 hover:text-green-20"
                          aria-label={`Убрать ${district?.name || regionId}`}
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.8fr_1fr] gap-4 items-start">
              <div className="rounded-custom-small border border-green-80 bg-green-95 overflow-hidden aspect-[4/3] min-h-[360px]">
                <object
                  ref={mapRef}
                  data={MAP_SRC}
                  type="image/svg+xml"
                  aria-label="Карта Москвы"
                  className="w-full h-full"
                />
              </div>

              <aside className="bg-green-95 rounded-custom-small p-3 flex flex-col gap-3 border border-green-80">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-sf-rounded font-semibold text-green-30 text-base">Легенда округов</p>
                  <span className="text-green-50 text-xs font-inter">Кликните, чтобы выбрать</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {districts.map((district) => {
                    const isActive = selectedDistricts.includes(district.id);
                    const color = legendColorFor(district.id);
                    return (
                      <button
                        key={district.id}
                        type="button"
                        onClick={() => toggleRegion(district.id)}
                        aria-pressed={isActive}
                        className={`flex items-center gap-2 p-2 rounded-custom-small border text-left transition-colors ${
                          isActive
                            ? 'bg-green-80 border-green-60 text-green-20 shadow-sm'
                            : 'bg-white border-green-80 text-green-30 hover:bg-green-90'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-green-30"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-inter text-sm leading-tight">{district.name}</span>
                      </button>
                    );
                  })}
                </div>
              </aside>
            </div>
          </div>
        </div>

        <div className="w-full">
          <h3 className="font-sf-rounded font-bold text-green-30 text-lg mb-3">
            Округа Москвы ({selectedDistricts.length} выбрано)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {districts.map((district) => {
              const isActive = selectedDistricts.includes(district.id);
              const color = legendColorFor(district.id);
              return (
                <button
                  key={district.id}
                  type="button"
                  className={`flex items-center gap-2 p-2 rounded-custom-small cursor-pointer transition-colors border ${
                    isActive ? 'bg-green-80 border-green-60 text-green-20' : 'bg-green-90 border-transparent text-green-30'
                  }`}
                  onClick={() => toggleRegion(district.id)}
                >
                  <span className="w-4 h-4 rounded-sm border border-green-30" style={{ backgroundColor: color }} />
                  <span className="font-inter text-green-30 text-sm">{district.name}</span>
                  {isActive && (
                    <svg className="w-4 h-4 text-green-40 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 self-stretch justify-end pt-4 border-t border-green-80 w-full">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 bg-green-80 rounded-[20px] text-green-40 hover:bg-green-70 font-medium transition-colors"
          >
            Сбросить все
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={selectedDistricts.length === 0}
            className={`px-6 py-3 rounded-[20px] font-medium transition-colors ${
              selectedDistricts.length > 0
                ? 'bg-green-70 text-green-20 hover:bg-green-60 cursor-pointer'
                : 'bg-green-80 text-green-60 cursor-not-allowed'
            }`}
          >
            Применить ({selectedDistricts.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistrictFilter;
