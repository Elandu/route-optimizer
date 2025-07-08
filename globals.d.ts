export {};

declare global {
  namespace google.maps {
    class Map {
      constructor(elem: HTMLElement, opts?: any);
      setCenter(latLng: any): void;
    }
    class Marker {
      constructor(opts?: any);
      setMap(map: Map | null): void;
    }
    class Geocoder {
      geocode(request: any, callback: (result: any, status: any) => void): void;
    }
    namespace places {
      class Autocomplete {
        constructor(input: HTMLInputElement, opts?: any);
        addListener(eventName: string, handler: () => void): void;
        getPlace(): any;
      }
    }
  }
}
