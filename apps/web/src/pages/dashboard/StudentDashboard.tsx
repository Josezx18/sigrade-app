import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Award, Calendar, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GradeSummary {
  average: number;
  total: number;
  bySubject: { subjectName: string; average: number }[];
}

interface AttendanceSummary {
  attendanceRate: number;
  present: number;
  absent: number;
  total: number;
}

const MOCK_GRADES: GradeSummary = {
  average: 82.6,
  total: 4,
  bySubject: [
    { subjectName: 'Matemáticas', average: 85.0 },
    { subjectName: 'Lengua Española', average: 72.5 },
    { subjectName: 'Ciencias Naturales', average: 68.3 },
    { subjectName: 'Ciencias Sociales', average: 90.8 },
  ],
};

const MOCK_ATTENDANCE: AttendanceSummary = {
  attendanceRate: 90.2,
  present: 37,
  absent: 4,
  total: 41,
};

export function StudentDashboard() {
  const { user } = useAuth();
  const isParent = user?.roles?.some(r => r.type === 'PARENT');
  const studentId = user?.studentId;

  const { data: grades, isLoading: loadingGrades } = useQuery({
    queryKey: ['student', 'grades', studentId],
    queryFn: () => api.get(`/grades/history/${studentId}`).then(r => r.data as GradeSummary),
    enabled: !!studentId,
  });

  const { data: attendance, isLoading: loadingAtt } = useQuery({
    queryKey: ['student', 'attendance', studentId],
    queryFn: () => api.get(`/attendance/student-summary`, { params: { studentId } }).then(r => r.data as AttendanceSummary),
    enabled: !!studentId,
  });

  if (loadingGrades || loadingAtt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const gradesData = grades ?? MOCK_GRADES;
  const attendanceData = attendance ?? MOCK_ATTENDANCE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isParent ? 'Panel Familiar' : 'Mi Panel'}
        </h1>
        <p className="text-muted-foreground">
          {isParent ? 'Consulta el progreso académico de tus hijos' : 'Bienvenido(a), ' + (user?.firstName ?? '')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Promedio General"
          value={`${gradesData.average.toFixed(1)} pts`}
          icon={<Award className="w-5 h-5" />}
          color="primary"
        />
        <StatsCard
          label="Asistencia"
          value={`${attendanceData.attendanceRate.toFixed(1)}%`}
          icon={<Calendar className="w-5 h-5" />}
          color="success"
        />
        <StatsCard
          label="Asignaturas"
          value={gradesData.bySubject.length}
          icon={<BookOpen className="w-5 h-5" />}
          color="info"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rendimiento por Asignatura</CardTitle>
            <Link to="/grades" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {gradesData.bySubject.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay calificaciones registradas</p>
            ) : (
              <div className="space-y-3">
                {gradesData.bySubject.map(subj => (
                  <div key={subj.subjectName} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{subj.subjectName}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${subj.average >= 70 ? 'bg-success-500' : subj.average >= 50 ? 'bg-warning-500' : 'bg-danger-500'}`}
                          style={{ width: `${Math.min(subj.average, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${subj.average >= 70 ? 'text-success-600' : subj.average >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>
                        {subj.average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Resumen de Asistencia</CardTitle>
            <Link to="/attendance" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver detalle <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {attendanceData.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay registros de asistencia</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke={attendanceData.attendanceRate >= 80 ? '#22c55e' : attendanceData.attendanceRate >= 60 ? '#eab308' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${attendanceData.attendanceRate}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-foreground">{attendanceData.attendanceRate.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-success-600">{attendanceData.present}</p>
                    <p className="text-xs text-muted-foreground">Presentes</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-danger-600">{attendanceData.absent}</p>
                    <p className="text-xs text-muted-foreground">Ausencias</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{attendanceData.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acceso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link to="/grades" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">Mis Calificaciones</span>
            </Link>
            <Link to="/attendance" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-lg bg-success-100 text-success-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">Mi Asistencia</span>
            </Link>
            <Link to="/calendar" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-lg bg-warning-100 text-warning-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">Calendario Escolar</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
