
interface ScheduleEntry {
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

interface DaySchedule {
  day: string;
  short: string;
  date: string;
  classes: ScheduleEntry[];
}

const MOCK_SCHEDULE: DaySchedule[] = [
  {
    day: 'Lunes', short: 'Lun', date: '13',
    classes: [
      { time: '7:00 - 7:45', subject: 'Matemáticas', teacher: 'Lic. Juan Pérez', room: 'A-101' },
      { time: '7:45 - 8:30', subject: 'Lengua Española', teacher: 'Lic. María García', room: 'A-102' },
      { time: '8:30 - 9:15', subject: 'Ciencias Sociales', teacher: 'Lic. Carlos Rodríguez', room: 'A-103' },
      { time: '9:15 - 9:45', subject: 'Receso', teacher: '', room: '' },
      { time: '9:45 - 10:30', subject: 'Inglés', teacher: 'Lic. Ana Martínez', room: 'A-104' },
      { time: '10:30 - 11:15', subject: 'Educación Física', teacher: 'Lic. Roberto Díaz', room: 'Cancha' },
    ],
  },
  {
    day: 'Martes', short: 'Mar', date: '14',
    classes: [
      { time: '7:00 - 7:45', subject: 'Inglés', teacher: 'Lic. Ana Martínez', room: 'A-104' },
      { time: '7:45 - 8:30', subject: 'Matemáticas', teacher: 'Lic. Juan Pérez', room: 'A-101' },
      { time: '8:30 - 9:15', subject: 'Lengua Española', teacher: 'Lic. María García', room: 'A-102' },
      { time: '9:15 - 9:45', subject: 'Receso', teacher: '', room: '' },
      { time: '9:45 - 10:30', subject: 'Ciencias Sociales', teacher: 'Lic. Carlos Rodríguez', room: 'A-103' },
      { time: '10:30 - 11:15', subject: 'Artes Visuales', teacher: 'Lic. Laura Peña', room: 'A-201' },
    ],
  },
  {
    day: 'Miércoles', short: 'Mié', date: '15',
    classes: [
      { time: '7:00 - 7:45', subject: 'Ciencias Sociales', teacher: 'Lic. Carlos Rodríguez', room: 'A-103' },
      { time: '7:45 - 8:30', subject: 'Matemáticas', teacher: 'Lic. Juan Pérez', room: 'A-101' },
      { time: '8:30 - 9:15', subject: 'Educación Física', teacher: 'Lic. Roberto Díaz', room: 'Cancha' },
      { time: '9:15 - 9:45', subject: 'Receso', teacher: '', room: '' },
      { time: '9:45 - 10:30', subject: 'Lengua Española', teacher: 'Lic. María García', room: 'A-102' },
      { time: '10:30 - 11:15', subject: 'Inglés', teacher: 'Lic. Ana Martínez', room: 'A-104' },
    ],
  },
  {
    day: 'Jueves', short: 'Jue', date: '16',
    classes: [
      { time: '7:00 - 7:45', subject: 'Lengua Española', teacher: 'Lic. María García', room: 'A-102' },
      { time: '7:45 - 8:30', subject: 'Inglés', teacher: 'Lic. Ana Martínez', room: 'A-104' },
      { time: '8:30 - 9:15', subject: 'Matemáticas', teacher: 'Lic. Juan Pérez', room: 'A-101' },
      { time: '9:15 - 9:45', subject: 'Receso', teacher: '', room: '' },
      { time: '9:45 - 10:30', subject: 'Artes Visuales', teacher: 'Lic. Laura Peña', room: 'A-201' },
    ],
  },
  {
    day: 'Viernes', short: 'Vie', date: '17',
    classes: [
      { time: '7:00 - 7:45', subject: 'Educación Física', teacher: 'Lic. Roberto Díaz', room: 'Cancha' },
      { time: '7:45 - 8:30', subject: 'Ciencias Sociales', teacher: 'Lic. Carlos Rodríguez', room: 'A-103' },
      { time: '8:30 - 9:15', subject: 'Matemáticas', teacher: 'Lic. Juan Pérez', room: 'A-101' },
      { time: '9:15 - 9:45', subject: 'Receso', teacher: '', room: '' },
      { time: '9:45 - 10:30', subject: 'Lengua Española', teacher: 'Lic. María García', room: 'A-102' },
    ],
  },
];

const HOURS = ['7:00', '7:45', '8:30', '9:15', '9:45', '10:30', '11:15'];

export function StudentSchedule() {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? -1 : today - 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Horario de Clases</h1>
        <p className="text-gray-500 mt-1">Semana del {MOCK_SCHEDULE[0].date} al {MOCK_SCHEDULE[4].date} de Julio, 2026</p>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-px bg-gray-200 rounded-t-lg overflow-hidden">
            <div className="bg-gray-50 p-3 flex items-end text-xs font-medium text-gray-500" />
            {MOCK_SCHEDULE.map((day, idx) => (
              <div
                key={day.short}
                className={`p-3 text-center ${
                  idx === todayIndex
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                <p className="text-xs font-medium">{day.short}</p>
                <p className={`text-lg font-bold ${idx === todayIndex ? 'text-white' : 'text-gray-900'}`}>{day.date}</p>
              </div>
            ))}
          </div>

          {/* Body rows - each hour slot */}
          {HOURS.map((hour, hi) => {
            const isBreak = hi === 4;
            if (isBreak) {
              return (
                <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] gap-px bg-gray-200">
                  <div className="bg-white p-2 text-xs text-gray-400 font-mono flex items-center">{hour}</div>
                  {MOCK_SCHEDULE.map((day, di) => (
                    <div key={di} className="bg-gray-50 p-2 flex items-center justify-center">
                      <span className="text-xs text-gray-400 italic">Receso</span>
                    </div>
                  ))}
                </div>
              );
            }

            const entryIndex = hi < 4 ? hi : hi - 1;
            return (
              <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] gap-px bg-gray-200">
                <div className="bg-white p-2 text-xs text-gray-400 font-mono flex items-center">{hour}</div>
                {MOCK_SCHEDULE.map((day, di) => {
                  const entry = day.classes[entryIndex];
                  if (!entry) {
                    return <div key={di} className="bg-white p-2" />;
                  }
                  return (
                    <div
                      key={di}
                      className={`bg-white p-2.5 ${
                        di === todayIndex ? 'ring-2 ring-primary-200 bg-primary-50/30' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{entry.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{entry.teacher}</p>
                      {entry.room && (
                        <p className="text-xs text-gray-400 mt-0.5">{entry.room}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
