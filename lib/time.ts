// @ts-ignore
import { DateTime, Duration } from 'luxon';

export function parseTime(time: string) {
  return DateTime.fromISO(time);
}

export function formatTime(dt: DateTime) {
  return dt.toFormat('HH:mm');
}

export function addMinutes(dt: DateTime, minutes: number) {
  return dt.plus(Duration.fromObject({ minutes }));
}
