import { Card, CardContent, CardHeader, CardTitle } from '@sigrade/ui';
import {
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock,
  Calendar,
  MessageSquare,
} from 'lucide-react';

const MOCK_KPIS = [
  { label: 'Promedio General', value: '87.5', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Asistencia', value: '95%', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Tareas Pendientes', value: '3', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Próximas Clases', value: '2', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const MOCK_RECENT_GRADES = [
  { subject: 'Matemáticas', score: 92, date: '15 Jun 2026' },
  { subject: 'Lengua Española', score: 85, date: '14 Jun 2026' },
  { subject: 'Ciencias Sociales', score: 78, date: '13 Jun 2026' },
  { subject: 'Inglés', score: 95, date: '12 Jun 2026' },
  { subject: 'Educación Física', score: 90, date: '11 Jun 2026' },
];

const MOCK_TODAY_SCHEDULE = [
  { time: '7:00 - 7:45', subject: 'Matemáticas', teacher: 'Lic. Juan Pérez' },
  { time: '7:45 - 8:30', subject: 'Lengua Española', teacher: 'Lic. María García' },
  { time: '8:30 - 9:15', subject: 'Ciencias Sociales', teacher: 'Lic. Carlos Rodríguez' },
  { time: '9:15 - 9:45', subject: 'Receso', teacher: '' },
  { time: '9:45 - 10:30', subject: 'Inglés', teacher: 'Lic. Ana Martínez' },
];

const MOCK_COMMUNICATIONS = [
  { title: 'Reunión de padres', date: '20 Jun 2026', from: 'Dirección' },
  { title: 'Entrega de calificaciones', date: '25 Jun 2026', from: 'Secretaría' },
];

function scoreColor(score: number) {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
}

export function StudentDashboard() {
  const userData = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const studentName = userData?.name || userData?.fullName || 'Estudiante';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {studentName}
        </h1>
        <p className="text-gray-500 mt-1">Resumen de tu rendimiento académico</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_KPIS.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Grades & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Calificaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_RECENT_GRADES.map((grade) => (
                <div
                  key={grade.subject}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{grade.subject}</p>
                    <p className="text-xs text-gray-500">{grade.date}</p>
                  </div>
                  <span className={`text-lg font-bold ${scoreColor(grade.score)}`}>
                    {grade.score}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary-600" />
              Horario de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MOCK_TODAY_SCHEDULE.map((item) => (
                <div
                  key={item.time}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${
                    item.subject === 'Receso'
                      ? 'bg-gray-50 text-gray-400'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500 w-20">{item.time}</span>
                    <div>
                      <p className="font-medium text-gray-900">{item.subject}</p>
                      {item.teacher && (
                        <p className="text-xs text-gray-500">{item.teacher}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            Comunicaciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_COMMUNICATIONS.map((comm) => (
              <div
                key={comm.title}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{comm.title}</p>
                  <p className="text-xs text-gray-500">De: {comm.from}</p>
                </div>
                <span className="text-xs text-gray-400">{comm.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
