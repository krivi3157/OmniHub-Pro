import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  Thermometer, 
  CloudRain, 
  ShieldAlert, 
  Play, 
  Pause, 
  RefreshCw, 
  Flame, 
  CloudLightning,
  Waves,
  MapPin
} from 'lucide-react';

interface ThermalMapProps {
  lat?: number;
  lon?: number;
  city?: string;
  country?: string;
  temp?: number;
  condition?: string;
  windSpeed?: number;
  humidity?: number;
  precipitation?: number;
  unit?: 'C' | 'F' | 'K';
  isFullScreen?: boolean;
}

interface WeatherStation {
  name: string;
  x: number;
  y: number;
  tempOffset: number;
  windDir?: number;
  hazard?: {
    type: 'storm' | 'wildfire' | 'flood' | 'none';
    label: string;
    severity: 'moderate' | 'severe' | 'extreme';
  };
}

export const ThermalMap = ({
  city = 'London',
  country = 'United Kingdom',
  temp = 24,
  windSpeed = 12,
  humidity = 48,
  precipitation = 0,
  unit = 'C',
  isFullScreen = false
}: ThermalMapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeLayer, setActiveLayer] = useState<'temp' | 'radar' | 'hazards'>('temp');
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeOffset, setTimeOffset] = useState(0);
  const [animationTick, setAnimationTick] = useState(0);
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const transformRef = useRef(d3.zoomIdentity);

  // Convert Celsius to active unit
  const formatTemp = (celsiusVal: number) => {
    if (unit === 'F') {
      return `${Math.round((celsiusVal * 9) / 5 + 32)}°F`;
    }
    if (unit === 'K') {
      return `${Math.round(celsiusVal + 273.15)}K`;
    }
    return `${Math.round(celsiusVal)}°C`;
  };

  // Convert raw value based on unit for exact superimposed mockup labels
  const getTempRaw = (celsiusVal: number) => {
    if (unit === 'F') {
      return Math.round((celsiusVal * 9) / 5 + 32);
    }
    if (unit === 'K') {
      return Math.round(celsiusVal + 273.15);
    }
    return Math.round(celsiusVal);
  };

  // Generate localized regional stations once based on city/country
  useEffect(() => {
    const regionalStations: WeatherStation[] = [
      { name: `${city} Central`, x: 200, y: 60, tempOffset: 0 },
      { name: `${city} Metro North`, x: 140, y: 35, tempOffset: -2, hazard: { type: 'storm', label: 'Thunder Cell', severity: 'severe' } },
      { name: `${city} Airport East`, x: 280, y: 50, tempOffset: 1 },
      { name: `${city} Valley South`, x: 180, y: 85, tempOffset: 3, hazard: { type: 'flood', label: 'River Rise', severity: 'moderate' } },
      { name: `${city} Coastline`, x: 80, y: 70, tempOffset: -4 },
      { name: `${city} West Highlands`, x: 310, y: 25, tempOffset: -5, hazard: { type: 'wildfire', label: 'Dry Brush alert', severity: 'extreme' } },
    ];
    setStations(regionalStations);
  }, [city, country]);

  // Keep a loop running to simulate live radar and winds
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setAnimationTick((prev) => (prev + 1) % 360);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Draw the SVG Map and layers
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const height = 130;

    const defs = svg.append('defs');

    // Gradient 1: Thermal Temperature Palette (Mockup Spectrum)
    // Dark Blue -> Aqua -> Green -> Yellow -> Orange -> Deep Red -> Magenta
    const tempGrad = defs.append('linearGradient')
      .attr('id', 'thermalGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    tempGrad.append('stop').attr('offset', '0%').attr('stop-color', '#4a044e');   // Dark Purple (-50)
    tempGrad.append('stop').attr('offset', '15%').attr('stop-color', '#1e40af');  // Blue (-10)
    tempGrad.append('stop').attr('offset', '30%').attr('stop-color', '#06b6d4');  // Cyan (10)
    tempGrad.append('stop').attr('offset', '45%').attr('stop-color', '#10b981');  // Green (30)
    tempGrad.append('stop').attr('offset', '60%').attr('stop-color', '#eab308');  // Yellow (50)
    tempGrad.append('stop').attr('offset', '75%').attr('stop-color', '#f97316');  // Orange (70)
    tempGrad.append('stop').attr('offset', '90%').attr('stop-color', '#ef4444');  // Red (90)
    tempGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e'); // Deep Magenta (110)

    // Gradient 2: Precipitation Radar Palette
    const radarGrad = defs.append('linearGradient')
      .attr('id', 'radarGrad')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    radarGrad.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(16, 185, 129, 0)');
    radarGrad.append('stop').attr('offset', '40%').attr('stop-color', 'rgba(16, 185, 129, 0.4)');
    radarGrad.append('stop').attr('offset', '70%').attr('stop-color', 'rgba(234, 179, 8, 0.7)');
    radarGrad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(239, 68, 68, 0.9)');

    // Blur Filter for smoother weather blend
    const blurFilter = defs.append('filter')
      .attr('id', 'radarBlur')
      .append('feGaussianBlur')
      .attr('stdDeviation', 12);

    // 1. Draw stylized Regional Map Outline based on detected Country
    let mapPath = "M 20 40 Q 100 20 200 30 T 380 40 T 350 110 T 150 120 T 40 100 Z"; // Generic region
    const normalizedCountry = country.toLowerCase();
    
    if (normalizedCountry.includes('united states') || normalizedCountry.includes('america') || normalizedCountry.includes('us')) {
      // US style horizontal broad landmass
      mapPath = "M15,25 C60,20 120,30 180,15 C240,10 300,20 380,25 C390,55 385,85 345,95 C285,90 245,80 195,115 C145,125 85,110 45,90 C35,65 20,45 15,25 Z";
    } else if (normalizedCountry.includes('united kingdom') || normalizedCountry.includes('uk') || normalizedCountry.includes('ireland')) {
      // Vertical British Isles style shape
      mapPath = "M160,15 C180,25 170,45 190,55 C185,75 220,80 200,115 C150,120 130,90 145,70 C130,55 125,35 140,20 Z";
    } else if (normalizedCountry.includes('germany') || normalizedCountry.includes('france') || normalizedCountry.includes('europe')) {
      // European central block
      mapPath = "M45,25 C115,20 215,35 345,25 C365,55 375,95 335,115 C275,105 215,115 155,105 C95,115 55,95 45,25 Z";
    }

    // Create a container group for zooming
    const zoomGroup = svg.append('g').attr('class', 'zoom-layer')
      .attr('transform', transformRef.current.toString());
    
    // Setup D3 Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        zoomGroup.attr('transform', event.transform);
      });
      
    svg.call(zoom);

    // Map container group inside the zoom layer
    const mapGroup = zoomGroup.append('g');

    // Draw the Map Land Base
    const baseMap = mapGroup.append('path')
      .attr('d', mapPath)
      .attr('stroke', '#334155')
      .attr('stroke-width', 2.5)
      .attr('fill', '#0f172a'); // default deep obsidian sky fill

    // 2. LAYER-SPECIFIC RENDERING
    if (activeLayer === 'temp') {
      // Smooth high-contrast thermography overlay
      baseMap
        .attr('fill', 'url(#thermalGrad)')
        .attr('opacity', 0.85);

      // Draw subtle county/state borders mimicking detailed meteorological outlines
      mapGroup.append('path')
        .attr('d', mapPath)
        .attr('stroke', 'rgba(255, 255, 255, 0.15)')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none');

      // Superimpose state/county division grid lines internally
      const numLines = 6;
      for (let i = 1; i < numLines; i++) {
        mapGroup.append('line')
          .attr('x1', (width / numLines) * i)
          .attr('y1', 15)
          .attr('x2', (width / numLines) * i + (Math.sin(i) * 15))
          .attr('y2', height - 15)
          .attr('stroke', 'rgba(255,255,255,0.08)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3');
      }

    } else if (activeLayer === 'radar') {
      // Doppler Radar Scan Layer
      baseMap.attr('fill', '#0b0f19');

      // Animated Rain Doppler Blobs
      const radarGroup = mapGroup.append('g').attr('filter', 'url(#radarBlur)');
      
      // We draw 3 active precipitation storm systems that slowly drift with the animation tick
      const driftX = (animationTick * 0.4) % width;
      const driftY = (animationTick * 0.2) % height;

      // Storm Cell 1 (Severe core - red centered)
      const storm1 = radarGroup.append('g')
        .attr('transform', `translate(${(120 + driftX) % width}, ${(40 + driftY) % height})`);
      storm1.append('circle').attr('r', 45).attr('fill', 'rgba(16, 185, 129, 0.55)');
      storm1.append('circle').attr('r', 30).attr('fill', 'rgba(234, 179, 8, 0.75)');
      storm1.append('circle').attr('r', 15).attr('fill', 'rgba(239, 68, 68, 0.9)');

      // Storm Cell 2 (Light/Moderate rain band)
      const storm2 = radarGroup.append('g')
        .attr('transform', `translate(${(260 + driftX * 0.8) % width}, ${80 - (driftY * 0.5) % height})`);
      storm2.append('circle').attr('r', 55).attr('fill', 'rgba(16, 185, 129, 0.45)');
      storm2.append('circle').attr('r', 25).attr('fill', 'rgba(234, 179, 8, 0.6)');

      // Rotating Radar Sweep Line
      const sweepAngle = (animationTick * 3) % 360;
      const radarSweepCenter = { x: 200, y: 65 };
      const sweepLength = 220;
      const sweepRad = (sweepAngle * Math.PI) / 180;
      
      zoomGroup.append('line')
        .attr('x1', radarSweepCenter.x)
        .attr('y1', radarSweepCenter.y)
        .attr('x2', radarSweepCenter.x + sweepLength * Math.cos(sweepRad))
        .attr('y2', radarSweepCenter.y + sweepLength * Math.sin(sweepRad))
        .attr('stroke', '#10b981')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.6)
        .attr('stroke-dasharray', '2,2');

      // Interactive Radar sweeping concentric circles
      zoomGroup.append('circle')
        .attr('cx', radarSweepCenter.x)
        .attr('cy', radarSweepCenter.y)
        .attr('r', 60)
        .attr('stroke', 'rgba(16, 185, 129, 0.15)')
        .attr('fill', 'none');
      zoomGroup.append('circle')
        .attr('cx', radarSweepCenter.x)
        .attr('cy', radarSweepCenter.y)
        .attr('r', 110)
        .attr('stroke', 'rgba(16, 185, 129, 0.08)')
        .attr('fill', 'none');

    } else if (activeLayer === 'hazards') {
      // Environmental Hazards Outline (Atmospheric Alerts & Extreme Events)
      baseMap.attr('fill', '#020617')
        .attr('stroke', '#ef4444')
        .attr('stroke-opacity', 0.5);

      // Atmospheric drift contours (showing severe isobaric wind pressure lines)
      const contourGroup = mapGroup.append('g');
      for (let k = 0; k < 3; k++) {
        contourGroup.append('path')
          .attr('d', mapPath)
          .attr('transform', `scale(${1 - k * 0.15}) translate(${(k * 30)}, ${(k * 10)})`)
          .attr('stroke', k === 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(234, 179, 8, 0.15)')
          .attr('stroke-width', 1.5)
          .attr('fill', 'none');
      }

      // Render flashing storm cores
      stations.forEach((station) => {
        if (station.hazard && station.hazard.type !== 'none') {
          const glowColor = 
            station.hazard.severity === 'extreme' ? '#f43f5e' :
            station.hazard.severity === 'severe' ? '#ef4444' : '#eab308';

          // Flashing ripple rings
          zoomGroup.append('circle')
            .attr('cx', station.x)
            .attr('cy', station.y)
            .attr('r', 8 + (animationTick % 12) * 1.5)
            .attr('stroke', glowColor)
            .attr('stroke-opacity', 1 - (animationTick % 12) / 12)
            .attr('stroke-width', 1.5)
            .attr('fill', 'none');
        }
      });
    }

    // 3. DRAW WEATHER STATIONS (Interactive pinheads with superimposed temperatures)
    const stationPins = zoomGroup.selectAll('.station')
      .data(stations)
      .enter()
      .append('g')
      .attr('class', 'station cursor-pointer')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    // Outer radar glowing point for active location center
    stationPins.each(function(d) {
      const isCenter = d.name.includes('Central');
      const container = d3.select(this);

      if (isCenter) {
        container.append('circle')
          .attr('r', 12)
          .attr('fill', 'rgba(234, 179, 8, 0.15)')
          .attr('stroke', '#eab308')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2');
      }

      // Small anchor dot
      container.append('circle')
        .attr('r', 3)
        .attr('fill', isCenter ? '#eab308' : '#38bdf8');

      // Station local offset temperature (highly accurate mockup design)
      const stationCelsius = temp + d.tempOffset;
      const tempLabel = getTempRaw(stationCelsius);

      // Superimpose bold text temperature label directly on map! (Exactly like the US mockup)
      container.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .text(tempLabel)
        .attr('font-size', '10px')
        .attr('font-weight', '900')
        .attr('font-family', 'monospace')
        .attr('stroke', '#090d16')
        .attr('stroke-width', 2)
        .attr('paint-order', 'stroke fill');

      // Station Subtitle (Tiny abbreviated city name)
      const shortName = d.name.replace(city, '').trim() || 'Core';
      container.append('text')
        .attr('x', 0)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .attr('fill', isCenter ? '#f59e0b' : '#94a3b8')
        .text(shortName ? `${city.substring(0, 3)} ${shortName.substring(0, 5)}` : city)
        .attr('font-size', '7px')
        .attr('font-family', 'monospace');
      
      // If there's a live hazardous weather event warning, render an event-specific mini-icon
      if (activeLayer === 'hazards' && d.hazard && d.hazard.type !== 'none') {
        const hazardBg = d.hazard.severity === 'extreme' ? '#f43f5e' : d.hazard.severity === 'severe' ? '#ef4444' : '#eab308';
        
        container.append('rect')
          .attr('x', -20)
          .attr('y', -24)
          .attr('width', 40)
          .attr('height', 8)
          .attr('rx', 2)
          .attr('fill', hazardBg)
          .attr('opacity', 0.95);

        container.append('text')
          .attr('x', 0)
          .attr('y', -18)
          .attr('text-anchor', 'middle')
          .attr('fill', '#000000')
          .text(d.hazard.label.toUpperCase())
          .attr('font-size', '5px')
          .attr('font-weight', '900')
          .attr('font-family', 'sans-serif');
      }
    });

  }, [activeLayer, animationTick, city, country, temp, unit]);

  return (
    <div className="space-y-2 mt-2">
      {/* 1. Header Toolbar Control Grid */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveLayer('temp')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black tracking-wider transition-all cursor-pointer ${
              activeLayer === 'temp' 
                ? 'bg-yellow-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Thermometer className="w-2.5 h-2.5" />
            THERMAL
          </button>
          
          <button 
            onClick={() => setActiveLayer('radar')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black tracking-wider transition-all cursor-pointer ${
              activeLayer === 'radar' 
                ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CloudRain className="w-2.5 h-2.5" />
            DOPPLER
          </button>

          <button 
            onClick={() => setActiveLayer('hazards')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black tracking-wider transition-all cursor-pointer ${
              activeLayer === 'hazards' 
                ? 'bg-rose-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-2.5 h-2.5" />
            HAZARDS
          </button>
        </div>

        {/* Play/Pause simulation buttons */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Stream" : "Resume Live Scan"}
            className="p-1 rounded bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
          </button>
          <button 
            onClick={() => setAnimationTick(prev => (prev + 30) % 360)}
            title="Advance forecast clock"
            className="p-1 rounded bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* 2. Primary Map Display Stage */}
      <div className={`relative bg-slate-950 rounded-xl border border-slate-850 overflow-hidden shadow-inner flex flex-col flex-1 min-h-0 ${isFullScreen ? 'h-full flex-1' : 'h-32'}`}>
        <svg 
          ref={svgRef} 
          className="w-full h-full rounded-lg" 
          viewBox="0 0 400 130" 
          preserveAspectRatio="xMidYMid slice"
        />
        
        {/* Dynamic Watermark HUD and active localization title */}
        <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-1 rounded border border-slate-850 backdrop-blur-sm pointer-events-none select-none">
          <span className="text-[7px] text-slate-500 block uppercase tracking-wider font-mono">STATION FOCUS</span>
          <span className="text-[8px] font-black text-slate-300 font-mono tracking-tight flex items-center gap-1 uppercase">
            <MapPin className="w-2 h-2 text-yellow-500" />
            {city}, {country.substring(0, 16)}
          </span>
        </div>

        <div className="absolute bottom-2 right-2 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-850 pointer-events-none select-none font-mono">
          <span className="text-[6px] text-emerald-400 font-black animate-pulse uppercase">
            {activeLayer === 'temp' && '● HEATWAVE CONTOR LINES'}
            {activeLayer === 'radar' && '● LIVE DOPPLER CLOUD BAND'}
            {activeLayer === 'hazards' && '● DANGER EVENTS UPLINK'}
          </span>
        </div>
      </div>

      {/* 3. Meteorological Legend Spectrum Bar (Exactly like Mockup) */}
      <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-850/60 space-y-1">
        <div className="flex justify-between text-[7px] text-slate-500 uppercase tracking-widest font-mono font-bold">
          {activeLayer === 'temp' && (
            <>
              <span>FRIGID ({formatTemp(-10)})</span>
              <span>STABLE ({formatTemp(15)})</span>
              <span>WARM ({formatTemp(30)})</span>
              <span>ALERT ({formatTemp(45)})</span>
            </>
          )}
          {activeLayer === 'radar' && (
            <>
              <span>CLEAR (0 mm)</span>
              <span>DRIZZLE (2 mm)</span>
              <span>DOPPLER CORES (15 mm)</span>
              <span>STORMS (50+ mm)</span>
            </>
          )}
          {activeLayer === 'hazards' && (
            <>
              <span>STABLE / NO HAZARDS</span>
              <span>ELEVATED WARN</span>
              <span>CRITICAL EMERGENCY</span>
            </>
          )}
        </div>
        
        {/* Color stripe gradient rendering */}
        <div className={`h-1.5 w-full rounded-full ${
          activeLayer === 'temp' ? 'bg-gradient-to-r from-purple-900 via-blue-600 via-cyan-400 via-green-500 via-yellow-400 via-orange-500 to-red-600' :
          activeLayer === 'radar' ? 'bg-gradient-to-r from-slate-900 via-emerald-600 via-yellow-500 to-red-600' :
          'bg-gradient-to-r from-slate-900 via-yellow-500/40 via-red-500/60 to-rose-600'
        }`} />
      </div>
    </div>
  );
};
