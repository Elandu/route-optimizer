'use client';
import { useEffect, useRef, useMemo } from 'react';

interface Stop {
  id: string;
  address: string;
}

interface Props {
  start: string;
  stops: Stop[];
  directions?: google.maps.DirectionsResult | null;
  hoveredIndex?: number | null;
  selectedIndex?: number | null;
  onSelect?: (idx: number) => void;
}

export default function MapView({
  start,
  stops,
  directions,
  hoveredIndex,
  selectedIndex,
  onSelect,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const gmap = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const renderer = useRef<google.maps.DirectionsRenderer | null>(null);

  const defaultIcon = useMemo<google.maps.Icon>(
    () => ({
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#4285F4',
      fillOpacity: 0.9,
      strokeWeight: 1,
      strokeColor: '#ffffff',
    }),
    []
  );

  const highlightedIcon = useMemo<google.maps.Icon>(
    () => ({
      ...defaultIcon,
      scale: 12,
      fillColor: '#FFD700',
      strokeColor: '#000',
    }),
    [defaultIcon]
  );

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
            icon: defaultIcon,
            zIndex: i,
          });
          marker.addListener('click', () => onSelect?.(i));
          markers.current.push(marker);
        }
      });
    });
    if (hadMarkers && center && zoom) {
      gmap.current!.setCenter(center);
      gmap.current!.setZoom(zoom);
    }
  }, [start, stops, defaultIcon, onSelect]);

  useEffect(() => {
    markers.current.forEach((m, i) => {
      const highlight = i === hoveredIndex || i === selectedIndex;
      m.setIcon(highlight ? highlightedIcon : defaultIcon);
      m.setZIndex(highlight ? 999 : i);
    });
    if (selectedIndex != null) {
      const pos = markers.current[selectedIndex]?.getPosition();
      if (pos) {
        gmap.current?.panTo(pos);
      }
    }
  }, [hoveredIndex, selectedIndex, defaultIcon, highlightedIcon]);

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
