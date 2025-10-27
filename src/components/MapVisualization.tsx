import React from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Zone {
  code: string;
  name: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  color: string;
  avgLevel: number;
}

const zones: Zone[] = [
  {
    code: 'A',
    name: 'Urban (Delhi)',
    bounds: [[28.6, 77.1], [28.8, 77.3]],
    center: [28.7, 77.2],
    color: '#3B82F6',
    avgLevel: 11.8,
  },
  {
    code: 'B',
    name: 'Agricultural (Lucknow)',
    bounds: [[26.4, 80.3], [26.6, 80.5]],
    center: [26.5, 80.4],
    color: '#10B981',
    avgLevel: 26.6,
  },
  {
    code: 'C',
    name: 'Coastal (Chennai)',
    bounds: [[12.9, 80.1], [13.1, 80.3]],
    center: [13.0, 80.2],
    color: '#06B6D4',
    avgLevel: 6.9,
  },
  {
    code: 'D',
    name: 'Arid (Jaipur)',
    bounds: [[26.8, 75.7], [27.0, 75.9]],
    center: [26.9, 75.8],
    color: '#F59E0B',
    avgLevel: 8.8,
  },
];

interface MapVisualizationProps {
  selectedLocation?: { lat: number; lon: number };
  onLocationSelect?: (lat: number, lon: number) => void;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({ selectedLocation, onLocationSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20">
        <h3 className="text-xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Aquifer Zone Map
        </h3>
        <p className="text-xs text-gray-400 mt-1">Click on a zone to select location</p>
      </div>
      
      {/* Map */}
      <div className="h-96 relative">
        <MapContainer
          center={[20.5937, 78.9629]} // Center of India
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Zone Boundaries */}
          {zones.map((zone) => (
            <React.Fragment key={zone.code}>
              <Rectangle
                bounds={zone.bounds}
                pathOptions={{
                  color: zone.color,
                  weight: 2,
                  fillColor: zone.color,
                  fillOpacity: 0.2,
                }}
                eventHandlers={{
                  click: () => {
                    if (onLocationSelect) {
                      onLocationSelect(zone.center[0], zone.center[1]);
                    }
                  },
                }}
              />
              <Marker position={zone.center}>
                <Popup>
                  <div className="p-2">
                    <h4 className="font-bold text-lg">{zone.name}</h4>
                    <p className="text-sm text-gray-600">Zone {zone.code}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p><strong>Avg Level:</strong> {zone.avgLevel.toFixed(2)}m</p>
                      <p><strong>Coordinates:</strong> {zone.center[0].toFixed(2)}°, {zone.center[1].toFixed(2)}°</p>
                    </div>
                    <button
                      onClick={() => onLocationSelect && onLocationSelect(zone.center[0], zone.center[1])}
                      className="mt-2 w-full bg-cyan-500 text-white px-3 py-1 rounded text-xs hover:bg-cyan-600"
                    >
                      Select Location
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
          
          {/* Selected Location Marker */}
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold">Selected Location</h4>
                  <p className="text-xs">{selectedLocation.lat.toFixed(4)}°, {selectedLocation.lon.toFixed(4)}°</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      
      {/* Legend */}
      <div className="p-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 border-t border-cyan-500/20">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {zones.map((zone) => (
            <div key={zone.code} className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: zone.color }} />
              <span className="text-gray-300">{zone.name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MapVisualization;
