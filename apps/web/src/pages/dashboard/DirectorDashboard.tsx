import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, Award, Calendar, ClipboardCheck, AlertTriangle,
  BookOpen, TrendingUp, TrendingDown, BarChart3, UserPlus, UserMinus,
  Settings, FileText, Search, Filter, Clock, CheckCircle,
  Activity, Flame,
  School, Minus, MoreHorizontal, ChevronRight,
  FileEdit, Eye, Brain, Download, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useSchoolDashboard, useSubjectPerformance, useGradeDistribution, useAttendanceTrends } from '../../hooks/api/useAnalytics';

// ─── Types ───────────────────────────────────────────

interface TeacherInfo {
  id: string;
  name: string;
  email: string;
  courses: string[];
  status: 'activo' | 'inactivo' | 'licencia';
  lastActivity: string;
  averageGrade: number;
  approvalRate: number;
}

interface CoordinatorInfo {
  id: string;
  name: string;
  email: string;
  area: string;
  teachers: number;
}

interface AuditEntry {
  id: string;
  user: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
  date: string;
}

interface SuspectedGrade {
  teacher: string;
  course: string;
  avgGrade: number;
  neverFails: boolean;
  inflation: boolean;
  students: number;
}

type TabId = 'inicio' | 'estadisticas' | 'gestion' | 'calidad' | 'auditoria';

// ─── Mock Data (Gestión, Calidad, Auditoría) ────────

