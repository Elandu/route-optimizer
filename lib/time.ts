import { DateTime, Duration } from 'luxon';

export function parseTime(time: string): DateTime {
  return DateTime.fromISO(time);
}

export function formatTime(dt: DateTime): string {
  return dt.toFormat('HH:mm');
}

export function addMinutes(dt: DateTime, minutes: number): DateTime {
  return dt.plus(Duration.fromObject({ minutes }));
}
