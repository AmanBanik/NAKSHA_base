'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

L.Icon.Default.imagePath = '/images/';

interface MapProps {
    geoJsonPolygon: any;
    center?: [number, number];
    isEditing?: boolean;
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

export default function CadastralMap({ geoJsonPolygon, center, isEditing, onPolygonChange }: MapProps) {
    const [points, setPoints] = useState<[number, number][]>([]);

    useEffect(() => {
        // Load initial geojson points if available
        if (geoJsonPolygon && geoJsonPolygon.coordinates && geoJsonPolygon.coordinates[0]) {
            const rawCoords = geoJsonPolygon.coordinates[0];
            const leafletCoords = rawCoords.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
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

    let mapCenter = center || [22.5726, 88.3639]; // Default to Kolkata if empty
    if (!center && points.length > 0) {
        const lats = points.map(c => c[0]);
        const lngs = points.map(c => c[1]);
        mapCenter = [
            (Math.min(...lats) + Math.max(...lats)) / 2,
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
        ];
    }

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative' }}>
            <MapContainer center={mapCenter} zoom={18} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {isEditing && <ClickHandler onMapClick={handleMapClick} />}
                
                {points.length > 0 && (
                    <Polygon positions={points} pathOptions={{ color: isEditing ? '#f59e0b' : '#10b981', fillColor: isEditing ? '#f59e0b' : '#10b981', fillOpacity: 0.4 }}>
                        {!isEditing && <Popup>Verified Land Boundary</Popup>}
                    </Polygon>
                )}
                
                {isEditing && points.map((p, i) => (
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
