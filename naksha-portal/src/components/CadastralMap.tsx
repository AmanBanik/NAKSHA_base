'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix missing Leaflet markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
    geoJsonPolygon: any;
    center?: [number, number];
    isEditing?: boolean;
    isFullscreen?: boolean;
    onPolygonChange?: (geoJson: any) => void;
}

// Map event listener component to capture clicks
function ClickHandler({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

// Fixes Leaflet's gray tile bug when dynamically resizing containers
function ResizeHandler({ isFullscreen }: { isFullscreen?: boolean }) {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 300); // 300ms allows the browser DOM to finish expanding
        return () => clearTimeout(timer);
    }, [isFullscreen, map]);
    return null;
}

// Automatically fly to the bounds of the drawn polygon as points are added
function AutoZoomHandler({ points }: { points: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        const validPoints = points.filter(p => Array.isArray(p) && p.length >= 2 && p[0] != null && p[1] != null && !isNaN(p[0]) && !isNaN(p[1]));
        if (validPoints.length > 0) {
            const bounds = L.latLngBounds(validPoints);
            // Don't zoom out too far if it's just one point, but fly smoothly
            map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 18, duration: 0.8 });
        }
    }, [points, map]);
    return null;
}

export default function CadastralMap({ geoJsonPolygon, center, isEditing, isFullscreen, onPolygonChange }: MapProps) {
    const [points, setPoints] = useState<[number, number][]>([]);

    useEffect(() => {
        // Load initial geojson points if available
        if (geoJsonPolygon && geoJsonPolygon.coordinates && geoJsonPolygon.coordinates[0]) {
            const rawCoords = geoJsonPolygon.coordinates[0];
            let leafletCoords = rawCoords.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
            
            // If the polygon is closed (first and last point are identical), remove the last point for editing
            if (leafletCoords.length >= 4) {
                const first = leafletCoords[0];
                const last = leafletCoords[leafletCoords.length - 1];
                if (first[0] === last[0] && first[1] === last[1]) {
                    leafletCoords.pop();
                }
            }
            setPoints(leafletCoords);
        } else {
            setPoints([]);
        }
    }, [geoJsonPolygon]);

    const handleMapClick = (latlng: L.LatLng) => {
        if (!isEditing) return;
        const newPoints = [...points, [latlng.lat, latlng.lng] as [number, number]];
        setPoints(newPoints);
        
        if (onPolygonChange) {
            // Convert to GeoJSON format: [[lng, lat]]
            // Note: GeoJSON polygons must be closed (first and last point same), but we can just send the ring.
            const geoJsonCoords = newPoints.map(p => [p[1], p[0]]);
            if (newPoints.length >= 3) {
                // Close the loop for valid GeoJSON
                geoJsonCoords.push(geoJsonCoords[0]);
            }
            onPolygonChange({
                type: 'Polygon',
                coordinates: [geoJsonCoords]
            });
        }
    };

    const validPoints = points.filter(p => Array.isArray(p) && p.length >= 2 && p[0] != null && p[1] != null && !isNaN(p[0]) && !isNaN(p[1]));

    let mapCenter = center || [22.5726, 88.3639]; // Default to Kolkata if empty
    if (!center && validPoints.length > 0) {
        const lats = validPoints.map(c => c[0]);
        const lngs = validPoints.map(c => c[1]);
        mapCenter = [
            (Math.min(...lats) + Math.max(...lats)) / 2,
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
        ] as [number, number];
    }

    return (
        <div style={{ height: isFullscreen ? '100%' : '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative' }}>
            <MapContainer center={mapCenter as [number, number]} zoom={18} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <ResizeHandler isFullscreen={isFullscreen} />
                <AutoZoomHandler points={points} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {isEditing && <ClickHandler onMapClick={handleMapClick} />}
                
                {validPoints.length > 0 && (
                    <Polygon positions={validPoints} pathOptions={{ color: isEditing ? '#f59e0b' : '#10b981', fillColor: isEditing ? '#f59e0b' : '#10b981', fillOpacity: 0.4 }}>
                        {!isEditing && <Popup>Verified Land Boundary</Popup>}
                    </Polygon>
                )}
                
                {isEditing && validPoints.map((p, i) => (
                    <Marker key={i} position={p} />
                ))}
            </MapContainer>
            {isEditing && (
                <div className="absolute top-2 right-2 z-[400] bg-white px-3 py-1.5 rounded shadow text-xs font-bold text-slate-700 pointer-events-none">
                    Drawing Mode: Click map to place points
                </div>
            )}
        </div>
    );
}
