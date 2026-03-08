import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ShowtimeEntry } from '../types';
import { ShowtimeChip } from './ShowtimeChip';

const DAYS_FR_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = [
  'janv.', 'fevr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.',
];

function parseDateParts(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  return {
    dayName: DAYS_FR_SHORT[date.getDay()],
    dayNumber: String(date.getDate()),
    month: MONTHS_FR[date.getMonth()],
  };
}

type GroupedShowtimes = Record<string, Record<string, ShowtimeEntry[]>>;

function groupShowtimes(showtimes: ShowtimeEntry[]): GroupedShowtimes {
  const byDate: GroupedShowtimes = {};
  for (const st of showtimes) {
    const date = st.date || st.datetime.slice(0, 10);
    if (!byDate[date]) byDate[date] = {};
    if (!byDate[date][st.cinemaName]) byDate[date][st.cinemaName] = [];
    byDate[date][st.cinemaName].push(st);
  }
  for (const date of Object.keys(byDate)) {
    for (const cinema of Object.keys(byDate[date])) {
      byDate[date][cinema].sort((a, b) => a.time.localeCompare(b.time));
    }
  }
  return byDate;
}

interface DayAccordionProps {
  dateStr: string;
  cinemas: Record<string, ShowtimeEntry[]>;
  defaultOpen: boolean;
  isInWatchlist?: (cinemaName: string, date: string, time: string) => boolean;
  onToggleWatchlist?: (showtime: ShowtimeEntry) => void;
}

function DayAccordion({ dateStr, cinemas, defaultOpen, isInWatchlist, onToggleWatchlist }: DayAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { dayName, dayNumber, month } = parseDateParts(dateStr);

  return (
    <View style={accordionStyles.wrapper}>
      <Pressable onPress={() => setOpen(!open)} style={accordionStyles.header}>
        <View style={accordionStyles.headerLeft}>
          <View style={accordionStyles.dateBlock}>
            <Text style={accordionStyles.dayName}>{dayName}</Text>
            <Text style={accordionStyles.dayNumber}>{dayNumber}</Text>
            <Text style={accordionStyles.monthName}>{month}</Text>
          </View>
          <Text style={accordionStyles.headerLabel}>Seances du jour</Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#F9A825"
        />
      </Pressable>

      {open && (
        <View style={accordionStyles.content}>
          {Object.entries(cinemas).map(([cinema, times], idx) => (
            <View
              key={cinema}
              style={[
                accordionStyles.cinemaBlock,
                idx < Object.keys(cinemas).length - 1 && accordionStyles.cinemaBlockBorder,
              ]}
            >
              <View style={accordionStyles.cinemaHeader}>
                <View style={accordionStyles.cinemaAccent} />
                <Text style={accordionStyles.cinemaName}>{cinema}</Text>
              </View>
              <View style={accordionStyles.chipsRow}>
                {times.map((st) => (
                  <ShowtimeChip
                    key={st.id}
                    showtime={st}
                    compact
                    saved={isInWatchlist?.(st.cinemaName, st.date, st.time) ?? false}
                    onLongPress={onToggleWatchlist ? () => onToggleWatchlist(st) : undefined}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const accordionStyles = StyleSheet.create({
  wrapper: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8D6E63',
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#EFEBE9',
  },
  header: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBlock: {
    alignItems: 'center',
    minWidth: 44,
  },
  dayName: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 11,
    color: 'rgba(255,248,225,0.9)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 26,
    color: '#FFF8E1',
    lineHeight: 28,
  },
  monthName: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 11,
    color: 'rgba(255,248,225,0.8)',
  },
  headerLabel: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 13,
    color: '#FFF8E1',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  content: {
    backgroundColor: '#FFF8E1',
    padding: 12,
  },
  cinemaBlock: {
    paddingBottom: 10,
    marginBottom: 10,
  },
  cinemaBlockBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(141,110,99,0.2)',
  },
  cinemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cinemaAccent: {
    width: 3,
    height: 16,
    backgroundColor: '#D32F2F',
    borderRadius: 2,
  },
  cinemaName: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 13,
    color: '#D32F2F',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

interface FilmShowtimesProps {
  showtimes: ShowtimeEntry[];
  filmTitle?: string;
  filmPosterUrl?: string | null;
  isInWatchlist?: (cinemaName: string, date: string, time: string) => boolean;
  onToggleWatchlist?: (showtime: ShowtimeEntry) => void;
}

export function FilmShowtimes({ showtimes, isInWatchlist, onToggleWatchlist }: FilmShowtimesProps) {
  if (showtimes.length === 0) {
    return (
      <Text style={styles.emptyText}>
        Aucune seance disponible cette semaine
      </Text>
    );
  }

  const grouped = groupShowtimes(showtimes);
  const sortedDates = Object.keys(grouped).sort();

  return (
    <View style={styles.container}>
      {/* Art Deco divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerCircle} />
        <View style={styles.dividerLine} />
      </View>

      <Text style={styles.heading}>Programme de la Semaine</Text>

      {sortedDates.map((date, idx) => (
        <DayAccordion
          key={date}
          dateStr={date}
          cinemas={grouped[date]}
          defaultOpen={idx === 0}
          isInWatchlist={isInWatchlist}
          onToggleWatchlist={onToggleWatchlist}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#F9A825',
  },
  dividerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D32F2F',
    borderWidth: 2,
    borderColor: '#F9A825',
    marginHorizontal: 8,
  },
  heading: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 22,
    color: '#D32F2F',
    marginBottom: 12,
    letterSpacing: 1,
  },
  emptyText: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15,
    color: '#8D6E63',
    textAlign: 'center',
    paddingVertical: 32,
  },
});
