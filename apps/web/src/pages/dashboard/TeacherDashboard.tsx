import { useState, useEffect } from 'react';
import {
  Home, GraduationCap, ClipboardList, Calendar, FileUp, MessageSquare,
  BookOpen as BookOpenIcon, Users, User, Award, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Clock, Upload, Download,
  CheckCircle2, Plus, Send, Target, BrainCircuit,
  FileText, Video, FlaskConical, Presentation, File,
  Clock4, CheckCheck, Ban,
  CalendarDays, UserCheck, UserX, UserMinus,
  Heart, ExternalLink, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTeacherDashboard, useTeacherAssignments } from '../../hooks/api/useAnalytics';
import { usePlanningStats, usePlannings } from '../../hooks/api/usePlanning';
import { useGrades } from '../../hooks/api/useGrades';
import { useAttendanceRecords } from '../../hooks/api/useAttendance';
import { StudentProgress, TeacherAssignment, TeacherDashboardData } from '../../services/analyticsApi';
import { AttendanceRecord } from '../../services/attendanceApi';
import { Planning } from '../../services/planningApi';
import { Grade } from '../../services/gradeApi';

// ─── Tab Configuration ───────────────────────────────────────────────────────

type TabId = 'inicio' | 'calificaciones' | 'planificaciones' | 'asistencia' | 'evidencias' | 'comunicacion' | 'recursos' | 'perfil';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'calificaciones', label: 'Calificaciones', icon: GraduationCap },
  { id: 'planificaciones', label: 'Planificaciones', icon: ClipboardList },
  { id: 'asistencia', label: 'Asistencia', icon: Calendar },
  { id: 'evidencias', label: 'Evidencias', icon: FileUp },
  { id: 'comunicacion', label: 'Comunicación', icon: MessageSquare },
  { id: 'recursos', label: 'Recursos', icon: BookOpenIcon },
  { id: 'perfil', label: 'Perfil', icon: User },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGradeColor(value: number): string {
  if (value >= 90) return 'text-success-600 font-medium';
  if (value >= 70) return 'text-warning-600 font-medium';
  return 'text-danger-600 font-medium';
}

function getTrendIcon(trend: string) {
  if (trend === 'IMPROVING') return { Icon: TrendingUp, color: 'text-success-500' };
  if (trend === 'DECLINING') return { Icon: TrendingDown, color: 'text-danger-500' };
  return { Icon: Minus, color: 'text-muted-foreground' };
}

function getStatusBadge(status: string) {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'secondary'; label: string }> = {
    APPROVED: { variant: 'success', label: 'Aprobada' },
    SUBMITTED: { variant: 'warning', label: 'Pendiente' },
    REJECTED: { variant: 'danger', label: 'Rechazada' },
    DRAFT: { variant: 'secondary', label: 'Borrador' },
  };
  return map[status] || { variant: 'secondary' as const, label: status };
}

