'use client';
import { useEffect, useRef, useMemo } from 'react';
import { useLoadScript } from '@react-google-maps/api';

function getDefaultMarkerIcon(): google.maps.Icon | undefined {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return {
      url: 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png',
      scaledSize: new window.google.maps.Size(27, 43),
    };
  }
  return undefined;
}

function getHighlightedMarkerIcon(): google.maps.Icon | undefined {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return {
      url: 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png',
      scaledSize: new window.google.maps.Size(32, 51),
    };
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

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });


  const defaultIcon = useMemo(getDefaultMarkerIcon, []);
  const highlightedIcon = useMemo(getHighlightedMarkerIcon, []);

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
      renderer.current = new window.google.maps.DirectionsRenderer();
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
  }, [isLoaded]);

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
    const all = [start, ...activeStops.map((s) => s.address)].filter(Boolean);
    if (all.length === 0) {
      gmap.current!.setCenter({ lat: -25.2744, lng: 133.7751 });
      gmap.current!.setZoom(5);
      return;
    }
    all.forEach((addr, i) => {
      geocoder.geocode({ address: addr }, (res: any, status: string) => {
        if (status === 'OK' && res[0]) {
          if (!hadMarkers && i === 0) gmap.current!.setCenter(res[0].geometry.location);
          if (i > 0) {
            const stop = activeStops[i - 1];
            const marker = new window.google.maps.Marker({
              map: gmap.current!,
              position: res[0].geometry.location,
              label: indexToLabel(i - 1),
              icon: defaultIcon,
              zIndex: i,
            });
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
  }, [start, stops, defaultIcon, onSelect, isLoaded]);

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
      m.setIcon(highlight ? highlightedIcon : defaultIcon);
      m.setZIndex(highlight ? 999 : i);
    });
  }, [hoveredIndex, selectedIndex, stops, defaultIcon, highlightedIcon, isLoaded]);

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
    if (!isLoaded || !renderer.current) return;
    const zoom = mapState?.zoom ?? zoomRef.current ?? gmap.current?.getZoom();
    const center = mapState?.center
      ? new window.google.maps.LatLng(mapState.center)
      : centerRef.current ?? gmap.current?.getCenter();
    if (directions) {
      renderer.current.setDirections(directions);
    } else {
      renderer.current.set('directions', null);
    }
    if (center && zoom != null) {
      gmap.current?.setCenter(center);
      gmap.current?.setZoom(zoom);
    }
  }, [directions, isLoaded]);

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

  return (
    <div
      ref={mapRef}
      className="relative w-full h-full overflow-hidden"
    />
  );
}
