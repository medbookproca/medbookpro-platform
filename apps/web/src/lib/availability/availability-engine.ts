export interface LocalAvailabilityInterval {
  date: string;
  startTime: string;
  endTime: string;
  mode: 'virtual' | 'in_person' | 'mixed';
  timezone: string;
  source: 'recurring' | 'override';
}

export function localDateTimeToUtc(
  date: string,
  time: string,
  timezone: string,
) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hours, minutes);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  let guess = target;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(guess))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)]),
    );
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    const correction = target - represented;
    if (correction === 0) break;
    guess += correction;
  }
  return new Date(guess);
}

export function intervalDurationMinutes(
  interval: Pick<
    LocalAvailabilityInterval,
    'date' | 'startTime' | 'endTime' | 'timezone'
  >,
) {
  const start = localDateTimeToUtc(
    interval.date,
    interval.startTime,
    interval.timezone,
  );
  const end = localDateTimeToUtc(
    interval.date,
    interval.endTime,
    interval.timezone,
  );
  return Math.round((end.getTime() - start.getTime()) / 60000);
}
