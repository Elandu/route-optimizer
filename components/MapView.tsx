'use client';
import { useEffect, useRef } from 'react';

interface Stop {
  id: string;
  address: string;
}

interface Props {
  start: string;
  stops: Stop[];
  directions?: google.maps.DirectionsResult | null;
}

export default function MapView({ start, stops, directions }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const gmap = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const renderer = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    function init() {
      if (!window.google || !mapRef.current || gmap.current) return;
      gmap.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: -25.2744, lng: 133.7751 },
        zoom: 5,
      });
      renderer.current = new window.google.maps.DirectionsRenderer();
      renderer.current!.setMap(gmap.current);
    }
    if (window.google) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          init();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (!window.google) return;
    if (!gmap.current) {
      if (mapRef.current) {
        gmap.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: -25.2744, lng: 133.7751 },
          zoom: 5,
        });
      } else {
        return;
      }
    }
    const geocoder = new window.google.maps.Geocoder();
    markers.current.forEach(m => m.setMap(null));
    markers.current = [];
    const all = [start, ...stops.map(s => s.address)].filter(Boolean);
    if (all.length === 0) {
      gmap.current.setCenter({ lat: -25.2744, lng: 133.7751 });
      gmap.current.setZoom(5);
      return;
    }
    all.forEach((addr, i) => {
      geocoder.geocode({ address: addr }, (res: any, status: string) => {
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

  useEffect(() => {
    if (!renderer.current) return;
    if (directions) {
      renderer.current.setDirections(directions);
    } else {
      renderer.current.set('directions', null);
    }
  }, [directions]);

  return <div ref={mapRef} className="w-full h-64 border" />;
}
