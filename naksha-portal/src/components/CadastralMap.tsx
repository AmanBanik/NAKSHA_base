'use client';

import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icon issue in Next.js (though we only use polygons here, it's good practice)
import L from 'leaflet';
L.Icon.Default.imagePath = '/images/';

interface MapProps {
    geoJsonPolygon: any;
    center?: [number, number];
}

export default function CadastralMap({ geoJsonPolygon, center }: MapProps) {
    if (!geoJsonPolygon || !geoJsonPolygon.coordinates) {
        return <div className="p-4 bg-gray-50 border rounded-lg text-gray-500 text-center">No spatial data available for this record.</div>;
    }

    // GeoJSON Polygon coordinates are typically [[[lng, lat], [lng, lat], ...]]
    // Leaflet Polygon expects [[lat, lng], [lat, lng], ...]
    const rawCoords = geoJsonPolygon.coordinates[0];
    const leafletCoords = rawCoords.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);

    // Calculate center if not provided (simple bounding box center)
    let mapCenter = center;
    if (!mapCenter) {
        const lats = leafletCoords.map((c: [number, number]) => c[0]);
        const lngs = leafletCoords.map((c: [number, number]) => c[1]);
        mapCenter = [
            (Math.min(...lats) + Math.max(...lats)) / 2,
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
        ];
    }

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <MapContainer center={mapCenter} zoom={18} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polygon positions={leafletCoords} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.4 }}>
                    <Popup>
                        Verified Land Boundary
                    </Popup>
                </Polygon>
            </MapContainer>
        </div>
    );
}
