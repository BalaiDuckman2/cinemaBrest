// AlloCiné renvoie ses horaires en heure murale de Paris, sans fuseau
// ("2026-08-04T20:40:00"). `new Date()` interpréterait cette chaîne dans le
// fuseau du serveur : en conteneur (UTC) une séance de 20h40 devient 20h40 UTC,
// puis 22h40 une fois reformatée pour Paris. On résout donc le décalage
// explicitement, sans jamais dépendre du fuseau du processus.

const PARIS_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/** Décalage Paris ↔ UTC, en millisecondes, à l'instant donné (DST comprise). */
function parisOffsetMs(instant: Date): number {
  const parts: Record<string, string> = {};
  for (const part of PARIS_PARTS.formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asIfUtc - instant.getTime();
}

/**
 * Convertit un horaire mural parisien (`YYYY-MM-DDTHH:MM:SS`, sans fuseau)
 * en l'instant UTC correspondant. Une chaîne portant déjà son fuseau est
 * respectée telle quelle.
 */
export function parisWallClockToUtc(wallClock: string): Date {
  if (HAS_TIMEZONE.test(wallClock)) return new Date(wallClock);

  const asIfUtc = new Date(`${wallClock}Z`);
  // Première passe : l'offset lu à l'instant supposé. Seconde passe : l'offset
  // relu à l'instant corrigé, seul moyen d'être juste autour d'un changement d'heure.
  const firstPass = new Date(asIfUtc.getTime() - parisOffsetMs(asIfUtc));
  return new Date(asIfUtc.getTime() - parisOffsetMs(firstPass));
}
