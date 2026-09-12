import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sigrade/ui';
import { CheckCircle2, XCircle, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface DayRecord {
  date: number;
  status: 'present' | 'absent' | 'late' | 'justified' | 'none';
}

interface MonthData {
  name: string;
  year: number;
  days: DayRecord[];
}

const MONTHS: MonthData[] = [
  {
    name: 'Enero', year: 2026,
    days: Array.from({ length: 31 }, (_, i) => {
      const d = i + 1;
      if (d <= 20) return { date: d, status: 'present' as const };
      if (d === 21) return { date: d, status: 'late' as const };
      if (d === 22) return { date: d, status: 'absent' as const };
      if (d === 23) return { date: d, status: 'justified' as const };
      return { date: d, status: 'present' as const };
    }),
  },
  {
    name: 'Febrero', year: 2026,
    days: Array.from({ length: 28 }, (_, i) => {
      const d = i + 1;
      if (d <= 18) return { date: d, status: 'present' as const };
      if (d === 19) return { date: d, status: 'absent' as const };
      return { date: d, status: 'present' as const };
    }),
  },
  {
    name: 'Marzo', year: 2026,
    days: Array.from({ length: 31 }, (_, i) => {
      const d = i + 1;
      if (d <= 22) return { date: d, status: 'present' as const };
      if (d === 23 || d === 24) return { date: d, status: 'late' as const };
      if (d === 25) return { date: d, status: 'justified' as const };
      return { date: d, status: 'present' as const };
    }),
  },
];

const SUMMARY = {
  present: 72,
  absent: 3,
  late: 4,
  justified: 2,
  total: 81,
  percentage: 94,
};

const STATUS_ICONS: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  present: { icon: CheckCircle2, color: 'text-green-500 bg-green-50', label: 'Presente' },
  absent: { icon: XCircle, color: 'text-red-500 bg-red-50', label: 'Ausente' },
  late: { icon: Clock, color: 'text-yellow-500 bg-yellow-50', label: 'Tardanza' },
  justified: { icon: AlertCircle, color: 'text-blue-500 bg-blue-50', label: 'Justificado' },
};

const DAY_INDICATORS: Record<string, string> = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  late: 'bg-yellow-500',
  justified: 'bg-blue-500',
  none: 'bg-gray-200',
};

export function StudentAttendance() {
  const [monthIndex, setMonthIndex] = useState(0);
  const month = MONTHS[monthIndex];

  const weeks: (DayRecord | null)[][] = [];
  let currentWeek: (DayRecord | null)[] = new Array(7).fill(null);
  const firstDay = new Date(month.year, MONTHS.indexOf(month), 1).getDay();
  const sundayStart = firstDay === 0 ? 0 : firstDay;

  let dayIdx = 0;
  for (let i = 0; i < sundayStart; i++) {
    currentWeek[i] = null;
  }
  for (let i = sundayStart; i < 7; i++) {
    if (dayIdx < month.days.length) {
      currentWeek[i] = month.days[dayIdx];
      dayIdx++;
    }
  }
  weeks.push(currentWeek);

  while (dayIdx < month.days.length) {
    currentWeek = new Array(7).fill(null);
    for (let i = 0; i < 7; i++) {
      if (dayIdx < month.days.length) {
        currentWeek[i] = month.days[dayIdx];
        dayIdx++;
      }
    }
    weeks.push(currentWeek);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
        <p className="text-gray-500 mt-1">Control de asistencia y puntualidad</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{SUMMARY.percentage}%</p>
            <p className="text-xs text-green-600">Asistencia</p>
          </CardContent>
        </Card>
        {[
          { label: 'Presentes', value: SUMMARY.present, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Ausentes', value: SUMMARY.absent, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Tardanzas', value: SUMMARY.late, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Justificados', value: SUMMARY.justified, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{month.name} {month.year}</CardTitle>
            <div className="flex gap-1">
              <button
                onClick={() => setMonthIndex(Math.max(0, monthIndex - 1))}
                disabled={monthIndex === 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMonthIndex(Math.min(MONTHS.length - 1, monthIndex + 1))}
                disabled={monthIndex === MONTHS.length - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
                    <th key={d} className="p-2 text-center font-medium text-gray-500 text-xs">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((day, di) => (
                      <td key={di} className="p-1">
                        {day ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${DAY_INDICATORS[day.status]}`}>
                            {day.date}
                          </div>
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
            {Object.entries(STATUS_ICONS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className={`w-2.5 h-2.5 rounded-full ${DAY_INDICATORS[key]}`} />
                {val.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