function getCurrentDayName(): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[new Date().getDay()];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_TEACHER_DASHBOARD: TeacherDashboardData = {
  teacherId: 'mock-tch-001',
  teacherName: 'Pedro Jiménez',
  courses: [
    { courseId: 'c-3a', courseName: '3° A', subject: 'Matemáticas', studentsCount: 28, averageGrade: 78.5, approvalRate: 82.1, attendanceRate: 91.3, planningsProgress: 85 },
    { courseId: 'c-3b', courseName: '3° B', subject: 'Matemáticas', studentsCount: 26, averageGrade: 72.3, approvalRate: 73.1, attendanceRate: 88.7, planningsProgress: 70 },
    { courseId: 'c-4a', courseName: '4° A', subject: 'Álgebra', studentsCount: 30, averageGrade: 81.2, approvalRate: 86.7, attendanceRate: 93.5, planningsProgress: 95 },
    { courseId: 'c-5a', courseName: '5° A', subject: 'Geometría', studentsCount: 22, averageGrade: 85.8, approvalRate: 90.9, attendanceRate: 94.1, planningsProgress: 100 },
  ],
  students: [
    { studentId: 's1', studentCode: '2024-001', firstName: 'Ana', lastName: 'López', course: '3° A', overallAverage: 85.3, subjects: [{ subjectId: 'subj-m1', subjectName: 'Matemáticas', period: 'P1', grade: 85, maxScore: 100, percentage: 85 }], attendanceRate: 95.2, riskScore: 20, trend: 'IMPROVING' },
    { studentId: 's2', studentCode: '2024-002', firstName: 'Carlos', lastName: 'Mendoza', course: '3° A', overallAverage: 62.1, subjects: [{ subjectId: 'subj-m1', subjectName: 'Matemáticas', period: 'P1', grade: 62, maxScore: 100, percentage: 62 }], attendanceRate: 78.6, riskScore: 82, trend: 'DECLINING' },
    { studentId: 's3', studentCode: '2024-003', firstName: 'María', lastName: 'García', course: '3° A', overallAverage: 91.7, subjects: [{ subjectId: 'subj-m1', subjectName: 'Matemáticas', period: 'P1', grade: 92, maxScore: 100, percentage: 92 }], attendanceRate: 97.6, riskScore: 10, trend: 'IMPROVING' },
    { studentId: 's4', studentCode: '2024-004', firstName: 'José', lastName: 'Rodríguez', course: '3° A', overallAverage: 55.0, subjects: [{ subjectId: 'subj-m1', subjectName: 'Matemáticas', period: 'P1', grade: 55, maxScore: 100, percentage: 55 }], attendanceRate: 68.3, riskScore: 90, trend: 'DECLINING' },
    { studentId: 's5', studentCode: '2024-005', firstName: 'Laura', lastName: 'Martínez', course: '3° B', overallAverage: 78.9, subjects: [{ subjectId: 'subj-m2', subjectName: 'Matemáticas', period: 'P1', grade: 79, maxScore: 100, percentage: 79 }], attendanceRate: 90.0, riskScore: 35, trend: 'STABLE' },
    { studentId: 's6', studentCode: '2024-006', firstName: 'Diego', lastName: 'Ramírez', course: '3° B', overallAverage: 45.2, subjects: [{ subjectId: 'subj-m2', subjectName: 'Matemáticas', period: 'P1', grade: 45, maxScore: 100, percentage: 45 }], attendanceRate: 72.4, riskScore: 95, trend: 'DECLINING' },
    { studentId: 's7', studentCode: '2024-007', firstName: 'Valentina', lastName: 'López', course: '3° B', overallAverage: 88.0, subjects: [{ subjectId: 'subj-m2', subjectName: 'Matemáticas', period: 'P1', grade: 88, maxScore: 100, percentage: 88 }], attendanceRate: 93.8, riskScore: 15, trend: 'IMPROVING' },
    { studentId: 's8', studentCode: '2024-008', firstName: 'Andrés', lastName: 'Pérez', course: '4° A', overallAverage: 82.4, subjects: [{ subjectId: 'subj-a1', subjectName: 'Álgebra', period: 'P1', grade: 82, maxScore: 100, percentage: 82 }], attendanceRate: 91.5, riskScore: 25, trend: 'STABLE' },
    { studentId: 's9', studentCode: '2024-009', firstName: 'Sofía', lastName: 'Torres', course: '4° A', overallAverage: 94.3, subjects: [{ subjectId: 'subj-a1', subjectName: 'Álgebra', period: 'P1', grade: 94, maxScore: 100, percentage: 94 }], attendanceRate: 98.1, riskScore: 5, trend: 'IMPROVING' },
    { studentId: 's10', studentCode: '2024-010', firstName: 'Mateo', lastName: 'Herrera', course: '5° A', overallAverage: 76.8, subjects: [{ subjectId: 'subj-g1', subjectName: 'Geometría', period: 'P1', grade: 77, maxScore: 100, percentage: 77 }], attendanceRate: 89.2, riskScore: 40, trend: 'STABLE' },
    { studentId: 's11', studentCode: '2024-011', firstName: 'Camila', lastName: 'Rojas', course: '5° A', overallAverage: 67.4, subjects: [{ subjectId: 'subj-g1', subjectName: 'Geometría', period: 'P1', grade: 67, maxScore: 100, percentage: 67 }], attendanceRate: 85.0, riskScore: 60, trend: 'DECLINING' },
    { studentId: 's12', studentCode: '2024-012', firstName: 'Daniel', lastName: 'Castro', course: '5° A', overallAverage: 97.1, subjects: [{ subjectId: 'subj-g1', subjectName: 'Geometría', period: 'P1', grade: 97, maxScore: 100, percentage: 97 }], attendanceRate: 99.0, riskScore: 3, trend: 'IMPROVING' },
  ],
  workload: { totalHours: 40, plannedHours: 36, executedHours: 32 },
};

interface ScheduleItem {
  day: string;
  course: string;
  subject: string;
  time: string;
  room: string;
}

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  role: string;
}

interface ResourceItem {
  id: string;
  name: string;
  type: string;
  category: string;
  size: string;
  date: string;
}

const MOCK_SCHEDULE: ScheduleItem[] = [
  { day: 'Lunes', course: '3° A', subject: 'Matemáticas', time: '08:00 - 09:30', room: 'A-101' },
  { day: 'Lunes', course: '3° B', subject: 'Matemáticas', time: '09:45 - 11:15', room: 'A-102' },
  { day: 'Lunes', course: '4° A', subject: 'Álgebra', time: '11:30 - 13:00', room: 'B-201' },
  { day: 'Martes', course: '3° A', subject: 'Matemáticas', time: '08:00 - 09:30', room: 'A-101' },
  { day: 'Martes', course: '5° A', subject: 'Geometría', time: '09:45 - 11:15', room: 'B-301' },
  { day: 'Miércoles', course: '4° B', subject: 'Álgebra', time: '08:00 - 09:30', room: 'B-202' },
  { day: 'Miércoles', course: '3° A', subject: 'Matemáticas', time: '10:00 - 11:30', room: 'A-101' },
  { day: 'Jueves', course: '5° A', subject: 'Geometría', time: '08:00 - 09:30', room: 'B-301' },
  { day: 'Jueves', course: '3° B', subject: 'Matemáticas', time: '09:45 - 11:15', room: 'A-102' },
  { day: 'Viernes', course: '4° A', subject: 'Álgebra', time: '08:00 - 09:30', room: 'B-201' },
  { day: 'Viernes', course: '4° B', subject: 'Álgebra', time: '09:45 - 11:15', room: 'B-202' },
];

