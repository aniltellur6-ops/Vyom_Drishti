import React, { useState } from 'react';
import { LUNARA_ASSETS } from '../data/sampleData';
import {
  Compass,
  Layers,
  MapPin,
  Sun,
  Globe2,
  Calendar,
  Eye,
  Database,
  CheckCircle2,
  Maximize,
} from 'lucide-react';

export const DatasetsView: React.FC = () => {
  const [selectedTile, setSelectedTile] = useState<string>('P0450');
  const [activeTarget, setActiveTarget] = useState<string>('shackleton');

  const tiles = [
    {
      id: 'P0450',
      label: 'M1115786064LE (P0450)',
      url: LUNARA_ASSETS.tileP0450,
      centerLat: "89°32'S",
      centerLon: "132°04'E",
      incidence: '82.4°',
      azimuth: '104.2°',
      emission: '2.1°',
      gsd: '0.50 m/px',
      phase: '81.9°',
    },
    {
      id: 'P1350',
      label: 'M1115786064RE (P1350)',
      url: LUNARA_ASSETS.tileP1350,
      centerLat: "89°35'S",
      centerLon: "132°18'E",
      incidence: '81.8°',
      azimuth: '105.1°',
      emission: '3.4°',
      gsd: '0.50 m/px',
      phase: '80.5°',
    },
    {
      id: 'P2250',
      label: 'M1115793140LE (P2250)',
      url: LUNARA_ASSETS.tileP2250,
      centerLat: "89°30'S",
      centerLon: "131°50'E",
      incidence: '79.2°',
      azimuth: '110.8°',
      emission: '1.9°',
      gsd: '0.50 m/px',
      phase: '78.6°',
    },
    {
      id: 'P3150',
      label: 'M1115793140RE (P3150)',
      url: LUNARA_ASSETS.tileP3150,
      centerLat: "89°33'S",
      centerLon: "132°02'E",
      incidence: '80.1°',
      azimuth: '109.4°',
      emission: '2.8°',
      gsd: '0.50 m/px',
      phase: '79.4°',
    },
  ];

  const currentTileData = tiles.find((t) => t.id === selectedTile) || tiles[0];

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-700" />
            Sensor Swaths, Geodetic Footprints &amp; SPICE Ephemeris
          </h2>
          <p className="text-xs text-slate-600">
            LROC NAC 4-Tile Reference Mosaic and Chandrayaan-2 OHRC Overlapping Swath (Shackleton Polar Stereographic Grid)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700">
            Datum: <span className="text-cyan-700">Moon 2000 (IAU/IAG)</span>
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700">
            Projection: <span className="text-amber-700">Polar Stereographic</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Mosaic & Swath Projection on Left, Metadata on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 4-Tile LROC Mosaic & Swath Footprint */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shadow-xl">
            <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-700" />
                4-Tile LROC NAC Mosaic Footprint (2x2 Quad)
              </span>
              <span className="text-xs font-mono text-cyan-700">
                Active Tile: {currentTileData.label}
              </span>
            </div>

            {/* 4-Tile Grid Display */}
            <div className="p-3 bg-slate-50">
              <div className="grid grid-cols-2 gap-2 relative">
                {tiles.map((tile) => {
                  const isSelected = tile.id === selectedTile;
                  return (
                    <div
                      key={tile.id}
                      onClick={() => setSelectedTile(tile.id)}
                      className={`relative rounded overflow-hidden aspect-video bg-black cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-cyan-400 shadow-md shadow-cyan-950'
                          : 'border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={tile.url}
                        alt={tile.label}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 bg-slate-50/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-slate-900 font-bold border border-slate-700">
                        {tile.id}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-slate-50/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-700">
                        {tile.centerLat}, {tile.centerLon}
                      </div>

                      {/* Overlapping OHRC Swath Indicator on P0450 / P3150 */}
                      {(tile.id === 'P0450' || tile.id === 'P3150') && (
                        <div className="absolute inset-x-8 inset-y-4 border border-dashed border-amber-400/80 bg-amber-500/10 pointer-events-none rounded flex items-center justify-center">
                          <span className="text-[9px] font-mono font-bold text-amber-300 bg-slate-50/90 px-1 py-0.2 rounded border border-amber-600">
                            CH-2 OHRC SWATH INTERSECT
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ground Track Telemetry Footer */}
            <div className="px-4 py-2 bg-white border-t border-slate-200 text-xs font-mono text-slate-600 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>CH-2 Orbit: #1042 (Desc. Equator Crossing 14:18 UTC)</span>
              </div>
              <div>Ground Track Velocity: 1.63 km/s</div>
            </div>
          </div>
        </div>

        {/* Right: Selected Tile & SPICE Ephemeris Inspector */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tile Details Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 font-mono text-xs">
            <div className="border-b border-slate-200 pb-2">
              <span className="text-slate-600 text-[10px] uppercase">Selected Image Product</span>
              <h3 className="font-bold text-slate-900 text-sm">{currentTileData.label}</h3>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Center Geodetic:</span>
                <span className="text-cyan-800 font-bold">
                  {currentTileData.centerLat}, {currentTileData.centerLon}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Solar Incidence (i):</span>
                <span className="text-amber-700 font-bold">{currentTileData.incidence}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Solar Azimuth:</span>
                <span className="text-slate-900">{currentTileData.azimuth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Emission Angle (e):</span>
                <span className="text-slate-900">{currentTileData.emission}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Phase Angle (g):</span>
                <span className="text-purple-400 font-bold">{currentTileData.phase}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Ground Sampling (GSD):</span>
                <span className="text-emerald-700 font-bold">{currentTileData.gsd}</span>
              </div>
            </div>
          </div>

          {/* SPICE Ephemeris Kernel Manifest */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-700" />
                SPICE KERNEL POOL (NAIF C-SPICE)
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">ALL LOADED</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                <div className="truncate">
                  <div className="text-cyan-800 font-bold">ch2_ohrc_v02.bsp</div>
                  <div className="text-slate-600 text-[10px]">CH-2 Ephemeris / Trajectory</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                <div className="truncate">
                  <div className="text-emerald-800 font-bold">lro_spice_v01.bsp</div>
                  <div className="text-slate-600 text-[10px]">LROC Spacecraft Ephemeris</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                <div className="truncate">
                  <div className="text-slate-700 font-bold">moon_pa_de421_1900-2050.bpc</div>
                  <div className="text-slate-600 text-[10px]">Binary Lunar Orientation PCK</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                <div className="truncate">
                  <div className="text-slate-700 font-bold">naif0012.tls</div>
                  <div className="text-slate-600 text-[10px]">Leapseconds Kernel (UTC ↔ TDB)</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
