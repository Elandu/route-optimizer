'use client';
import { useEffect, useRef } from 'react';
import { useLoadScript, type Libraries } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES: Libraries = ['places'];

const DAY_COLORS = ['#4285F4', '#34A853', '#FB8C00', '#DB4437', '#9C27B0'];

function makeMarkerIcon(day: number, highlight = false): google.maps.Symbol | undefined {
  if (typeof window !== 'undefined' && window.google?.maps) {
    const color = DAY_COLORS[(day - 1) % DAY_COLORS.length] ?? '#666';
    return {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#000',
      strokeWeight: 1,
      scale: highlight ? 1.4 : 1.2,
    } as google.maps.Symbol;
  }
  return undefined;
}

interface Stop {
  id: string;
  address: string;
  isStart?: boolean;
}

interface Props {
  start: string;
  stops: Stop[];
  directions?: google.maps.DirectionsResult | null;
  hoveredIndex?: number | null;
  selectedIndex?: number | null;
  onSelect?: (idx: number) => void;
  mapState?: { center: google.maps.LatLngLiteral | null; zoom: number | null };
  onMapStateChange?: (state: { center: google.maps.LatLngLiteral | null; zoom: number | null }) => void;
}

export default function MapView({
  start,
  stops,
  directions,
  hoveredIndex,
  selectedIndex,
  onSelect,
  mapState,
  onMapStateChange,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const gmap = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const renderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const zoomRef = useRef<number | null>(null);
  const centerRef = useRef<google.maps.LatLng | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const prevDirections = useRef<google.maps.DirectionsResult | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });



  const indexToLabel = (i: number) => {
    return String.fromCharCode('A'.charCodeAt(0) + i);
  };

  useEffect(() => {
    if (!isLoaded || !window.google) return;
    function init() {
      if (!window.google || !mapRef.current || gmap.current) return;
      gmap.current = new window.google.maps.Map(mapRef.current, {
        center: mapState?.center ?? { lat: -25.2744, lng: 133.7751 },
        zoom: mapState?.zoom ?? 5,
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
      });
      renderer.current = new window.google.maps.DirectionsRenderer({
        preserveViewport: true,
        suppressMarkers: true,
      });
      renderer.current!.setMap(gmap.current);
      gmap.current!.addListener('idle', () => {
        zoomRef.current = gmap.current?.getZoom() ?? null;
        centerRef.current = gmap.current?.getCenter() ?? null;
        onMapStateChange?.({
          center: gmap.current?.getCenter()?.toJSON() ?? null,
          zoom: gmap.current?.getZoom() ?? null,
        });
      });
    }
    init();
  }, [isLoaded, mapState?.center, mapState?.zoom, onMapStateChange]);

  useEffect(() => {
    if (!isLoaded || !window.google) return;
    if (!gmap.current) {
      if (mapRef.current) {
        gmap.current = new window.google.maps.Map(mapRef.current, {
          center: mapState?.center ?? { lat: -25.2744, lng: 133.7751 },
          zoom: mapState?.zoom ?? 5,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
        });
        gmap.current!.addListener('idle', () => {
          zoomRef.current = gmap.current?.getZoom() ?? null;
          centerRef.current = gmap.current?.getCenter() ?? null;
          onMapStateChange?.({
            center: gmap.current?.getCenter()?.toJSON() ?? null,
            zoom: gmap.current?.getZoom() ?? null,
          });
        });
      } else {
        return;
      }
    }
    const geocoder = new window.google.maps.Geocoder();
    const zoom = mapState?.zoom ?? zoomRef.current ?? gmap.current!.getZoom();
    const center = mapState?.center
      ? new window.google.maps.LatLng(mapState.center)
      : centerRef.current ?? gmap.current!.getCenter();
    const hadMarkers = markers.current.length > 0;
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];
    const activeStops = stops
      .map((s, i) => ({ ...s, rowIndex: i }))
      .filter((s) => !s.isStart);
    const seen = new Set<string>();
    const bounds = new window.google.maps.LatLngBounds();
    const all = [start, ...activeStops.map((s) => s.address)].filter(Boolean);
    if (all.length === 0) {
      gmap.current!.setCenter({ lat: -25.2744, lng: 133.7751 });
      gmap.current!.setZoom(5);
      return;
    }
    all.forEach((addr, i) => {
      geocoder.geocode({ address: addr }, (res: any, status: string) => {
        if (status === 'OK' && res[0]) {
          if (
            !hadMarkers &&
            i === 0 &&
            (mapState?.center == null || mapState.zoom == null)
          )
            gmap.current!.setCenter(res[0].geometry.location);
          bounds.extend(res[0].geometry.location);
          if (i > 0) {
            const stop = activeStops[i - 1];
            if (seen.has(stop.id)) return;
            seen.add(stop.id);
            const day = stop.day ?? 1;
            const baseIcon = makeMarkerIcon(day);
            const marker = new window.google.maps.Marker({
              map: gmap.current!,
              position: res[0].geometry.location,
              label: { text: indexToLabel(i - 1), color: '#fff' },
              icon: baseIcon,
              zIndex: i,
            });
            marker.set('baseIcon', baseIcon);
            marker.set('day', day);
            marker.addListener('click', () => onSelect?.(stop.rowIndex));
            markers.current.push(marker);
          }
        }
      });
    });
    if (center && zoom != null) {
      gmap.current!.setCenter(center);
      gmap.current!.setZoom(zoom);
    }
    if (markers.current.length > 0) {
      gmap.current!.fitBounds(bounds);
    }
  }, [
    start,
    stops,
    onSelect,
    isLoaded,
    mapState?.center,
    mapState?.zoom,
    onMapStateChange,
  ]);

  useEffect(() => {
    if (!isLoaded || !window.google) return;
    const rowToMarkerIndex = (row: number | null | undefined) => {
      if (row == null) return null;
      let count = 0;
      for (let i = 0; i < row; i++) {
        if (!stops[i].isStart) count++;
      }
      return stops[row].isStart ? null : count;
    };
    const hIdx = rowToMarkerIndex(hoveredIndex);
    const sIdx = rowToMarkerIndex(selectedIndex);
    markers.current.forEach((m, i) => {
      const highlight = i === hIdx || i === sIdx;
      m.setIcon(makeMarkerIcon((m.get('day') as number) ?? 1, highlight));
      m.setZIndex(highlight ? 999 : i);
    });
  }, [hoveredIndex, selectedIndex, stops, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !window.google) return;
    const rowToMarkerIndex = (row: number | null | undefined) => {
      if (row == null) return null;
      let count = 0;
      for (let i = 0; i < row; i++) {
        if (!stops[i].isStart) count++;
      }
      return stops[row].isStart ? null : count;
    };
    const sIdx = rowToMarkerIndex(selectedIndex);
    if (!infoRef.current) infoRef.current = new window.google.maps.InfoWindow();
    if (sIdx != null) {
      const pos = markers.current[sIdx]?.getPosition();
      if (pos) {
        gmap.current?.panTo(pos);
        infoRef.current!.setContent(stops[selectedIndex!].address);
        infoRef.current!.open({ map: gmap.current!, anchor: markers.current[sIdx] });
      }
    } else {
      infoRef.current!.close();
    }
  }, [selectedIndex, stops, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !renderer.current || !gmap.current) return;
    const map = gmap.current;
    const zoom = mapState?.zoom ?? zoomRef.current ?? map.getZoom();
    const center = mapState?.center
      ? new window.google.maps.LatLng(mapState.center)
      : centerRef.current ?? map.getCenter();
    const prev = prevDirections.current;
    if (directions) {
      renderer.current.setDirections(directions);
      if (directions !== prev) {
        const bounds = directions.routes?.[0]?.bounds;
        if (bounds) {
          map.fitBounds(bounds);
          prevDirections.current = directions;
          return;
        }
      }
    } else {
      renderer.current.set('directions', null);
    }
    if (center && zoom != null) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
    prevDirections.current = directions ?? null;
  }, [directions, isLoaded, mapState?.center, mapState?.zoom]);

  useEffect(() => {
    return () => {
      if (gmap.current) {
        onMapStateChange?.({
          center: gmap.current.getCenter()?.toJSON() ?? null,
          zoom: gmap.current.getZoom() ?? null,
        });
      }
    };
  }, [onMapStateChange]);

  const legendDays = Array.from(new Set(stops.map((s) => s.day).filter(Boolean))) as number[];
  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="absolute inset-0" />
      {legendDays.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 p-2 rounded shadow text-xs space-x-2 flex">
          {legendDays.map((d) => (
            <div key={d} className="flex items-center space-x-1">
              <span
                style={{
                  backgroundColor: DAY_COLORS[(d - 1) % DAY_COLORS.length],
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                }}
              />
              <span>Day {d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