const MOCK_MESSAGES: Message[] = [
  { id: '1', from: 'Dirección Académica', to: 'Docentes', subject: 'Reunión pedagógica mensual', preview: 'Se comunica a todos los docentes que la reunión...', date: '2026-07-09', read: false, role: 'Dirección' },
  { id: '2', from: 'Coordinación Matemáticas', to: 'Área de Matemáticas', subject: 'Actualización de sílabos', preview: 'Recordar que la fecha límite para la entrega de...', date: '2026-07-08', read: false, role: 'Coordinación' },
  { id: '3', from: 'Orientación', to: 'Docentes 3° A', subject: 'Caso de estudiante - Carlos Mendoza', preview: 'Se solicita su apoyo para el seguimiento del...', date: '2026-07-07', read: true, role: 'Orientación' },
  { id: '4', from: 'Dirección', to: 'Todos', subject: 'Entrega de informes parciales', preview: 'Los informes de medio término deben ser...', date: '2026-07-06', read: true, role: 'Dirección' },
  { id: '5', from: 'Coordinación Ciencias', to: 'Área de Ciencias', subject: 'Material para laboratorio', preview: 'Se ha adquirido nuevo material para los...', date: '2026-07-05', read: true, role: 'Coordinación' },
];

const MOCK_RESOURCES: ResourceItem[] = [
  { id: '1', name: 'Guía de ejercicios - Álgebra Cap 3', type: 'PDF', category: 'Materiales', size: '2.4 MB', date: '2026-07-10' },
  { id: '2', name: 'Video tutorial - Factorización', type: 'MP4', category: 'Videos', size: '45 MB', date: '2026-07-09' },
  { id: '3', name: 'Laboratorio - Reacciones químicas', type: 'DOCX', category: 'Laboratorios', size: '1.8 MB', date: '2026-07-08' },
  { id: '4', name: 'Slides - Geometría analítica', type: 'PPTX', category: 'Presentaciones', size: '12 MB', date: '2026-07-07' },
  { id: '5', name: 'Examen parcial - Matemáticas 3°', type: 'PDF', category: 'Documentos', size: '0.5 MB', date: '2026-07-06' },
  { id: '6', name: 'Rúbrica de evaluación - Proyecto final', type: 'PDF', category: 'Documentos', size: '0.3 MB', date: '2026-07-05' },
  { id: '7', name: 'Video - Aplicaciones de derivadas', type: 'MP4', category: 'Videos', size: '32 MB', date: '2026-07-04' },
  { id: '8', name: 'Ejercicios resueltos - Integrales', type: 'PDF', category: 'Materiales', size: '3.1 MB', date: '2026-07-03' },
];

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

