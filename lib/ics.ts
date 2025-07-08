interface Stop {
  address: string;
  eta: string; // ISO
  etd: string; // ISO
  isAccom?: boolean;
}

export function generateICS(stops: Stop[], title = 'Inspection Run'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Inspection Optimiser//EN',
  ];
  stops.forEach((s, i) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${i}@inspection`);
    const summary = s.isAccom ? 'Accommodation' : `Stop ${i + 1}`;
    lines.push(`SUMMARY:${summary}`);
    lines.push(`LOCATION:${s.address}`);
    lines.push(`DTSTART:${s.eta.replace(/[-:]/g, '')}`);
    lines.push(`DTEND:${s.etd.replace(/[-:]/g, '')}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
