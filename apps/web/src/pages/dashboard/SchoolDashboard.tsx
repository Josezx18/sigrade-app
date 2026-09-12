import { useState } from 'react';
import {
  Home,
  BookOpen,
  Users,
  FileText,
  GraduationCap,
  Award,
  Calendar,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Minus,
  School,
  Clock,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Activity,
  BarChart3,
  PieChart,
  Mail,
  BookMarked,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { useAuth } from '../../hooks/useAuth';
import { useSchoolDashboard } from '../../hooks/api/useAnalytics';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface KpiData {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  trendLabel: string;
  icon: React.ElementType;
  color: string;
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  description: string;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

interface SubjectDetail {
  id: string;
  name: string;
  students: number;
  average: number;
  approval: number;
  attendance: number;
  teacher: string;
}

interface CourseOverview {
  id: string;
  name: string;
  gradeLevel: string;
  students: number;
  average: number;
  approval: number;
  attendance: number;
  teacher: string;
  subjects: SubjectDetail[];
}

interface TeacherPersonal {
  id: string;
  nombre: string;
  email: string;
  especialidad: string;
  cursos: string[];
  estado: 'Activo' | 'Inactivo' | 'Licencia';
  ultimaActividad: string;
  promedioEstudiantes: number;
}

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_SCHOOL = {
  name: 'Centro Educativo San Felipe',
  code: 'CE-00123',
  director: 'María Altagracia Rodríguez',
  nivel: 'Primaria y Secundaria',
  sector: 'Público',
  estudiantes: 845,
  docentes: 48,
  period: '2025-2026',
};

const MOCK_KPIS: KpiData[] = [
  { label: 'Matrícula Total', value: '845', trend: 'up', trendLabel: '+12 vs período anterior', icon: Users, color: 'bg-primary-100 text-primary-600' },
  { label: 'Docentes Activos', value: '48', trend: 'up', trendLabel: '+3 este año', icon: GraduationCap, color: 'bg-success-100 text-success-600' },
  { label: 'Promedio General', value: '81.3%', trend: 'up', trendLabel: '+2.1% vs período anterior', icon: Award, color: 'bg-warning-100 text-warning-600' },
  { label: 'Asistencia General', value: '89.7%', trend: 'down', trendLabel: '-1.2% vs período anterior', icon: Calendar, color: 'bg-blue-100 text-blue-600' },
  { label: 'Planificaciones Completadas', value: '78.5%', trend: 'up', trendLabel: '+5.3% este mes', icon: ClipboardList, color: 'bg-purple-100 text-purple-600' },
  { label: 'Tasa de Aprobación', value: '85.2%', trend: 'stable', trendLabel: '±0% vs período anterior', icon: BookOpen, color: 'bg-orange-100 text-orange-600' },
];

const MOCK_QUICK_ACTIONS: QuickAction[] = [
  { label: 'Ver Estudiantes', icon: Users, description: 'Gestionar matrícula y expedientes' },
  { label: 'Gestionar Docentes', icon: GraduationCap, description: 'Asignaciones y horarios' },
  { label: 'Calificaciones', icon: Award, description: 'Registro y consulta de notas' },
  { label: 'Asistencia', icon: Calendar, description: 'Control de asistencia diaria' },
  { label: 'Planificaciones', icon: ClipboardList, description: 'Planificaciones docentes' },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', user: 'María García', action: 'registró calificaciones', target: '3ro A - Matemáticas', time: 'Hace 15 min' },
  { id: '2', user: 'Carlos Pérez', action: 'subió planificación', target: '4to A - Lengua Española', time: 'Hace 1 hora' },
  { id: '3', user: 'Ana Martínez', action: 'registró asistencia', target: '5to B', time: 'Hace 2 horas' },
  { id: '4', user: 'Roberto Díaz', action: 'actualizó expediente', target: 'Estudiante Juan Pérez', time: 'Hace 3 horas' },
  { id: '5', user: 'Sistema', action: 'generó reporte', target: 'Rendimiento por Curso', time: 'Hace 5 horas' },
];

const MOCK_COURSES: CourseOverview[] = [
  {
    id: '1', name: '1ro A', gradeLevel: 'Primer Grado', students: 32, average: 78.4, approval: 82.0, attendance: 91.2, teacher: 'Sofía Torres',
    subjects: [
      { id: 's1', name: 'Lengua Española', students: 32, average: 80.1, approval: 84.0, attendance: 91.2, teacher: 'Sofía Torres' },
      { id: 's2', name: 'Matemáticas', students: 32, average: 76.2, approval: 79.0, attendance: 91.2, teacher: 'María García' },
      { id: 's3', name: 'Ciencias Sociales', students: 32, average: 79.8, approval: 83.0, attendance: 91.2, teacher: 'Carlos Pérez' },
    ],
  },
  {
    id: '2', name: '3ro A', gradeLevel: 'Tercer Grado', students: 30, average: 82.1, approval: 86.0, attendance: 89.5, teacher: 'María García',
    subjects: [
      { id: 's4', name: 'Matemáticas', students: 30, average: 84.3, approval: 88.0, attendance: 89.5, teacher: 'María García' },
      { id: 's5', name: 'Lengua Española', students: 30, average: 80.5, approval: 84.0, attendance: 89.5, teacher: 'Sofía Torres' },
    ],
  },
  {
    id: '3', name: '4to A', gradeLevel: 'Cuarto Grado', students: 28, average: 75.8, approval: 78.0, attendance: 86.3, teacher: 'Carlos Pérez',
    subjects: [
      { id: 's6', name: 'Lengua Española', students: 28, average: 76.2, approval: 79.0, attendance: 86.3, teacher: 'Carlos Pérez' },
      { id: 's7', name: 'Ciencias Sociales', students: 28, average: 74.1, approval: 76.0, attendance: 86.3, teacher: 'Carlos Pérez' },
      { id: 's8', name: 'Ciencias Naturales', students: 28, average: 77.9, approval: 81.0, attendance: 86.3, teacher: 'Ana Martínez' },
    ],
  },
  {
    id: '4', name: '5to B', gradeLevel: 'Quinto Grado', students: 25, average: 88.6, approval: 93.0, attendance: 96.8, teacher: 'Ana Martínez',
    subjects: [
      { id: 's9', name: 'Ciencias Naturales', students: 25, average: 91.2, approval: 95.0, attendance: 96.8, teacher: 'Ana Martínez' },
      { id: 's10', name: 'Inglés', students: 25, average: 86.0, approval: 91.0, attendance: 96.8, teacher: 'Roberto Díaz' },
    ],
  },
  {
    id: '5', name: '6to A', gradeLevel: 'Sexto Grado', students: 27, average: 80.3, approval: 84.0, attendance: 90.1, teacher: 'Jorge Medina',
    subjects: [
      { id: 's11', name: 'Matemáticas', students: 27, average: 79.8, approval: 83.0, attendance: 90.1, teacher: 'Jorge Medina' },
      { id: 's12', name: 'Ciencias Naturales', students: 27, average: 81.5, approval: 85.0, attendance: 90.1, teacher: 'Jorge Medina' },
      { id: 's13', name: 'Inglés', students: 27, average: 78.9, approval: 82.0, attendance: 90.1, teacher: 'Roberto Díaz' },
    ],
  },
];

const MOCK_TEACHERS: TeacherPersonal[] = [
  { id: '1', nombre: 'María García', email: 'maria.garcia@edu.do', especialidad: 'Matemáticas', cursos: ['3ro A', '3ro B'], estado: 'Activo', ultimaActividad: '2026-07-10 10:30', promedioEstudiantes: 84.3 },
  { id: '2', nombre: 'Carlos Pérez', email: 'carlos.perez@edu.do', especialidad: 'Lengua Española y Cs. Sociales', cursos: ['4to A'], estado: 'Activo', ultimaActividad: '2026-07-10 09:15', promedioEstudiantes: 75.8 },
  { id: '3', nombre: 'Ana Martínez', email: 'ana.martinez@edu.do', especialidad: 'Ciencias Naturales', cursos: ['5to B', '5to C'], estado: 'Activo', ultimaActividad: '2026-07-10 11:00', promedioEstudiantes: 91.2 },
  { id: '4', nombre: 'Roberto Díaz', email: 'roberto.diaz@edu.do', especialidad: 'Inglés', cursos: ['5to B', '6to A', '6to B'], estado: 'Licencia', ultimaActividad: '2026-07-08 14:20', promedioEstudiantes: 82.5 },
  { id: '5', nombre: 'Luisa Fernández', email: 'luisa.fernandez@edu.do', especialidad: 'Educación Física', cursos: ['3ro A', '4to A'], estado: 'Activo', ultimaActividad: '2026-07-09 08:45', promedioEstudiantes: 96.0 },
  { id: '6', nombre: 'Pedro Ramírez', email: 'pedro.ramirez@edu.do', especialidad: 'Música', cursos: ['5to A'], estado: 'Inactivo', ultimaActividad: '2026-07-01 07:30', promedioEstudiantes: 68.2 },
  { id: '7', nombre: 'Sofía Torres', email: 'sofia.torres@edu.do', especialidad: 'Lengua Española', cursos: ['1ro A', '1ro B', '2do A'], estado: 'Activo', ultimaActividad: '2026-07-10 12:00', promedioEstudiantes: 89.5 },
  { id: '8', nombre: 'Jorge Medina', email: 'jorge.medina@edu.do', especialidad: 'Matemáticas y Cs. Naturales', cursos: ['6to A'], estado: 'Activo', ultimaActividad: '2026-07-09 16:10', promedioEstudiantes: 81.3 },
];

const MOCK_REPORT_CARDS: ReportCard[] = [
  { id: '1', title: 'Rendimiento por Curso', description: 'Promedio de calificaciones agrupado por curso y asignatura', icon: BarChart3, color: 'bg-primary-100 text-primary-600' },
  { id: '2', title: 'Asistencia por Grado', description: 'Porcentaje de asistencia desglosado por nivel y grado', icon: PieChart, color: 'bg-success-100 text-success-600' },
  { id: '3', title: 'Comparativa Períodos', description: 'Evolución de indicadores clave entre períodos académicos', icon: Activity, color: 'bg-purple-100 text-purple-600' },
  { id: '4', title: 'Estudiantes en Riesgo', description: 'Listado de estudiantes con bajo rendimiento y alertas tempranas', icon: AlertTriangle, color: 'bg-danger-100 text-danger-600' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const trendIcon = (trend: KpiData['trend']) => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-4 h-4 text-success-600" />;
    case 'down': return <TrendingDown className="w-4 h-4 text-danger-600" />;
    case 'stable': return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
};

const statusBadge = (estado: TeacherPersonal['estado']) => {
  const map: Record<string, { variant: 'success' | 'danger' | 'warning'; label: string }> = {
    Activo: { variant: 'success', label: 'Activo' },
    Inactivo: { variant: 'danger', label: 'Inactivo' },
    Licencia: { variant: 'warning', label: 'Licencia' },
  };
  const m = map[estado];
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

const avgColor = (v: number) => v >= 85 ? 'text-success-600' : v >= 70 ? 'text-warning-600' : 'text-danger-600';

const miniBar = (value: number) => {
  const color = value >= 85 ? 'bg-success-500' : value >= 70 ? 'bg-warning-500' : 'bg-danger-500';
  return (
    <div className="w-20 h-1.5 bg-secondary-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Tab: Inicio                                                        */
/* ------------------------------------------------------------------ */

export function InicioTab() {
  const { data, isLoading } = useSchoolDashboard();
  const { user } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  const kpisData = data?.kpis;
  const kpis: KpiData[] = kpisData ? [
    { label: 'Matrícula Total', value: String(kpisData.totalStudents), trend: 'up', trendLabel: 'Datos actualizados', icon: Users, color: 'bg-primary-100 text-primary-600' },
    { label: 'Docentes Activos', value: String(kpisData.activeTeachers), trend: 'stable', trendLabel: 'Período actual', icon: GraduationCap, color: 'bg-success-100 text-success-600' },
    { label: 'Promedio General', value: `${kpisData.averageGrade.toFixed(1)}%`, trend: 'stable', trendLabel: 'Período actual', icon: Award, color: 'bg-warning-100 text-warning-600' },
    { label: 'Asistencia General', value: `${kpisData.attendanceRate.toFixed(1)}%`, trend: 'stable', trendLabel: 'Período actual', icon: Calendar, color: 'bg-blue-100 text-blue-600' },
    { label: 'Tasa de Aprobación', value: `${kpisData.approvalRate.toFixed(1)}%`, trend: 'stable', trendLabel: 'Período actual', icon: BookOpen, color: 'bg-orange-100 text-orange-600' },
    { label: 'Alertas Activas', value: String(kpisData.studentsWithAlerts), trend: 'stable', trendLabel: 'Requieren atención', icon: ClipboardList, color: 'bg-purple-100 text-purple-600' },
  ] : MOCK_KPIS;

  const activity: ActivityItem[] = data?.recentActivity?.length
    ? data.recentActivity.map((a) => ({
        id: a.id,
        user: a.user,
        action: a.description,
        target: a.type,
        time: a.timestamp,
      }))
    : MOCK_ACTIVITY;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <School className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{MOCK_SCHOOL.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {MOCK_SCHOOL.code} · {MOCK_SCHOOL.nivel} · {MOCK_SCHOOL.sector}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Director: {MOCK_SCHOOL.director} · Período {MOCK_SCHOOL.period}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Bienvenido,</p>
              <p className="text-sm font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {trendIcon(kpi.trend)}
                  <span className="text-xs text-muted-foreground">{kpi.trendLabel}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Acceso Rápido</CardTitle>
            <CardDescription>Funciones principales del centro educativo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {MOCK_QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-center group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-sm">{action.label}</span>
                    <span className="text-xs text-muted-foreground">{action.description}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el centro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{item.user}</span> {item.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.target}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Académico                                                     */
/* ------------------------------------------------------------------ */

export function AcademicoTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const summary = {
    totalCursos: MOCK_COURSES.length,
    totalEstudiantes: MOCK_COURSES.reduce((acc, c) => acc + c.students, 0),
    promedioGeneral: (MOCK_COURSES.reduce((acc, c) => acc + c.average, 0) / MOCK_COURSES.length).toFixed(1),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Panorama Académico</h2>
        <p className="text-sm text-muted-foreground mt-1">Vista general de cursos y asignaturas del centro</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cursos</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalCursos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success-100 text-success-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Estudiantes</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalEstudiantes}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Promedio General</p>
              <p className="text-2xl font-bold text-foreground">{summary.promedioGeneral}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cursos</CardTitle>
          <CardDescription>Haz clic en una fila para ver las asignaturas del curso</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary-50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-8" />
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Curso</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nivel</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Estudiantes</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Promedio</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Aprobación</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Asistencia</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Docente</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COURSES.map((course) => (
                  <>
                    <tr
                      key={course.id}
                      className="border-b border-border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === course.id ? null : course.id)}
                    >
                      <td className="py-3 px-4">
                        {expandedId === course.id
                          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        }
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{course.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{course.gradeLevel}</td>
                      <td className="py-3 px-4 text-center">{course.students}</td>
                      <td className={`py-3 px-4 text-center font-medium ${avgColor(course.average)}`}>{course.average.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-center">{course.approval.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-center">{course.attendance.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-muted-foreground">{course.teacher}</td>
                    </tr>
                    {expandedId === course.id && (
                      <tr key={`${course.id}-expanded`}>
                        <td colSpan={8} className="bg-secondary-50/50 p-0">
                          <div className="px-6 py-4 space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asignaturas</p>
                            <div className="grid gap-2">
                              {course.subjects.map((subject) => (
                                <div key={subject.id} className="flex items-center gap-4 p-3 rounded-lg bg-white border border-border">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">{subject.name}</p>
                                    <p className="text-xs text-muted-foreground">{subject.teacher}</p>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs">
                                    <div className="text-center">
                                      <p className="text-muted-foreground">Est.</p>
                                      <p className="font-medium text-foreground">{subject.students}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-muted-foreground">Prom.</p>
                                      <p className={`font-medium ${avgColor(subject.average)}`}>{subject.average.toFixed(1)}%</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-muted-foreground">Aprob.</p>
                                      <p className="font-medium">{subject.approval.toFixed(1)}%</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-muted-foreground">Asist.</p>
                                      <p className="font-medium">{subject.attendance.toFixed(1)}%</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Personal                                                      */
/* ------------------------------------------------------------------ */

export function PersonalTab() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const filtered = MOCK_TEACHERS.filter((t) => {
    const matchSearch =
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.especialidad.toLowerCase().includes(search.toLowerCase()) ||
      t.cursos.some((c) => c.toLowerCase().includes(search.toLowerCase()));
    if (!matchSearch) return false;
    if (filterStatus !== 'todos' && t.estado !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Personal Docente</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} docente(s) encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="Inactivo">Inactivo</SelectItem>
              <SelectItem value="Licencia">Licencia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((teacher) => (
          <Card key={teacher.id} className="hover:shadow-lg transition-all hover:border-primary-300 group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                    {teacher.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{teacher.nombre}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{teacher.email}</span>
                    </div>
                  </div>
                </div>
                {statusBadge(teacher.estado)}
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{teacher.especialidad}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {teacher.cursos.map((curso) => (
                      <Badge key={curso} variant="outline" className="text-xs">{curso}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Prom. estudiantes: </span>
                  <span className={`font-medium ${avgColor(teacher.promedioEstudiantes)}`}>
                    {teacher.promedioEstudiantes.toFixed(1)}%
                  </span>
                  {miniBar(teacher.promedioEstudiantes)}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">Últ. actividad: {teacher.ultimaActividad}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">No se encontraron docentes</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Intenta ajustar los filtros o el término de búsqueda.</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Reportes                                                      */
/* ------------------------------------------------------------------ */

export function ReportesTab() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Reportes</h2>
          <p className="text-sm text-muted-foreground">Genera reportes y exporta datos del centro educativo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {MOCK_REPORT_CARDS.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${report.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground">{report.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    isLoading={generating === report.id}
                    onClick={() => handleGenerate(report.id)}
                  >
                    {generating === report.id ? 'Generando...' : 'Generar'}
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="h-24 flex items-end gap-1">
                    {[65, 78, 82, 71, 88, 74, 80].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-primary-200 hover:bg-primary-400 transition-colors cursor-pointer relative group"
                        style={{ height: `${h}%` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {h}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'].map((m) => (
                      <span key={m} className="text-xs text-muted-foreground">{m}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main SchoolDashboard                                               */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'academico', label: 'Académico', icon: BookOpen },
  { id: 'personal', label: 'Personal', icon: Users },
  { id: 'reportes', label: 'Reportes', icon: FileText },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SchoolDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('inicio');

  const renderTab = () => {
    switch (activeTab) {
      case 'inicio':
        return <InicioTab />;
      case 'academico':
        return <AcademicoTab />;
      case 'personal':
        return <PersonalTab />;
      case 'reportes':
        return <ReportesTab />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all
                  ${isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-secondary-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {renderTab()}
      </div>
    </div>
  );
}
