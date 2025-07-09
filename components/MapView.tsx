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

  const indexToLabel = (i: number) => {
    if (i === 0) return '0';
    return String.fromCharCode('A'.charCodeAt(0) + i - 1);
  };

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
    const zoom = gmap.current!.getZoom();
    const center = gmap.current!.getCenter();
    const hadMarkers = markers.current.length > 0;
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];
    const all = [start, ...stops.map((s) => s.address)].filter(Boolean);
    if (all.length === 0) {
      gmap.current!.setCenter({ lat: -25.2744, lng: 133.7751 });
      gmap.current!.setZoom(5);
      return;
    }
    all.forEach((addr, i) => {
      geocoder.geocode({ address: addr }, (res: any, status: string) => {
        if (status === 'OK' && res[0]) {
          if (!hadMarkers && i === 0) gmap.current!.setCenter(res[0].geometry.location);
          const marker = new window.google.maps.Marker({
            map: gmap.current!,
            position: res[0].geometry.location,
            label: indexToLabel(i),
          });
          markers.current.push(marker);
        }
      });
    });
    if (hadMarkers && center && zoom) {
      gmap.current!.setCenter(center);
      gmap.current!.setZoom(zoom);
    }
  }, [start, stops]);

  useEffect(() => {
    if (!renderer.current) return;
    const zoom = gmap.current?.getZoom();
    const center = gmap.current?.getCenter();
    if (directions) {
      renderer.current.setDirections(directions);
    } else {
      renderer.current.set('directions', null);
    }
    if (zoom && center) {
      gmap.current?.setCenter(center);
      gmap.current?.setZoom(zoom);
    }
  }, [directions]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full overflow-hidden"
    />
  );
}