const MOCK_WEEKLY_SCHEDULE: Record<string, string> = {
  'Lunes-08:00': '3° A - Matemáticas',
  'Lunes-09:00': '3° A - Matemáticas',
  'Lunes-10:00': '3° B - Matemáticas',
  'Lunes-11:00': '3° B - Matemáticas',
  'Lunes-12:00': '4° A - Álgebra',
  'Martes-08:00': '3° A - Matemáticas',
  'Martes-09:00': '3° A - Matemáticas',
  'Martes-10:00': '5° A - Geometría',
  'Martes-11:00': '5° A - Geometría',
  'Miércoles-08:00': '4° B - Álgebra',
  'Miércoles-09:00': '4° B - Álgebra',
  'Miércoles-10:00': '3° A - Matemáticas',
  'Miércoles-11:00': '3° A - Matemáticas',
  'Jueves-08:00': '5° A - Geometría',
  'Jueves-09:00': '5° A - Geometría',
  'Jueves-10:00': '3° B - Matemáticas',
  'Jueves-11:00': '3° B - Matemáticas',
  'Viernes-08:00': '4° A - Álgebra',
  'Viernes-09:00': '4° A - Álgebra',
  'Viernes-10:00': '4° B - Álgebra',
  'Viernes-11:00': '4° B - Álgebra',
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('inicio');
  const { user } = useAuth();
  const teacherId = user?.teacherId;
  const { data: dashboard, isLoading } = useTeacherDashboard(teacherId);

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  const dashboardData = dashboard ?? MOCK_TEACHER_DASHBOARD;

  const renderTab = () => {
    switch (activeTab) {
      case 'inicio': return <InicioTab dashboard={dashboardData} user={user} />;
      case 'calificaciones': return <CalificacionesTab teacherId={teacherId} />;
      case 'planificaciones': return <PlanificacionesTab teacherId={teacherId} />;
      case 'asistencia': return <AsistenciaTab teacherId={teacherId} />;
      case 'evidencias': return <EvidenciasTab />;
      case 'comunicacion': return <ComunicacionTab />;
      case 'recursos': return <RecursosTab />;
      case 'perfil': return <PerfilTab dashboard={dashboardData} user={user} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
}

// ─── Inicio Tab ──────────────────────────────────────────────────────────────

export function InicioTab({ dashboard, user }: { dashboard: NonNullable<ReturnType<typeof useTeacherDashboard>['data']>; user: ReturnType<typeof useAuth>['user'] }) {
  const courseCount = dashboard.courses.length;
  const studentCount = dashboard.students.length;
  const avgGrade = dashboard.courses.length > 0
    ? Math.round(dashboard.courses.reduce((sum, c) => sum + c.averageGrade, 0) / dashboard.courses.length)
    : 0;
  const avgAttendance = dashboard.courses.length > 0
    ? Math.round(dashboard.courses.reduce((sum, c) => sum + c.attendanceRate, 0) / dashboard.courses.length)
    : 0;
  const pendingPlannings = dashboard.courses.filter(c => c.planningsProgress < 100).length;
  const highRiskStudents = dashboard.students.filter(s => s.riskScore >= 70);
  const decliningStudents = dashboard.students.filter(s => s.trend === 'DECLINING');
  const todaySchedule = MOCK_SCHEDULE.filter(s => s.day === getCurrentDayName());

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel del Docente</h1>
          <p className="text-muted-foreground">Bienvenido, {user?.firstName} {user?.lastName}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {formatDate(new Date())}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mis Cursos</p>
              <p className="text-2xl font-bold text-foreground mt-1">{courseCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <BookOpenIcon className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estudiantes</p>
              <p className="text-2xl font-bold text-foreground mt-1">{studentCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-100 text-success-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Promedio General</p>
              <p className="text-2xl font-bold text-foreground mt-1">{avgGrade}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Asistencia Promedio</p>
              <p className="text-2xl font-bold text-foreground mt-1">{avgAttendance}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-danger-100 text-danger-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link to="/grades" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Registrar Calificaciones</span>
              </Link>
              <Link to="/attendance" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="w-10 h-10 rounded-lg bg-success-100 text-success-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Marcar Asistencia</span>
              </Link>
              <Link to="/planning" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="w-10 h-10 rounded-lg bg-warning-100 text-warning-600 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Crear Planificación</span>
              </Link>
              <Link to="/evidence" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="w-10 h-10 rounded-lg bg-danger-100 text-danger-600 flex items-center justify-center">
                  <FileUp className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Subir Evidencias</span>
              </Link>
              <Link to="/counseling" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="w-10 h-10 rounded-lg bg-info-100 text-info-600 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Orientación</span>
              </Link>
              <Link to="/messages" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Mensajes</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Horario - {getCurrentDayName()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay clases programadas hoy</p>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-accent/50">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.course} - {item.subject}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                      <p className="text-xs text-muted-foreground">{item.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPlannings > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-warning-50 border border-warning-200">
                  <div className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-warning-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning-800">Planificaciones pendientes</p>
                    <p className="text-xs text-warning-600">{pendingPlannings} curso(s) con planificación incompleta</p>
                  </div>
                </div>
              )}
              {highRiskStudents.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-danger-50 border border-danger-200">
                  <div className="w-8 h-8 rounded-lg bg-danger-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-danger-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-danger-800">Estudiantes en riesgo</p>
                    <p className="text-xs text-danger-600">{highRiskStudents.length} estudiante(s) con alto riesgo académico</p>
                  </div>
                </div>
              )}
              {decliningStudents.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-danger-50 border border-danger-200">
                  <div className="w-8 h-8 rounded-lg bg-danger-100 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-danger-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-danger-800">Rendimiento en declive</p>
                    <p className="text-xs text-danger-600">{decliningStudents.length} estudiante(s) con tendencia negativa</p>
                  </div>
                </div>
              )}
              {pendingPlannings === 0 && highRiskStudents.length === 0 && decliningStudents.length === 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success-50 border border-success-200">
                  <div className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-success-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-success-800">Todo al día</p>
                    <p className="text-xs text-success-600">No hay alertas pendientes</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Indicadores Personales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Planificaciones</span>
                  <span className="font-medium">{dashboard.courses.filter(c => c.planningsProgress >= 100).length}/{dashboard.courses.length} entregadas</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${dashboard.courses.length > 0 ? (dashboard.courses.filter(c => c.planningsProgress >= 100).length / dashboard.courses.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tiempo promedio de corrección</p>
                    <p className="text-xs text-muted-foreground">Por evaluación</p>
                  </div>
                </div>
                <span className="text-lg font-bold">2.5h</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-info-100 text-info-600 flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Uso de IA</p>
                    <p className="text-xs text-muted-foreground">Planificaciones asistidas</p>
                  </div>
                </div>
                <span className="text-lg font-bold">65%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-danger-100 text-danger-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estudiantes en riesgo</p>
                    <p className="text-xs text-muted-foreground">Requieren intervención</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-danger-600">{highRiskStudents.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Cursos</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpenIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No tienes cursos asignados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Curso</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Asignatura</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Estudiantes</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Nota Prom.</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Aprobación</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Asistencia</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Planificación</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.courses.map((course) => (
                    <tr key={`${course.courseId}-${course.subject}`} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-2 font-medium">{course.courseName}</td>
                      <td className="py-3 px-2 text-muted-foreground">{course.subject}</td>
                      <td className="py-3 px-2 text-center">{course.studentsCount}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={getGradeColor(course.averageGrade)}>{course.averageGrade.toFixed(1)}%</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={getGradeColor(course.approvalRate)}>{course.approvalRate.toFixed(1)}%</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={getGradeColor(course.attendanceRate)}>{course.attendanceRate.toFixed(1)}%</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${course.planningsProgress}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{course.planningsProgress.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students */}
      <Card>
        <CardHeader>
          <CardTitle>Estudiantes</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay estudiantes asignados</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dashboard.students.slice(0, 9).map((student) => (
                <StudentCard key={student.studentId} student={student} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentCard({ student }: { student: StudentProgress }) {
  const { Icon: TrendIcon, color: TrendColor } = getTrendIcon(student.trend);

  return (
    <div className="p-4 rounded-lg border border-border hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-sm">{student.firstName} {student.lastName}</p>
          <p className="text-xs text-muted-foreground">{student.course} · {student.studentCode}</p>
        </div>
        <TrendIcon className={`w-4 h-4 ${TrendColor}`} />
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Promedio: </span>
          <span className={getGradeColor(student.overallAverage)}>{student.overallAverage.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Asistencia: </span>
          <span className={getGradeColor(student.attendanceRate)}>{student.attendanceRate.toFixed(1)}%</span>
        </div>
        {student.riskScore >= 70 && (
          <div className="flex items-center gap-1 text-danger-500 font-medium">
            <AlertTriangle className="w-3 h-3" />
            Riesgo
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calificaciones Tab ──────────────────────────────────────────────────────

export function CalificacionesTab({ teacherId }: { teacherId: string | undefined }) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: assignments, isLoading: asgLoading, error: asgError } = useTeacherAssignments(teacherId);
  const { data: gradesData, isLoading: gradesLoading, error: gradesError } = useGrades(
    teacherId && selectedCourseId ? { teacherId, courseId: selectedCourseId } : { teacherId }
  );

  if (asgLoading || gradesLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  if (asgError || gradesError) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5" /> Error al cargar calificaciones
    </div>;
  }

  const allGrades: Grade[] = gradesData?.data ?? [];

  const avgGrade = allGrades.length > 0
    ? allGrades.reduce((s, g) => s + g.value, 0) / allGrades.length
    : 0;
  const passing = allGrades.filter(g => g.value >= 70).length;
  const passingRate = allGrades.length > 0 ? (passing / allGrades.length) * 100 : 0;
  const pendingCount = allGrades.filter(g => g.value < 70).length;

  const uniqueCourses: Array<Pick<TeacherAssignment, 'courseId' | 'courseName' | 'gradeName'>> = [...new Map((assignments ?? []).map(a => [a.courseId, { courseId: a.courseId, courseName: a.courseName, gradeName: a.gradeName }])).values()];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Promedio General</p>
            <p className="text-2xl font-bold text-foreground mt-1">{avgGrade.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Aprobación</p>
            <p className="text-2xl font-bold text-success-600 mt-1">{passingRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground mt-1">{passing} de {allGrades.length} estudiantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Pendientes de recuperación</p>
            <p className="text-2xl font-bold text-danger-600 mt-1">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Selection */}
      {uniqueCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {uniqueCourses.map(course => (
                <Button
                  key={course.courseId}
                  variant={selectedCourseId === course.courseId ? 'default' : 'outline'}
                  onClick={() => setSelectedCourseId(course.courseId)}
                  size="sm"
                >
                  {course.courseName}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      {selectedCourseId ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{uniqueCourses.find(c => c.courseId === selectedCourseId)?.courseName ?? selectedCourseId}</CardTitle>
            <Link to="/grades">
              <Button variant="outline" size="sm">
                Ir a Calificaciones
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {allGrades.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No hay calificaciones registradas para este curso</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Estudiante</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Nota</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Asignatura</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allGrades.map(grade => (
                      <tr key={grade.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="py-3 px-2 font-medium">{grade.studentName ?? grade.studentId}</td>
                        <td className={`py-3 px-2 text-center ${getGradeColor(grade.value)}`}>{grade.value.toFixed(1)}</td>
                        <td className="py-3 px-2 text-center text-muted-foreground">{grade.subjectName ?? '—'}</td>
                        <td className="py-3 px-2 text-center text-muted-foreground">{grade.weight ? `${(grade.weight * 100).toFixed(0)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">Selecciona un curso para ver sus calificaciones</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Planificaciones Tab ─────────────────────────────────────────────────────

export function PlanificacionesTab({ teacherId }: { teacherId: string | undefined }) {
  const { data: stats, isLoading: statsLoading, error: statsError } = usePlanningStats(teacherId ?? '');
  const { data: planningsData, isLoading: planningsLoading, error: planningsError } = usePlannings({ teacherId });

  const isLoading = statsLoading || planningsLoading;
  const error = statsError || planningsError;

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5" /> Error al cargar planificaciones
    </div>;
  }

  const plannings: Planning[] = planningsData?.data ?? [];
  const total = stats?.totalPlannings ?? plannings.length;
  const approved = plannings.filter(p => p.status === 'APPROVED').length;
  const pending = plannings.filter(p => p.status === 'SUBMITTED' || p.status === 'DRAFT').length;
  const rejected = plannings.filter(p => p.status === 'REJECTED').length;
  const executedCount = plannings.filter(p => p.sessions?.some(s => s.status === 'EXECUTED')).length;
  const avgProgress = total > 0 ? Math.round((executedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Total Planificaciones</p>
            <p className="text-2xl font-bold text-foreground mt-1">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Aprobadas</p>
            <p className="text-2xl font-bold text-success-600 mt-1">{approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-warning-600 mt-1">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Rechazadas</p>
            <p className="text-2xl font-bold text-danger-600 mt-1">{rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                  strokeDasharray={`${avgProgress} ${100 - avgProgress}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{stats?.executionRate ?? avgProgress}%</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500" />
                <span>Aprobadas: {approved}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning-500" />
                <span>Pendientes: {pending}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger-500" />
                <span>Rechazadas: {rejected}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Planning List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Planificaciones por Curso</CardTitle>
          <Link to="/planning">
            <Button variant="outline" size="sm">
              Ir a Planificaciones
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {plannings.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay planificaciones registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plannings.map(planning => {
                const { variant, label } = getStatusBadge(planning.status);
                const courseName = planning.courseSubject
                  ? `${planning.courseSubject.course.gradeLevel.name} ${planning.courseSubject.course.name}`
                  : '—';
                const subjectName = planning.courseSubject?.subject.name ?? '—';
                const sessionProgress = planning.totalSessions
                  ? Math.round(((planning.sessions?.filter(s => s.status === 'EXECUTED').length ?? 0) / planning.totalSessions) * 100)
                  : 0;
                return (
                  <div key={planning.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{courseName} - {subjectName}</p>
                      <p className="text-xs text-muted-foreground">{planning.title}</p>
                    </div>
                    <Badge variant={variant}>{label}</Badge>
                    <div className="w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${sessionProgress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{sessionProgress}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Asistencia Tab ──────────────────────────────────────────────────────────

export function AsistenciaTab({ teacherId: _teacherId }: { teacherId: string | undefined }) {
  const today = new Date().toISOString().split('T')[0];
  const { data: attendanceData, isLoading, error } = useAttendanceRecords({ date: today });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (attendanceData?.data) {
      setAttendance(attendanceData.data);
    }
  }, [attendanceData]);

  const toggleStatus = (id: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendance(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5" /> Error al cargar asistencia
    </div>;
  }

  const presentCount = attendance.filter(s => s.status === 'PRESENT').length;
  const absentCount = attendance.filter(s => s.status === 'ABSENT').length;
  const lateCount = attendance.filter(s => s.status === 'LATE').length;
  const weekRate = 85;
  const monthRate = 88;
  const lowAttendanceStudents = [
    { name: 'José Rodríguez', rate: 62 },
    { name: 'Diego Ramírez', rate: 55 },
    { name: 'Valentina López', rate: 68 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Hoy</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1 text-success-600"><UserCheck className="w-4 h-4" /> {presentCount}</span>
              <span className="flex items-center gap-1 text-danger-600"><UserX className="w-4 h-4" /> {absentCount}</span>
              <span className="flex items-center gap-1 text-warning-600"><UserMinus className="w-4 h-4" /> {lateCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Semana Actual</p>
            <p className="text-2xl font-bold text-foreground mt-1">{weekRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Mes Actual</p>
            <p className="text-2xl font-bold text-foreground mt-1">{monthRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Attendance Mark */}
      {attendance.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No hay registros de asistencia para hoy</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Asistencia del Día</CardTitle>
            <Link to="/attendance">
              <Button variant="outline" size="sm">
                Ir a Asistencia
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Estudiante</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((student, i) => (
                    <tr key={student.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-2.5 px-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2.5 px-2 font-medium">{student.studentName ?? student.studentId}</td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => toggleStatus(student.id, 'PRESENT')}
                            className={`p-1.5 rounded-md transition-colors ${student.status === 'PRESENT' ? 'bg-success-100 text-success-700 ring-1 ring-success-300' : 'text-muted-foreground hover:bg-accent'}`}
                            title="Presente"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(student.id, 'ABSENT')}
                            className={`p-1.5 rounded-md transition-colors ${student.status === 'ABSENT' ? 'bg-danger-100 text-danger-700 ring-1 ring-danger-300' : 'text-muted-foreground hover:bg-accent'}`}
                            title="Ausente"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(student.id, 'LATE')}
                            className={`p-1.5 rounded-md transition-colors ${student.status === 'LATE' ? 'bg-warning-100 text-warning-700 ring-1 ring-warning-300' : 'text-muted-foreground hover:bg-accent'}`}
                            title="Tardanza"
                          >
                            <Clock4 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Estudiantes con Baja Asistencia (&lt;80%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowAttendanceStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay estudiantes con baja asistencia</p>
            ) : (
              lowAttendanceStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-danger-50 border border-danger-200">
                  <span className="text-sm font-medium text-danger-800">{s.name}</span>
                  <span className="text-sm font-bold text-danger-600">{s.rate}%</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Evidencias Tab ──────────────────────────────────────────────────────────

export function EvidenciasTab() {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; date: string }[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const sizeKB = file.size / 1024;
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB.toFixed(0)} KB`;
      if (sizeKB / 1024 <= 10) {
        setUploadedFiles(prev => [...prev, { name: file.name, size: sizeStr, date: new Date().toISOString().split('T')[0] }]);
      }
    });
  };

  const recentUploads = [
    { name: 'Informe-progreso-3A.pdf', size: '2.3 MB', date: '2026-07-10' },
    { name: 'Actividad-grupal-fotos.zip', size: '8.1 MB', date: '2026-07-09' },
    { name: 'Examen-parcial-corregido.pdf', size: '1.5 MB', date: '2026-07-08' },
    ...uploadedFiles.slice(0, 5),
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Zone */}
        <Card>
          <CardHeader>
            <CardTitle>Subir Evidencias</CardTitle>
            <CardDescription>PDF, imágenes. Máximo 10 MB por archivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-primary bg-primary-50' : 'border-muted-foreground/30 hover:border-primary/50'
              }`}
            >
              <Upload className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Arrastra tus archivos aquí</p>
              <p className="text-xs text-muted-foreground mb-4">o</p>
              <Button variant="outline" size="sm">
                Seleccionar Archivos
              </Button>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-success-50 border border-success-200">
                <p className="text-sm text-success-700 font-medium">{uploadedFiles.length} archivo(s) subido(s)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subidas Recientes</CardTitle>
            <Button variant="outline" size="sm">
              Subir Evidencias
              <Upload className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentUploads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No hay evidencias subidas aún</p>
              ) : (
                recentUploads.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size} · {file.date}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Link to full management */}
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">Gestiona todas tus evidencias académicas</p>
          <Link to="/evidence">
            <Button variant="outline">
              Ir a Gestión de Evidencias
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Comunicación Tab ────────────────────────────────────────────────────────

export function ComunicacionTab() {
  const [messageText, setMessageText] = useState('');
  const [selectedContact, setSelectedContact] = useState('Todos');
  const contacts = [
    { name: 'Dirección', icon: User },
    { name: 'Coordinación Matemáticas', icon: Users },
    { name: 'Coordinación Ciencias', icon: Users },
    { name: 'Orientación', icon: Heart },
  ];

  const handleSend = () => {
    if (!messageText.trim()) return;
    setMessageText('');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Contacts */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Contactos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedContact('Todos')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedContact === 'Todos' ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-accent'}`}
            >
              Todos los mensajes
            </button>
            {contacts.map(contact => {
              const Icon = contact.icon;
              return (
                <button
                  key={contact.name}
                  onClick={() => setSelectedContact(contact.name)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${selectedContact === contact.name ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-accent'}`}
                >
                  <Icon className="w-4 h-4" />
                  {contact.name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Mensajes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Compose Area */}
            <div className="flex gap-2">
              <Input
                placeholder="Escribe un mensaje..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button onClick={handleSend} disabled={!messageText.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {MOCK_MESSAGES.filter(m => selectedContact === 'Todos' || m.role === selectedContact).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No hay mensajes</p>
              ) : (
                MOCK_MESSAGES
                  .filter(m => selectedContact === 'Todos' || m.role === selectedContact)
                  .map(msg => (
                    <div key={msg.id} className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent/50 ${!msg.read ? 'border-primary-200 bg-primary-50/50' : 'border-border'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary bg-primary-100 px-2 py-0.5 rounded-full">{msg.role}</span>
                          <span className="text-sm font-medium">{msg.from}</span>
                          {!msg.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <span className="text-xs text-muted-foreground">{msg.date}</span>
                      </div>
                      <p className="text-sm font-medium">{msg.subject}</p>
                      <p className="text-sm text-muted-foreground truncate">{msg.preview}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Recursos Tab ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'Materiales', icon: BookOpenIcon, color: 'bg-primary-100 text-primary-600' },
  { key: 'Videos', icon: Video, color: 'bg-danger-100 text-danger-600' },
  { key: 'Laboratorios', icon: FlaskConical, color: 'bg-success-100 text-success-600' },
  { key: 'Presentaciones', icon: Presentation, color: 'bg-warning-100 text-warning-600' },
  { key: 'Documentos', icon: File, color: 'bg-info-100 text-info-600' },
];

export function RecursosTab() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredResources = selectedCategory
    ? MOCK_RESOURCES.filter(r => r.category === selectedCategory)
    : MOCK_RESOURCES;

  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: MOCK_RESOURCES.filter(r => r.category === cat.key).length,
  }));

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="grid gap-4 md:grid-cols-5">
        {categoryCounts.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
              className={`text-left p-4 rounded-xl border transition-all ${selectedCategory === cat.key ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:shadow-sm'}`}
            >
              <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium">{cat.key}</p>
              <p className="text-xs text-muted-foreground">{cat.count} recurso(s)</p>
            </button>
          );
        })}
      </div>

      {/* Resources List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{selectedCategory || 'Todos los Recursos'}</CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Subir Recurso
          </Button>
        </CardHeader>
        <CardContent>
          {filteredResources.length === 0 ? (
            <div className="text-center py-8">
              <BookOpenIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay recursos en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResources.map(resource => {
                const catConfig = CATEGORIES.find(c => c.key === resource.category);
                const Icon = catConfig?.icon || File;
                const iconColor = catConfig?.color || 'bg-secondary-100 text-secondary-600';
                return (
                  <div key={resource.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className={`w-9 h-9 rounded-lg ${iconColor} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resource.name}</p>
                      <p className="text-xs text-muted-foreground">{resource.category} · {resource.size} · {resource.date}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                    <Button variant="ghost" size="icon-sm">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Perfil Tab ──────────────────────────────────────────────────────────────

export function PerfilTab({ dashboard, user }: { dashboard: NonNullable<ReturnType<typeof useTeacherDashboard>['data']>; user: ReturnType<typeof useAuth>['user'] }) {
  const avgGrade = dashboard.courses.length > 0
    ? Math.round(dashboard.courses.reduce((sum, c) => sum + c.averageGrade, 0) / dashboard.courses.length)
    : 0;
  const avgAttendance = dashboard.courses.length > 0
    ? Math.round(dashboard.courses.reduce((sum, c) => sum + c.attendanceRate, 0) / dashboard.courses.length)
    : 0;
  const completedPlannings = dashboard.courses.filter(c => c.planningsProgress >= 100).length;
  const totalPlannings = dashboard.courses.length;
  const highRiskStudents = dashboard.students.filter(s => s.riskScore >= 70).length;

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Nombre</p>
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">DNI</p>
              <p className="text-sm font-medium">{user?.dni}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Código</p>
              <p className="text-sm font-medium">{dashboard.teacherId?.slice(0, 8).toUpperCase() || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carga Académica */}
      <Card>
        <CardHeader>
          <CardTitle>Carga Académica</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.courses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin cursos asignados</p>
          ) : (
            <div className="space-y-2">
              {dashboard.courses.map((course, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div>
                    <p className="text-sm font-medium">{course.courseName}</p>
                    <p className="text-xs text-muted-foreground">{course.subject}</p>
                  </div>
                  <Badge variant="outline">{course.studentsCount} estudiantes</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Horario Semanal</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-border bg-accent/50 text-left font-medium text-muted-foreground" style={{ minWidth: 70 }}>Hora</th>
                {WEEK_DAYS.map(day => (
                  <th key={day} className="p-2 border border-border bg-accent/50 text-center font-medium text-muted-foreground" style={{ minWidth: 120 }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td className="p-2 border border-border text-xs text-muted-foreground font-medium">{hour}</td>
                  {WEEK_DAYS.map(day => {
                    const cellKey = `${day}-${hour}`;
                    const courseInfo = MOCK_WEEKLY_SCHEDULE[cellKey];
                    return (
                      <td key={cellKey} className={`p-2 border border-border text-xs text-center ${courseInfo ? 'bg-primary-5 text-primary-800 font-medium' : ''}`}>
                        {courseInfo || ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Teacher Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas Docentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Promedio General</p>
              </div>
              <p className="text-xl font-bold">{avgGrade}%</p>
              <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${avgGrade}%` }} />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-success-600" />
                <p className="text-xs text-muted-foreground">Asistencia Registrada</p>
              </div>
              <p className="text-xl font-bold">{avgAttendance}%</p>
              <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success-500 rounded-full" style={{ width: `${avgAttendance}%` }} />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-warning-600" />
                <p className="text-xs text-muted-foreground">Planificaciones Entregadas</p>
              </div>
              <p className="text-xl font-bold">{completedPlannings}/{totalPlannings}</p>
              <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-warning-500 rounded-full" style={{ width: totalPlannings > 0 ? (completedPlannings / totalPlannings) * 100 : 0 }} />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <FileUp className="w-4 h-4 text-info-600" />
                <p className="text-xs text-muted-foreground">Evidencias Subidas</p>
              </div>
              <p className="text-xl font-bold">12</p>
              <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-info-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-danger-600" />
                <p className="text-xs text-muted-foreground">Estudiantes en Riesgo</p>
              </div>
              <p className="text-xl font-bold text-danger-600">{highRiskStudents}</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Tiempo Prom. Corrección</p>
              </div>
              <p className="text-xl font-bold">2.5h</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Uso de IA</p>
              </div>
              <p className="text-xl font-bold">65%</p>
              <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-success-600" />
                <p className="text-xs text-muted-foreground">Cumplimiento Planif.</p>
              </div>
              <p className="text-xl font-bold">{totalPlannings > 0 ? Math.round((completedPlannings / totalPlannings) * 100) : 0}%</p>
              <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success-500 rounded-full" style={{ width: totalPlannings > 0 ? (completedPlannings / totalPlannings) * 100 : 0 }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
