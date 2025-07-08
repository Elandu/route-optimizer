'use client';
import { useEffect, useRef } from 'react';

interface Stop {
  id: string;
  address: string;
}

interface Props {
  start: string;
  stops: Stop[];
}

export default function MapView({ start, stops }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const gmap = useRef<google.maps.Map>();
  const markers = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;
    if (!gmap.current) {
      gmap.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
      });
    }
  }, []);

  useEffect(() => {
    if (!gmap.current || !window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    markers.current.forEach(m => m.setMap(null));
    markers.current = [];
    const all = [start, ...stops.map(s => s.address)].filter(Boolean);
    if (all.length === 0) return;
    all.forEach((addr, i) => {
      geocoder.geocode({ address: addr }, (res, status) => {
        if (status === 'OK' && res[0]) {
          if (i === 0) gmap.current!.setCenter(res[0].geometry.location);
          const marker = new window.google.maps.Marker({
            map: gmap.current!,
            position: res[0].geometry.location,
            label: i === 0 && start ? 'S' : String(i),
          });
          markers.current.push(marker);
        }
      });
    });
  }, [start, stops]);

  return <div ref={mapRef} className="w-full h-64 border" />;
}