const TEACHERS: TeacherInfo[] = [
  { id: '1', name: 'María García', email: 'maria.garcia@escuela.edu', courses: ['Matemáticas 1ro', 'Matemáticas 2do'], status: 'activo', lastActivity: '2026-07-10 08:30', averageGrade: 81.3, approvalRate: 88.5 },
  { id: '2', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@escuela.edu', courses: ['Lengua 3ro', 'Lengua 4to'], status: 'activo', lastActivity: '2026-07-10 09:15', averageGrade: 76.8, approvalRate: 82.1 },
  { id: '3', name: 'Ana Martínez', email: 'ana.martinez@escuela.edu', courses: ['Ciencias 5to', 'Ciencias 6to'], status: 'activo', lastActivity: '2026-07-09 14:45', averageGrade: 84.2, approvalRate: 91.3 },
  { id: '4', name: 'Pedro Ramírez', email: 'pedro.ramirez@escuela.edu', courses: ['Sociales 1ro', 'Sociales 2do', 'Sociales 3ro'], status: 'activo', lastActivity: '2026-07-10 07:50', averageGrade: 79.5, approvalRate: 85.7 },
  { id: '5', name: 'Laura Fernández', email: 'laura.fernandez@escuela.edu', courses: ['Inglés 4to', 'Inglés 5to', 'Inglés 6to'], status: 'licencia', lastActivity: '2026-07-08 12:00', averageGrade: 88.0, approvalRate: 94.2 },
  { id: '6', name: 'José López', email: 'jose.lopez@escuela.edu', courses: ['Educación Física'], status: 'activo', lastActivity: '2026-07-10 10:00', averageGrade: 85.6, approvalRate: 97.8 },
  { id: '7', name: 'Diana Torres', email: 'diana.torres@escuela.edu', courses: ['Arte 1ro', 'Arte 2do', 'Arte 3ro'], status: 'inactivo', lastActivity: '2026-07-05 11:20', averageGrade: 82.1, approvalRate: 90.0 },
  { id: '8', name: 'Roberto Castillo', email: 'roberto.castillo@escuela.edu', courses: ['Música 4to', 'Música 5to', 'Música 6to'], status: 'activo', lastActivity: '2026-07-10 08:00', averageGrade: 87.3, approvalRate: 95.4 },
];

const COORDINATORS: CoordinatorInfo[] = [
  { id: '1', name: 'Sofía Mendoza', email: 'sofia.mendoza@escuela.edu', area: 'Ciencias', teachers: 3 },
  { id: '2', name: 'Luis Herrera', email: 'luis.herrera@escuela.edu', area: 'Humanidades', teachers: 2 },
  { id: '3', name: 'Carmen Vargas', email: 'carmen.vargas@escuela.edu', area: 'Idiomas', teachers: 2 },
  { id: '4', name: 'Miguel Ángel Peña', email: 'miguel.pena@escuela.edu', area: 'Educación Física y Arte', teachers: 2 },
];

const TEACHERS_WITHOUT_PLANNING = [
  { name: 'Laura Fernández', course: 'Inglés 4to', days: 5, reason: 'Licencia médica' },
  { name: 'José López', course: 'Educación Física 5to', days: 3, reason: 'Pendiente de revisión' },
  { name: 'Diana Torres', course: 'Arte 3ro', days: 8, reason: 'No ha subido planificación' },
  { name: 'Roberto Castillo', course: 'Música 6to', days: 2, reason: 'En borrador' },
];

const SUSPECTED_GRADES: SuspectedGrade[] = [
  { teacher: 'José López', course: 'Educación Física 5to', avgGrade: 94.7, neverFails: true, inflation: true, students: 24 },
  { teacher: 'Roberto Castillo', course: 'Música 6to', avgGrade: 92.1, neverFails: true, inflation: false, students: 22 },
  { teacher: 'María García', course: 'Matemáticas 2do', avgGrade: 88.5, neverFails: false, inflation: true, students: 29 },
  { teacher: 'Ana Martínez', course: 'Ciencias 5to', avgGrade: 89.3, neverFails: false, inflation: true, students: 24 },
];

const LOW_PERFORMING_GROUPS = [
  { grade: '4to B', average: 66.2, teacher: 'Carlos Rodríguez', studentsAtRisk: 8, trend: 'down' },
  { grade: '2do B', average: 69.5, teacher: 'María García', studentsAtRisk: 6, trend: 'down' },
  { grade: '6to B', average: 71.3, teacher: 'Ana Martínez', studentsAtRisk: 5, trend: 'stable' },
  { grade: '3ro B', average: 72.1, teacher: 'Pedro Ramírez', studentsAtRisk: 4, trend: 'down' },
];

const AT_RISK_STUDENTS = [
  { name: 'Juan Pérez', grade: '4to B', average: 38.5, absences: 12, alerts: 3, risk: 'alto' },
  { name: 'María López', grade: '2do B', average: 42.0, absences: 8, alerts: 2, risk: 'alto' },
  { name: 'Carlos Santos', grade: '6to B', average: 45.2, absences: 6, alerts: 2, risk: 'medio' },
  { name: 'Ana Reyes', grade: '4to B', average: 41.8, absences: 10, alerts: 3, risk: 'alto' },
  { name: 'Luis Castillo', grade: '3ro B', average: 48.0, absences: 5, alerts: 1, risk: 'medio' },
  { name: 'Sofía Jiménez', grade: '2do B', average: 50.3, absences: 7, alerts: 2, risk: 'medio' },
];

const AUDIT_LOG: AuditEntry[] = [
  { id: '1', user: 'María García', action: 'modificó', entity: 'Calificaciones', details: 'Actualizó notas de 5 estudiantes en Matemáticas 1ro A', timestamp: '2026-07-10 10:32', date: '2026-07-10' },
  { id: '2', user: 'Carlos Rodríguez', action: 'creó', entity: 'Planificación', details: 'Nueva planificación para Lengua 3ro - Unidad 4', timestamp: '2026-07-10 09:45', date: '2026-07-10' },
  { id: '3', user: 'Ana Martínez', action: 'eliminó', entity: 'Asistencia', details: 'Eliminó registro duplicado del 2026-07-08 en Ciencias 5to', timestamp: '2026-07-10 09:12', date: '2026-07-10' },
  { id: '4', user: 'Sofía Mendoza (Coord.)', action: 'aprobó', entity: 'Planificación', details: 'Aprobó planificación de Ciencias 6to presentada por Ana Martínez', timestamp: '2026-07-09 16:30', date: '2026-07-09' },
  { id: '5', user: 'Pedro Ramírez', action: 'registró', entity: 'Asistencia', details: 'Registró asistencia del 2026-07-09 para Sociales 1ro', timestamp: '2026-07-09 14:00', date: '2026-07-09' },
  { id: '6', user: 'Sistema', action: 'generó', entity: 'Reporte', details: 'Reporte de rendimiento mensual - Junio 2026', timestamp: '2026-07-09 08:00', date: '2026-07-09' },
  { id: '7', user: 'Laura Fernández', action: 'solicitó', entity: 'Licencia', details: 'Solicitud de licencia médica del 2026-07-08 al 2026-07-15', timestamp: '2026-07-08 11:15', date: '2026-07-08' },
  { id: '8', user: 'Director', action: 'aprobó', entity: 'Licencia', details: 'Aprobó licencia médica de Laura Fernández', timestamp: '2026-07-08 12:00', date: '2026-07-08' },
  { id: '9', user: 'María García', action: 'modificó', entity: 'Planificación', details: 'Actualizó actividades de Matemáticas 2do - Unidad 3', timestamp: '2026-07-08 10:20', date: '2026-07-08' },
  { id: '10', user: 'José López', action: 'registró', entity: 'Calificaciones', details: 'Registró notas del 2do período para Educación Física 5to', timestamp: '2026-07-07 15:45', date: '2026-07-07' },
  { id: '11', user: 'Sistema', action: 'generó', entity: 'Alerta', details: 'Alerta automática: 3 estudiantes en riesgo en 4to B', timestamp: '2026-07-07 08:00', date: '2026-07-07' },
  { id: '12', user: 'Diana Torres', action: 'modificó', entity: 'Perfil', details: 'Actualizó su información de contacto', timestamp: '2026-07-05 11:20', date: '2026-07-05' },
  { id: '13', user: 'Luis Herrera (Coord.)', action: 'asignó', entity: 'Horario', details: 'Asignó horario de aulas para el próximo período', timestamp: '2026-07-05 10:00', date: '2026-07-05' },
  { id: '14', user: 'Carlos Rodríguez', action: 'creó', entity: 'Estudiante', details: 'Registró nuevo estudiante: Diego Fernández', timestamp: '2026-07-04 13:30', date: '2026-07-04' },
  { id: '15', user: 'Sofía Mendoza (Coord.)', action: 'revisó', entity: 'Calificaciones', details: 'Revisión de calificaciones sospechosas en Ciencias 5to', timestamp: '2026-07-04 09:00', date: '2026-07-04' },
];

const ACTION_TYPES = ['todos', 'modificó', 'creó', 'eliminó', 'aprobó', 'registró', 'generó', 'solicitó', 'asignó', 'revisó'];

// ─── Helpers ─────────────────────────────────────────

function gradeColor(value: number): string {
  if (value >= 85) return 'bg-success-500';
  if (value >= 70) return 'bg-warning-500';
  return 'bg-danger-500';
}

function gradeTextColor(value: number): string {
  if (value >= 85) return 'text-success-600';
  if (value >= 70) return 'text-warning-600';
  return 'text-danger-600';
}

function attendanceColor(value: number): string {
  if (value >= 90) return 'bg-success-500';
  if (value >= 80) return 'bg-warning-500';
  return 'bg-danger-500';
}

function attendanceTextColor(value: number): string {
  if (value >= 90) return 'text-success-600';
  if (value >= 80) return 'text-warning-600';
  return 'text-danger-600';
}

// ─── Tab: Inicio ─────────────────────────────────────

export function InicioTab() {
  const { data: dashboard, isLoading, error } = useSchoolDashboard();
  const { user } = useAuth();
  const schoolName = 'Escuela Primaria Juan Pablo Duarte';

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">Error al cargar datos del dashboard</div>;
  if (!dashboard) return null;

  const kpis = [
    { label: 'Total Estudiantes', value: dashboard.kpis.totalStudents.toString(), icon: <Users className="w-6 h-6" />, color: 'bg-primary-100 text-primary-600' },
    { label: 'Total Docentes', value: dashboard.kpis.totalTeachers.toString(), icon: <GraduationCap className="w-6 h-6" />, color: 'bg-success-100 text-success-600' },
    { label: 'Promedio General', value: `${dashboard.kpis.averageGrade.toFixed(1)}%`, icon: <Award className="w-6 h-6" />, color: 'bg-warning-100 text-warning-600' },
    { label: 'Tasa de Aprobación', value: `${dashboard.kpis.approvalRate.toFixed(1)}%`, icon: <ClipboardCheck className="w-6 h-6" />, color: 'bg-success-100 text-success-600' },
    { label: 'Asistencia General', value: `${dashboard.kpis.attendanceRate.toFixed(1)}%`, icon: <Calendar className="w-6 h-6" />, color: 'bg-info-100 text-info-800' },
    { label: 'Alertas Activas', value: dashboard.kpis.studentsWithAlerts.toString(), icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-danger-100 text-danger-600' },
  ];

  const quickActions = [
    { name: 'Gestionar Personal', href: '#gestion', icon: Users, bg: 'bg-primary-100', text: 'text-primary-600' },
    { name: 'Ver Estadísticas', href: '#estadisticas', icon: BarChart3, bg: 'bg-success-100', text: 'text-success-600' },
    { name: 'Reportes', href: '#', icon: FileText, bg: 'bg-warning-100', text: 'text-warning-600' },
    { name: 'Configuración', href: '#', icon: Settings, bg: 'bg-secondary-100', text: 'text-secondary-600' },
  ];

  const alertSeverities: { key: 'critical' | 'high' | 'medium' | 'low'; label: string; desc: string; variant: 'danger' | 'warning' | 'info'; icon: React.ReactNode }[] = [
    { key: 'critical', label: 'Alertas Críticas', desc: `${dashboard.alertsSummary.critical} alertas críticas requieren atención inmediata`, variant: 'danger', icon: <Flame className="w-4 h-4" /> },
    { key: 'high', label: 'Alertas Altas', desc: `${dashboard.alertsSummary.high} alertas de alta prioridad`, variant: 'warning', icon: <AlertTriangle className="w-4 h-4" /> },
    { key: 'medium', label: 'Alertas Medias', desc: `${dashboard.alertsSummary.medium} alertas de prioridad media`, variant: 'warning', icon: <AlertTriangle className="w-4 h-4" /> },
    { key: 'low', label: 'Alertas Bajas', desc: `${dashboard.alertsSummary.low} alertas de baja prioridad`, variant: 'info', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel del Director</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user?.firstName} {user?.lastName} — {schoolName}
          </p>
        </div>
        <Badge variant="info" className="text-sm px-3 py-1">
          <School className="w-4 h-4 mr-1" />
          Centro Educativo
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center`}>
                  {kpi.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accesos directos a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bg} ${action.text}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{action.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas y Notificaciones</CardTitle>
            <CardDescription>Atención requerida en las siguientes áreas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertSeverities.map((a) => (
                <div
                  key={a.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    a.variant === 'danger'
                      ? 'bg-danger-50 border-danger-200'
                      : a.variant === 'warning'
                      ? 'bg-warning-50 border-warning-200'
                      : 'bg-primary-50 border-primary-200'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      a.variant === 'danger'
                        ? 'bg-danger-100 text-danger-600'
                        : a.variant === 'warning'
                        ? 'bg-warning-100 text-warning-600'
                        : 'bg-primary-100 text-primary-600'
                    }`}
                  >
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-medium ${
                          a.variant === 'danger'
                            ? 'text-danger-800'
                            : a.variant === 'warning'
                            ? 'text-warning-800'
                            : 'text-primary-800'
                        }`}
                      >
                        {a.label}
                      </p>
                      <Badge variant={a.variant} className="text-xs">
                        {dashboard.alertsSummary[a.key]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              ))}
            </div>

            {dashboard.recentActivity.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Actividad Reciente
                </p>
                <div className="space-y-2">
                  {dashboard.recentActivity.slice(0, 4).map((act) => (
                    <div key={act.id} className="flex items-start gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground">
                          <span className="font-medium">{act.user}</span>{' '}
                          <span className="text-muted-foreground">{act.description}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{act.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab: Estadísticas ───────────────────────────────

export function EstadisticasTab() {
  const gradeDist = useGradeDistribution();
  const subjectPerf = useSubjectPerformance();
  const attendance = useAttendanceTrends();

  if (gradeDist.isLoading || subjectPerf.isLoading || attendance.isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  if (gradeDist.error || subjectPerf.error || attendance.error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg">Error al cargar datos de estadísticas</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Estadísticas del Centro</h2>
        <p className="text-muted-foreground">Datos académicos y de rendimiento del período actual</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Calificaciones</CardTitle>
            <CardDescription>Rangos de notas y cantidad de estudiantes</CardDescription>
          </CardHeader>
          <CardContent>
            {gradeDist.data && gradeDist.data.length > 0 ? (
              <div className="space-y-3">
                {gradeDist.data.map((g) => (
                  <div key={g.range} className="flex items-center gap-3">
                    <span className="text-sm w-20 font-medium text-foreground shrink-0">{g.range}</span>
                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${gradeColor(parseInt(g.range) || 50)}`}
                        style={{ width: `${g.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right shrink-0">
                      {g.count} ({g.percentage.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay datos de distribución de calificaciones</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendencias de Asistencia</CardTitle>
            <CardDescription>Evolución de la asistencia en los últimos días</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.data && attendance.data.length > 0 ? (
              <div className="space-y-3">
                {attendance.data.slice(0, 10).map((a) => (
                  <div key={a.date} className="flex items-center gap-3">
                    <span className="text-sm w-24 font-medium text-foreground shrink-0">{a.date}</span>
                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${attendanceColor(a.rate)}`}
                        style={{ width: `${a.rate}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold w-12 text-right shrink-0 ${attendanceTextColor(a.rate)}`}>
                      {a.rate.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay datos de tendencias de asistencia</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Asignatura</CardTitle>
          <CardDescription>Promedio de calificaciones y tasa de aprobación por materia</CardDescription>
        </CardHeader>
        <CardContent>
          {subjectPerf.data && subjectPerf.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Asignatura</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Promedio</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Aprobación</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Estudiantes</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Reprobados</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectPerf.data.map((s) => (
                    <tr key={s.subjectId} className="border-b border-border hover:bg-accent/50">
                      <td className="py-3 px-2 font-medium text-foreground">{s.subjectName}</td>
                      <td className={`py-3 px-2 text-center font-semibold ${gradeTextColor(s.averageGrade)}`}>
                        {s.averageGrade.toFixed(1)}%
                      </td>
                      <td className={`py-3 px-2 text-center font-semibold ${s.approvalRate >= 85 ? 'text-success-600' : s.approvalRate >= 70 ? 'text-warning-600' : 'text-danger-600'}`}>
                        {s.approvalRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-2 text-center text-foreground">{s.totalStudents}</td>
                      <td className="py-3 px-2 text-center text-danger-600">{s.failedStudents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay datos de rendimiento por asignatura</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Gestión Personal ───────────────────────────

export function GestionPersonalTab() {
  const [teacherFilter, setTeacherFilter] = useState('todos');

  const filteredTeachers = teacherFilter === 'todos'
    ? TEACHERS
    : TEACHERS.filter((t) => t.status === teacherFilter);

  const statusBadge = (status: TeacherInfo['status']) => {
    const map: Record<string, { variant: 'success' | 'danger' | 'warning'; label: string }> = {
      activo: { variant: 'success', label: 'Activo' },
      inactivo: { variant: 'danger', label: 'Inactivo' },
      licencia: { variant: 'warning', label: 'Licencia' },
    };
    const m = map[status];
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Gestión de Personal</h2>
        <p className="text-muted-foreground">Docentes y coordinadores del centro</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['todos', 'activo', 'inactivo', 'licencia'].map((f) => (
            <Button
              key={f}
              variant={teacherFilter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTeacherFilter(f)}
            >
              {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <UserPlus className="w-4 h-4 mr-1" />
            Añadir Docente
          </Button>
          <Button variant="outline" size="sm">
            <UserMinus className="w-4 h-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Docentes ({TEACHERS.length})</CardTitle>
          <CardDescription>Listado de docentes activos en el centro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Cursos</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Última Actividad</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Nota Prom.</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Aprobación</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="border-b border-border hover:bg-accent/50">
                    <td className="py-3 px-2 font-medium text-foreground">{t.name}</td>
                    <td className="py-3 px-2 text-muted-foreground">{t.email}</td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1">
                        {t.courses.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">{statusBadge(t.status)}</td>
                    <td className="py-3 px-2 text-muted-foreground">{t.lastActivity}</td>
                    <td className={`py-3 px-2 text-center font-semibold ${gradeTextColor(t.averageGrade)}`}>
                      {t.averageGrade.toFixed(1)}%
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-foreground">
                      {t.approvalRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon-sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm">
                          <FileEdit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordinadores ({COORDINATORS.length})</CardTitle>
          <CardDescription>Coordinadores de área asignados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {COORDINATORS.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                  {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="info" className="text-xs">{c.area}</Badge>
                    <span className="text-xs text-muted-foreground">{c.teachers} docentes</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-1" />
          Gestionar Horarios
        </Button>
        <Button variant="outline" size="sm">
          <BookOpen className="w-4 h-4 mr-1" />
          Carga Académica
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: Calidad ────────────────────────────────────

export function CalidadTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Control de Calidad</h2>
        <p className="text-muted-foreground">Supervisión académica y detección de anomalías</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-warning-600" />
                Docentes sin Planificación
              </div>
            </CardTitle>
            <CardDescription>Docentes que no han completado sus planificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TEACHERS_WITHOUT_PLANNING.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="w-9 h-9 rounded-full bg-warning-100 flex items-center justify-center text-warning-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.course}</p>
                    <p className="text-xs text-muted-foreground">{t.reason}</p>
                  </div>
                  <Badge variant="warning" className="shrink-0">
                    {t.days} días
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-danger-600" />
                Notas Sospechosas
              </div>
            </CardTitle>
            <CardDescription>Patrones anómalos en calificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SUSPECTED_GRADES.map((sg, i) => (
                <div key={i} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{sg.teacher}</p>
                    <Badge variant="danger" className="text-xs">{sg.course}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{sg.avgGrade.toFixed(1)}%</span>
                    <span>promedio</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{sg.students} estudiantes</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {sg.neverFails && (
                      <Badge variant="warning" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Nunca reprueba
                      </Badge>
                    )}
                    {sg.inflation && (
                      <Badge variant="danger" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Inflación
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-danger-600" />
                Grupos con Bajo Rendimiento
              </div>
            </CardTitle>
            <CardDescription>Secciones con rendimiento por debajo del promedio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {LOW_PERFORMING_GROUPS.map((g, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="w-9 h-9 rounded-full bg-danger-100 flex items-center justify-center text-danger-600 font-bold">
                    {g.average.toFixed(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{g.grade}</p>
                    <p className="text-xs text-muted-foreground">Docente: {g.teacher}</p>
                    <p className="text-xs text-muted-foreground">{g.studentsAtRisk} estudiantes en riesgo</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="danger" className="text-xs">{g.average.toFixed(1)}%</Badge>
                    {g.trend === 'down' && <TrendingDown className="w-4 h-4 text-danger-500" />}
                    {g.trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-danger-600" />
                Estudiantes en Riesgo
              </div>
            </CardTitle>
            <CardDescription>Estudiantes que requieren intervención inmediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {AT_RISK_STUDENTS.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-accent/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    s.risk === 'alto' ? 'bg-danger-500' : 'bg-warning-500'
                  }`}>
                    {s.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.grade}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`font-semibold ${s.average < 45 ? 'text-danger-600' : 'text-warning-600'}`}>
                      {s.average.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-danger-500">{s.absences} faltas</span>
                    <span className="text-muted-foreground">|</span>
                    <Badge variant={s.risk === 'alto' ? 'danger' : 'warning'} className="text-xs">
                      {s.alerts} alertas
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab: Auditoría ──────────────────────────────────

export function AuditoriaTab() {
  const [dateFilter, setDateFilter] = useState('todas');
  const [actionFilter, setActionFilter] = useState('todos');
  const [userFilter, setUserFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const uniqueUsers = useMemo(() => {
    const set = new Set(AUDIT_LOG.map((e) => e.user));
    return ['todos', ...Array.from(set)];
  }, []);

  const uniqueDates = useMemo(() => {
    const set = new Set(AUDIT_LOG.map((e) => e.date));
    return ['todas', ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    return AUDIT_LOG.filter((entry) => {
      if (dateFilter !== 'todas' && entry.date !== dateFilter) return false;
      if (actionFilter !== 'todos' && entry.action !== actionFilter) return false;
      if (userFilter !== 'todos' && entry.user !== userFilter) return false;
      if (searchQuery && !entry.details.toLowerCase().includes(searchQuery.toLowerCase()) && !entry.entity.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [dateFilter, actionFilter, userFilter, searchQuery]);

  const actionBadgeVariant = (action: string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'secondary'> = {
      modificó: 'warning',
      creó: 'success',
      eliminó: 'danger',
      aprobó: 'success',
      registró: 'info',
      generó: 'secondary',
      solicitó: 'info',
      asignó: 'info',
      revisó: 'warning',
    };
    return map[action] || 'secondary';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Registro de Auditoría</h2>
        <p className="text-muted-foreground">Actividad reciente en el sistema</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>
            <select
              className="h-9 rounded-lg border border-secondary-300 bg-white px-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="todas">Todas las fechas</option>
              {uniqueDates.filter((d) => d !== 'todas').map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-lg border border-secondary-300 bg-white px-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {ACTION_TYPES.map((a) => (
                <option key={a} value={a}>{a === 'todos' ? 'Todas las acciones' : a}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-lg border border-secondary-300 bg-white px-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="todos">Todos los usuarios</option>
              {uniqueUsers.filter((u) => u !== 'todos').map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar en auditoría..."
                className="h-9 rounded-lg border border-secondary-300 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none w-60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>{filtered.length} registros encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {filtered.map((entry, idx) => (
              <div
                key={entry.id}
                className={`flex items-start gap-4 p-3 ${idx < filtered.length - 1 ? 'border-b border-border' : ''} hover:bg-accent/50 rounded-lg transition-colors`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  entry.action === 'eliminó' || entry.action === 'generó' && entry.entity === 'Alerta'
                    ? 'bg-danger-100 text-danger-600'
                    : entry.action === 'creó' || entry.action === 'aprobó'
                    ? 'bg-success-100 text-success-600'
                    : 'bg-primary-100 text-primary-600'
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{entry.user}</span>
                    <Badge variant={actionBadgeVariant(entry.action)} className="text-xs">
                      {entry.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{entry.entity}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{entry.details}</p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {entry.timestamp}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No se encontraron registros con los filtros aplicados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main DirectorDashboard ──────────────────────────

export function DirectorDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('inicio');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio', label: 'Inicio', icon: <School className="w-4 h-4" /> },
    { id: 'estadisticas', label: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'gestion', label: 'Gestión Personal', icon: <Users className="w-4 h-4" /> },
    { id: 'calidad', label: 'Calidad', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'auditoria', label: 'Auditoría', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'inicio' && <InicioTab />}
      {activeTab === 'estadisticas' && <EstadisticasTab />}
      {activeTab === 'gestion' && <GestionPersonalTab />}
      {activeTab === 'calidad' && <CalidadTab />}
      {activeTab === 'auditoria' && <AuditoriaTab />}
    </div>
  );
}
