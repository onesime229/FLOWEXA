import React, { useEffect, useRef } from 'react';
import { ClientEstablishment } from './clientData';

interface ClientInteractiveMapProps {
  establishments: ClientEstablishment[];
  selectedId?: string;
  onSelectEstablishment: (est: ClientEstablishment) => void;
  centerCity?: string;
  className?: string;
}

export const ClientInteractiveMap: React.FC<ClientInteractiveMapProps> = ({
  establishments,
  selectedId,
  onSelectEstablishment,
  centerCity = 'Cotonou',
  className = 'w-full h-full min-h-[420px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Default coordinates: Cotonou, Benin (6.3703, 2.4222)
  const defaultCoords: [number, number] = [6.3703, 2.4222];

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const L = (window as any).L;
    if (!L) {
      return;
    }

    if (!mapInstanceRef.current) {
      try {
        const map = L.map(container, {
          zoomControl: false,
          attributionControl: false,
        }).setView(defaultCoords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'topright' }).addTo(map);

        mapInstanceRef.current = map;
      } catch {
        // Safe fallback if Leaflet map fails to init
      }
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Define mock coordinates near Cotonou for establishments
    const coordinatesMap: Record<string, [number, number]> = {
      'biz-palma': [6.3601, 2.4082], // Cadjehoun
      'biz-haie-vive': [6.3575, 2.418], // Haie Vive
      'biz-barber-elegance': [6.368, 2.425], // Akpakpa
      'biz-citi-pressing': [6.381, 2.412], // Sainte Rita
      'biz-saveurs-benin': [6.355, 2.415], // Haie Vive
      'biz-spa-orchidee': [6.362, 2.401], // Cocotiers
      'biz-boutique-wax': [6.372, 2.435], // Ganhi
      'biz-auto-benin': [6.425, 2.348], // Abomey-Calavi
      'biz-artisan-fer': [6.395, 2.418], // Kouhounou
      'biz-sante-etoile': [6.375, 2.405], // Zogbo
    };

    establishments.forEach((est) => {
      const coords = coordinatesMap[est.id] || [
        defaultCoords[0] + (Math.random() - 0.5) * 0.04,
        defaultCoords[1] + (Math.random() - 0.5) * 0.04,
      ];

      const isSel = est.id === selectedId;

      // Custom HTML Pin
      const iconHtml = `
        <div style="
          background-color: ${isSel ? '#FB8205' : '#0794A0'};
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 11px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          white-space: nowrap;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 12px rgba(12,19,34,0.3);
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        ">
          <span>${est.priceStartingAt.toLocaleString('fr-FR')} F</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'fxa-map-pin',
        iconSize: [0, 0],
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        onSelectEstablishment(est);
      });

      markersRef.current.push(marker);
    });

    // Invalidate size in case of container size changes
    const timer = setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [establishments, selectedId, onSelectEstablishment]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E8EDF3] shadow-sm text-xs font-bold text-[#111827] flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#10D97F] animate-pulse" />
        <span>Bénin · {centerCity} · Rayon 5 km</span>
      </div>
    </div>
  );
};
