"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import AddressInput from "../components/AddressInput";
import RunTable from "../components/RunTable";
import AuthHeader from "../components/AuthHeader";
import MapView from "../components/MapView";
import Tabs, { TabItem } from "../components/Tabs";
import useMediaQuery from "../lib/useMediaQuery";
import { addMinutes, formatTime, parseTime } from "../lib/time";
import { DateTime } from "luxon";
import Script from "next/script";

interface Stop {
  id: string;
  address: string;
  time: number;
  eta?: string;
  etd?: string;
  etaIso?: string;
  etdIso?: string;
  day?: number;
  isAccom?: boolean;
  isStart?: boolean;
  travelNext?: string;
}

declare global {
  interface Window {
    grecaptcha?: any;
    google?: any;
  }
}

export default function Page() {
  const [startAddress, setStartAddress] = useState("");
  const [startDate, setStartDate] = useState(DateTime.now().toISODate());
  const [startTime, setStartTime] = useState("08:30");
  const [eodTime, setEodTime] = useState("17:00");
  const [address, setAddress] = useState("");
  const [bulkAddresses, setBulkAddresses] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("bulkAddresses") || "";
  });
  // user provided stops (without start/end or accom rows)
  const [stops, setStops] = useState<Stop[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("stops");
    if (!saved) return [];
    try {
      return JSON.parse(saved) as Stop[];
    } catch {
      return [];
    }
  });
  // calculated stops with timings and extra rows
  const [timedStops, setTimedStops] = useState<Stop[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("timedStops");
    if (!saved) return [];
    try {
      return JSON.parse(saved) as Stop[];
    } catch {
      return [];
    }
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [isOvernight, setIsOvernight] = useState(false);
  const [accomodation, setAccomodation] = useState("");
  const getBool = (key: string, def: boolean) => {
    if (typeof window === "undefined") return def;
    const v = localStorage.getItem(key);
    return v == null ? def : v === "true";
  };
  const getNum = (key: string, def: number) => {
    if (typeof window === "undefined") return def;
    const v = localStorage.getItem(key);
    return v == null ? def : Number(v);
  };
  const getStr = (key: string, def: string) => {
    if (typeof window === "undefined") return def;
    return localStorage.getItem(key) ?? def;
  };

  const [avoidTolls, setAvoidTolls] = useState(() =>
    getBool("avoidTolls", false),
  );
  const [avoidFerries, setAvoidFerries] = useState(() =>
    getBool("avoidFerries", false),
  );
  const [avoidHighways, setAvoidHighways] = useState(() =>
    getBool("avoidHighways", false),
  );
  const [maxStopsPerDay, setMaxStopsPerDay] = useState(() =>
    getNum("maxStopsPerDay", 5),
  );
  const [defaultServiceTime, setDefaultServiceTime] = useState(() =>
    getNum("defaultServiceTime", 60),
  );
  const [timeBuffer, setTimeBuffer] = useState(() => getNum("timeBuffer", 5));
  const [returnToStart, setReturnToStart] = useState(() =>
    getBool("returnToStart", true),
  );
  const [endAddress, setEndAddress] = useState(() => getStr("endAddress", ""));
  const [rememberMap, setRememberMap] = useState(() =>
    getBool("rememberMap", true),
  );
  const [stats, setStats] = useState<{
    travel: number;
    avg: number;
    stops: number;
    days: number;
    total: number;
  } | null>(null);
  const [workdayWarning, setWorkdayWarning] = useState(false);
  const [shouldRecalc, setShouldRecalc] = useState(false);
  const stopsCountRef = useRef(0);

  const saveHistory = (addresses: string[], total: number) => {
    if (typeof window === "undefined") return;
    try {
      const h = JSON.parse(localStorage.getItem("history") || "[]");
      h.unshift({
        date: new Date().toISOString(),
        start: startAddress,
        stops: addresses,
        total,
      });
      localStorage.setItem("history", JSON.stringify(h.slice(0, 5)));
    } catch {}
  };
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentTab") ?? "run";
    }
    return "run";
  });
  const [mapState, setMapState] = useState<{
    center: google.maps.LatLngLiteral | null;
    zoom: number | null;
  }>(() => {
    if (typeof window === "undefined") return { center: null, zoom: null };
    if (!getBool("rememberMap", true)) return { center: null, zoom: null };
    const center = localStorage.getItem("mapCenter");
    const zoom = localStorage.getItem("mapZoom");
    return {
      center: center ? JSON.parse(center) : null,
      zoom: zoom ? Number(zoom) : null,
    };
  });
  const handleMapStateChange = useCallback(
    (state: { center: google.maps.LatLngLiteral | null; zoom: number | null }) =>
      setMapState((prev) => {
        if (
          prev.center?.lat === state.center?.lat &&
          prev.center?.lng === state.center?.lng &&
          prev.zoom === state.zoom
        ) {
          return prev;
        }
        return state;
      }),
    [],
  );
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isMapVisible = isDesktop;

  const MAX_STOPS = 20;

  const cleanLines = (text: string) =>
    text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");

  const updateBulkAddresses = (text: string) => {
    const lines = cleanLines(text);
    if (lines.length > MAX_STOPS) {
      alert(`Maximum ${MAX_STOPS} stops allowed`);
      return;
    }
    setBulkAddresses(text);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const paste = cleanLines(e.clipboardData.getData("text")).join("\n");
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const newValue = value.slice(0, selectionStart) + paste + value.slice(selectionEnd);
    updateBulkAddresses(newValue);
  };


  useEffect(() => {
    if (rememberMap && mapState.center && mapState.zoom != null) {
      localStorage.setItem("mapCenter", JSON.stringify(mapState.center));
      localStorage.setItem("mapZoom", String(mapState.zoom));
    }
  }, [mapState, rememberMap]);

  useEffect(() => {
    localStorage.setItem("avoidTolls", String(avoidTolls));
  }, [avoidTolls]);

  useEffect(() => {
    localStorage.setItem("avoidFerries", String(avoidFerries));
  }, [avoidFerries]);

  useEffect(() => {
    localStorage.setItem("avoidHighways", String(avoidHighways));
  }, [avoidHighways]);

  useEffect(() => {
    localStorage.setItem("maxStopsPerDay", String(maxStopsPerDay));
  }, [maxStopsPerDay]);

  useEffect(() => {
    localStorage.setItem("defaultServiceTime", String(defaultServiceTime));
  }, [defaultServiceTime]);

  useEffect(() => {
    localStorage.setItem("timeBuffer", String(timeBuffer));
  }, [timeBuffer]);

  useEffect(() => {
    localStorage.setItem("returnToStart", String(returnToStart));
  }, [returnToStart]);

  useEffect(() => {
    localStorage.setItem("endAddress", endAddress);
  }, [endAddress]);

  useEffect(() => {
    localStorage.setItem("rememberMap", String(rememberMap));
  }, [rememberMap]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentTab", currentTab);
    }
  }, [currentTab]);

  useEffect(() => {
    if (isDesktop && (currentTab === "map" || currentTab === "addresses")) {
      setCurrentTab("run");
    }
  }, [isDesktop, currentTab]);

  useEffect(() => {
    stopsCountRef.current = stops.length;
  }, [stops.length]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("stops", JSON.stringify(stops));
    }
  }, [stops]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("timedStops", JSON.stringify(timedStops));
    }
  }, [timedStops]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bulkAddresses", bulkAddresses);
    }
  }, [bulkAddresses]);

  const stopsWithTimes = timedStops;

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("startAddress")
        : null;
    if (saved) setStartAddress(saved);
  }, []);

  const updateStartAddress = (val: string) => {
    setStartAddress(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("startAddress", val);
    }
  };

  const addAddressLine = () => {
    if (!address.trim()) return;
    const newline = bulkAddresses ? `\n${address}` : address;
    updateBulkAddresses(bulkAddresses + newline);
    setAddress("");
  };



  const onDragStart = (id: string) => setDragging(id);

  const onDrop = (id: string) => {
    if (!dragging || dragging === id) return;
    const newStops = [...stops];
    const from = newStops.findIndex((s) => s.id === dragging);
    const to = newStops.findIndex((s) => s.id === id);
    if (from === -1 || to === -1) return;
    const [item] = newStops.splice(from, 1);
    newStops.splice(to, 0, item);
    setStops(newStops);
    void recalcRoute(newStops);
    setDragging(null);
  };

  const onHoverRow = useCallback(
    (idx: number | null) => setHoveredIdx(idx),
    [],
  );

  const onSelectRow = useCallback((idx: number) => {
    setSelectedIdx(idx);
  }, []);

  const changeTime = (id: string, t: number) => {
    const updated = stops.map((s) => (s.id === id ? { ...s, time: t } : s));
    setStops(updated);
    void recalcRoute(updated);
  };

  const remove = (id: string) => {
    const updated = stops.filter((s) => s.id !== id);
    setStops(updated);
    if (updated.length === 0) {
      setTimedStops([]);
      setDirections(null);
      setStats(null);
      setSelectedIdx(null);
      setHoveredIdx(null);
    } else {
      void recalcRoute(updated);
    }
  };

  const applyTimes = useCallback(
    async (currStops: Stop[], legs: google.maps.DirectionsLeg[]) => {
      let current = DateTime.fromISO(`${startDate}T${startTime}`);
      const [eodHour, eodMinute] = eodTime
        .split(":")
        .map((n) => parseInt(n, 10));
      const [startHour, startMinute] = startTime
        .split(":")
        .map((n) => parseInt(n, 10));
      let day = 1;
      let travel = 0;
      const result: Stop[] = [];
      let dayEnd = current.set({ hour: eodHour, minute: eodMinute });
      const getTravelMinutes = (from: string, to: string) =>
        new Promise<number>((resolve) => {
          if (!window.google) return resolve(0);
          const svc = new window.google.maps.DistanceMatrixService();
          svc.getDistanceMatrix(
            {
              origins: [from],
              destinations: [to],
              travelMode: window.google.maps.TravelMode.DRIVING,
              avoidTolls,
              avoidFerries,
              avoidHighways,
            },
            (res: any, status: string) => {
              const val =
                status === "OK" &&
                res.rows[0] &&
                res.rows[0].elements[0].status === "OK"
                  ? res.rows[0].elements[0].duration.value / 60
                  : 0;
              resolve(val);
            },
          );
        });

      result.push({
        id: "start",
        address: startAddress,
        time: 0,
        eta: formatTime(current),
        etd: formatTime(current),
        etaIso: current.toISO() ?? undefined,
        etdIso: current.toISO() ?? undefined,
        day,
        isStart: true,
        travelNext: legs[0]?.duration?.text,
      });

      let startFromHotel = false;
      for (let idx = 0; idx < currStops.length; idx++) {
        const stop = currStops[idx];
        let travelMin = 0;
        if (startFromHotel) {
          travelMin = await getTravelMinutes(accomodation, stop.address);
        } else {
          const leg = legs[idx];
          travelMin = leg && leg.duration ? leg.duration.value / 60 : 0;
        }
        current = addMinutes(current, travelMin);
        travel += travelMin;
        current = addMinutes(current, timeBuffer);
        const eta = current;
        current = addMinutes(current, stop.time);
        const etd = current;
        result.push({
          ...stop,
          eta: formatTime(eta),
          etd: formatTime(etd),
          etaIso: eta.toISO() ?? undefined,
          etdIso: etd.toISO() ?? undefined,
          day,
          travelNext: undefined,
        });

        let nextLegMin = 0;
        if (etd > dayEnd) {
          let toHotel = 0;
          if (isOvernight && accomodation.trim()) {
            toHotel = await getTravelMinutes(stop.address, accomodation);
            current = addMinutes(current, toHotel);
            travel += toHotel;
          }
          const overEta = current;
          const nextStart = overEta
            .plus({ days: 1 })
            .set({ hour: startHour, minute: startMinute });
          if (isOvernight && accomodation.trim()) {
            result.push({
              id: `accom-${day}`,
              address: accomodation,
              time: 0,
              eta: formatTime(overEta),
              etd: formatTime(nextStart),
              etaIso: overEta.toISO() ?? undefined,
              etdIso: nextStart.toISO() ?? undefined,
              day,
              isAccom: true,
              travelNext: undefined,
            });
            if (toHotel > 0) {
              result[result.length - 2].travelNext = `${Math.round(toHotel)} mins`;
            }
          }
          day++;
          current = nextStart;
          dayEnd = current.set({ hour: eodHour, minute: eodMinute });
          startFromHotel = isOvernight && accomodation.trim() !== "";
          if (startFromHotel && idx + 1 < currStops.length) {
            nextLegMin = await getTravelMinutes(accomodation, currStops[idx + 1].address);
          }
        } else {
          const nextLeg = legs[idx + 1];
          nextLegMin = nextLeg && nextLeg.duration ? nextLeg.duration.value / 60 : 0;
        }
        result[result.length - 1].travelNext = nextLegMin ? `${Math.round(nextLegMin)} mins` : undefined;
      }

      const lastLeg = legs[currStops.length];
      if (startFromHotel && accomodation.trim()) {
        const min = await getTravelMinutes(accomodation, returnToStart ? startAddress : endAddress || startAddress);
        current = addMinutes(current, min);
        travel += min;
      } else if (lastLeg && lastLeg.duration) {
        const min = lastLeg.duration.value / 60;
        current = addMinutes(current, min);
        travel += min;
      }

      result.push({
        id: "end",
        address: returnToStart ? startAddress : endAddress || startAddress,
        time: 0,
        eta: formatTime(current),
        etd: formatTime(current),
        etaIso: current.toISO() ?? undefined,
        etdIso: current.toISO() ?? undefined,
        day,
        isStart: true,
        travelNext: undefined,
      });

      const avg = currStops.length ? travel / currStops.length : 0;

      const startDt = DateTime.fromISO(`${startDate}T${startTime}`);
      const endDt = current;
      const totalMinutes = endDt.diff(startDt, "minutes").minutes;

      setStats({
        travel: Math.round(travel),
        avg: Math.round(avg),
        stops: currStops.length,
        days: day,
        total: Math.round(totalMinutes),
      });

      const workMinutes = DateTime.fromISO(`${startDate}T${eodTime}`)
        .diff(startDt, "minutes").minutes;
      const totalMinutesWork = totalMinutes;
      setWorkdayWarning(
        totalMinutesWork > workMinutes && !(isOvernight && accomodation.trim()),
      );

      // remove consecutive duplicate start rows on the same day
      return {
        stops: result.filter(
          (s, i, arr) =>
            !(
              s.isStart &&
              i > 0 &&
              arr[i - 1].isStart &&
              arr[i - 1].day === s.day
            ),
        ),
        totalMinutes: Math.round(totalMinutes),
      };
    },
    [
      startAddress,
      startDate,
      startTime,
      eodTime,
      accomodation,
      isOvernight,
      timeBuffer,
      returnToStart,
      endAddress,
    ],
  );

  const recalcRoute = useCallback(
    async (currStops: Stop[], done?: (total: number) => void) => {
      if (!window.google || !startAddress) return;
      const svc = new window.google.maps.DirectionsService();
      setDirections(null);
      svc.route(
        {
          origin: startAddress,
          destination: returnToStart
            ? startAddress
            : endAddress || startAddress,
          travelMode: window.google.maps.TravelMode.DRIVING,
          avoidTolls,
          avoidFerries,
          avoidHighways,
          optimizeWaypoints: false,
          waypoints: currStops.map((s) => ({
            location: s.address,
            stopover: true,
          })),
        },
        async (res: google.maps.DirectionsResult, status: string) => {
          if (status !== "OK" || !res.routes || !res.routes[0]) {
            console.error("Route recalculation failed:", status, res);
            return;
          }
          const legs = res.routes[0].legs;
          const { stops: updated, totalMinutes } = await applyTimes(currStops, legs);
          setTimedStops(updated);
          setDirections(res);
          done?.(totalMinutes);
        },
      );
    },
    [
      startAddress,
      applyTimes,
      avoidTolls,
      avoidFerries,
      avoidHighways,
      returnToStart,
      endAddress,
    ],
  );

  useEffect(() => {
    if (shouldRecalc && stops.length > 0) {
      void recalcRoute(stops);
      setShouldRecalc(false);
    }
  }, [shouldRecalc, recalcRoute, stops]);

  useEffect(() => {
    if (stopsCountRef.current > 0) setShouldRecalc(true);
  }, [isOvernight, accomodation, eodTime]);

  const generateRoute = () => {
    const addrs = cleanLines(bulkAddresses);
    if (addrs.length === 0 || !startAddress.trim()) {
      alert("Please provide an address first");
      return;
    }
    const baseStops = addrs.map((addr) => ({
      id: Date.now().toString() + Math.random(),
      address: addr,
      time: defaultServiceTime,
    }));
    setStops(baseStops);
    if (!window.google) return;
    const svc = new window.google.maps.DirectionsService();
    setDirections(null);
    svc.route(
      {
        origin: startAddress,
        destination: returnToStart ? startAddress : endAddress || startAddress,
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidTolls,
        avoidFerries,
        avoidHighways,
        optimizeWaypoints: true,
        waypoints: baseStops.map((s) => ({
          location: s.address,
          stopover: true,
        })),
      },
      (res: google.maps.DirectionsResult, status: string) => {
        if (status !== "OK" || !res.routes || !res.routes[0]) {
          console.error("Route calculation failed:", status, res);
          alert("Failed to generate route. Please check addresses.");
          return;
        }
        const order = res.routes[0].waypoint_order;
        const ordered = order.map((i: number) => baseStops[i]);
        setStops(ordered);
        void recalcRoute(ordered, (tot) => {
          saveHistory(ordered.map((s) => s.address), tot);
        });
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          setCurrentTab("run");
        }
      },
    );
  };


  const tableContent = (
    <>
      <RunTable
        stops={stopsWithTimes}
        startDate={startDate}
        draggingId={dragging}
        remove={remove}
        onDragStart={onDragStart}
        onDrop={onDrop}
        onTimeChange={changeTime}
        hoveredIndex={hoveredIdx}
        selectedIndex={selectedIdx}
        onHover={onHoverRow}
        onSelect={(idx) => {
          onSelectRow(idx);
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            setCurrentTab("map");
          }
        }}
      />
      {/* stats moved below */}
    </>
  );

  const runActions = (
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-background z-10 shadow-md space-y-2">
      <button
        onClick={generateRoute}
        className="w-full bg-blue-500 text-white py-2 rounded"
        aria-label="Generate Run"
      >
        Generate Run
      </button>
      {workdayWarning && (
        <div role="alert" className="text-sm bg-yellow-100 text-yellow-800 p-2 rounded">
          ⚠️ Route may exceed a standard workday and no overnight stop has been specified.
        </div>
      )}
      {stats && (
        <div className="flex flex-wrap gap-2 text-xs justify-center">
          <span className="px-2 py-1 bg-gray-100 rounded">Total travel: {stats.travel} mins</span>
          <span className="px-2 py-1 bg-gray-100 rounded">Avg per stop: {stats.avg} mins</span>
          <span className="px-2 py-1 bg-gray-100 rounded">Stops: {stats.stops}</span>
          <span className="px-2 py-1 bg-gray-100 rounded">Days: {stats.days}</span>
          <span className="px-2 py-1 bg-gray-100 rounded">Total time: {stats.total} mins</span>
        </div>
      )}
      {/* Share button removed */}
    </div>
  );

  const addressFields = (
    <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden scroll-touch">
      <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
        <div className="flex flex-col flex-1 space-y-2">
          <label htmlFor="start-address" className="mb-1">
            Start Address
          </label>
          <AddressInput
            id="start-address"
            value={startAddress}
            onChange={updateStartAddress}
            placeholder="Start address"
          />
        </div>
        <div className="flex flex-1 gap-2 items-end">
          <AddressInput
            id="add-address"
            value={address}
            onChange={setAddress}
            placeholder="Add address"
            className="flex-grow"
          />
          <button
            onClick={addAddressLine}
            className="h-10 px-4 rounded border text-sm bg-blue-500 text-white hover:bg-blue-600 shrink-0"
            aria-label="Add address"
          >
            Add
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea
          value={bulkAddresses}
          onChange={(e) => updateBulkAddresses(e.target.value)}
          onPaste={handlePaste}
          placeholder="One address per line"
          className="border px-3 py-2 rounded w-full h-40 box-border appearance-none dark:bg-gray-800 dark:text-white md:col-span-2 resize-none overflow-y-auto"
        />
      </div>
    </div>
  );

  const addressesContent = (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] overflow-y-auto mx-auto max-w-screen-lg w-full px-4">
      {addressFields}
      {!isDesktop && runActions}
    </div>
  );

  const runContent = (
    <div className="flex flex-col overflow-hidden h-[calc(100vh-8rem)] mx-auto max-w-screen-lg w-full">
      <div className="flex flex-col flex-1">
        {isDesktop && (
          <div
            className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden scroll-touch border-b md:border-r border-gray-200 dark:border-gray-700 max-h-96 px-4"
          >
            {addressFields}
          </div>
        )}
        <div className="flex-1 overflow-y-auto scroll-touch p-4 pb-24 min-h-0">
          {tableContent}
        </div>
        {isDesktop && runActions}
      </div>
    </div>
  );

  const settingsContent = (
    <div className="flex flex-col overflow-y-auto scroll-touch flex-1 px-4 md:px-8 py-4 space-y-4 min-h-[calc(100vh-8rem)]">
      <div className="space-y-2">
        <h3 className="text-md font-semibold text-gray-300">Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label htmlFor="start-date" className="mb-1">
              Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border px-3 py-2 rounded w-full box-border appearance-none dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="start-time" className="mb-1">
              Start Time
            </label>
            <input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border px-3 py-2 rounded w-full box-border appearance-none dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="end-time" className="mb-1">
              End Time
            </label>
            <input
              id="end-time"
              type="time"
              value={eodTime}
              onChange={(e) => setEodTime(e.target.value)}
              className="border px-3 py-2 rounded w-full box-border appearance-none dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-md font-semibold text-gray-300">Route Options</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center">
            <input
              id="return-start"
              type="checkbox"
              checked={returnToStart}
              onChange={(e) => setReturnToStart(e.target.checked)}
              className="mr-2"
            />
            Return to start?
          </label>
          {!returnToStart && (
            <AddressInput
              id="end-address"
              value={endAddress}
              onChange={setEndAddress}
              placeholder="End Address"
            />
          )}
          <label className="flex items-center">
            <input
              id="avoid-tolls"
              type="checkbox"
              checked={avoidTolls}
              onChange={(e) => setAvoidTolls(e.target.checked)}
              className="mr-2"
            />
            Avoid Tolls
          </label>
          <label className="flex items-center">
            <input
              id="avoid-ferries"
              type="checkbox"
              checked={avoidFerries}
              onChange={(e) => setAvoidFerries(e.target.checked)}
              className="mr-2"
            />
            Avoid Ferries
          </label>
          <label className="flex items-center">
            <input
              id="avoid-highways"
              type="checkbox"
              checked={avoidHighways}
              onChange={(e) => setAvoidHighways(e.target.checked)}
              className="mr-2"
            />
            Avoid Highways
          </label>
          <div className="flex flex-col">
            <label htmlFor="max-stops" className="mb-1">
              Max Stops per Day
            </label>
            <input
              id="max-stops"
              type="number"
              value={maxStopsPerDay}
              onChange={(e) => setMaxStopsPerDay(parseInt(e.target.value) || 0)}
              className="border px-3 py-2 rounded w-full box-border appearance-none dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="time-buffer" className="mb-1">
              Time Buffer Between Stops (mins)
            </label>
            <input
              id="time-buffer"
              type="number"
              value={timeBuffer}
              onChange={(e) => setTimeBuffer(parseInt(e.target.value) || 0)}
              className="border px-3 py-2 rounded w-full box-border appearance-none dark:bg-gray-800 dark:text-white"
            />
          </div>
          <label className="flex items-center">
            <input
              id="overnight"
              type="checkbox"
              checked={isOvernight}
              onChange={(e) => setIsOvernight(e.target.checked)}
              className="mr-2"
            />
            Overnight stop
          </label>
          {isOvernight && (
            <AddressInput
              id="accom"
              value={accomodation}
              onChange={setAccomodation}
              placeholder="Accomodation address"
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-md font-semibold text-gray-300">Defaults</h3>
        <div className="flex flex-col gap-2">
          <label htmlFor="default-service" className="mb-1">
            Default Service Time (mins)
          </label>
          <input
            id="default-service"
            type="number"
            value={defaultServiceTime}
            onChange={(e) =>
              setDefaultServiceTime(parseInt(e.target.value) || 0)
            }
            className="border px-3 py-2 rounded w-full box-border appearance-none dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-md font-semibold text-gray-300">Map</h3>
        <label className="flex items-center">
          <input
            id="remember-map"
            type="checkbox"
            checked={rememberMap}
            onChange={(e) => setRememberMap(e.target.checked)}
            className="mr-2"
          />
          Remember last map position
        </label>
      </div>
    </div>
  );
  const mapTabContent = (
    <div className="h-[70vh] w-full overflow-y-auto">
      <MapView
        start={startAddress}
        stops={timedStops}
        directions={directions}
        hoveredIndex={hoveredIdx}
        selectedIndex={selectedIdx}
        onSelect={onSelectRow}
        mapState={mapState}
        onMapStateChange={handleMapStateChange}
      />
    </div>
  );

  const tabItems = [
    { key: "run", title: "Run", content: runContent },
    ...(!isDesktop ? [{ key: "addresses", title: "Addresses", content: addressesContent }] : []),
    ...(!isDesktop ? [{ key: "map", title: "Map", content: mapTabContent }] : []),
    { key: "settings", title: "Settings", content: settingsContent },
  ];

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-hidden min-h-screen">
      <AuthHeader />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] flex-grow overflow-hidden gap-4 min-h-0">
        <div className="flex flex-col flex-1 min-h-0">
          <Tabs
            defaultKey="run"
            selectedKey={currentTab}
            onChange={(k) => setCurrentTab(k as string)}
            items={tabItems}
          />
        </div>
        {isMapVisible && (
          <div className="h-[60vh] md:h-full w-full overflow-y-auto">
            <MapView
              start={startAddress}
              stops={timedStops}
              directions={directions}
              hoveredIndex={hoveredIdx}
              selectedIndex={selectedIdx}
              onSelect={onSelectRow}
              mapState={mapState}
              onMapStateChange={handleMapStateChange}
            />
          </div>
        )}
      </div>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
      />
    </div>
  );
}
