import { useState } from 'react';
import {
  Home,
  Eye,
  ClipboardList,
  BarChart3,
  Users,
  BookOpen,
  Calendar,
  Award,
  AlertTriangle,
  Bell,
  ChevronRight,
  Plus,
  Search,
  FileText,
  MessageSquare,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  X,
  UserCheck,
  UserX,
  BookCheck,
  Upload,
  Activity,
  Scale,
  School,
  BookMarked,
  Brain,
  ChevronLeft,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Teacher {
  id: string;
  nombre: string;
  email: string;
  cursos: string[];
  asignaturas: string[];
  planificacionStatus: 'completa' | 'incompleta';
  calificacionesStatus: 'al día' | 'pendiente';
  asistencia: number;
  evidencias: number;
  ultimaActividad: string;
}

interface Observation {
  id: string;
  docente: string;
  fecha: string;
  curso: string;
  asignatura: string;
  tipo: 'Visita' | 'Observación' | 'Seguimiento';
  observaciones: string;
  retroalimentacion: string;
  compromisos: string;
  estado: 'Pendiente' | 'Completado' | 'En seguimiento';
}

interface Alert {
  id: string;
  tipo: 'warning' | 'danger' | 'success' | 'info';
  titulo: string;
  descripcion: string;
  fecha: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_TEACHERS: Teacher[] = [
  { id: '1', nombre: 'María García', email: 'maria.garcia@edu.do', cursos: ['3ro A', '3ro B'], asignaturas: ['Matemáticas'], planificacionStatus: 'completa', calificacionesStatus: 'al día', asistencia: 95, evidencias: 12, ultimaActividad: '2026-07-10' },
  { id: '2', nombre: 'Carlos Pérez', email: 'carlos.perez@edu.do', cursos: ['4to A'], asignaturas: ['Lengua Española', 'Ciencias Sociales'], planificacionStatus: 'incompleta', calificacionesStatus: 'pendiente', asistencia: 82, evidencias: 5, ultimaActividad: '2026-07-08' },
  { id: '3', nombre: 'Ana Martínez', email: 'ana.martinez@edu.do', cursos: ['5to B', '5to C'], asignaturas: ['Ciencias Naturales'], planificacionStatus: 'completa', calificacionesStatus: 'al día', asistencia: 98, evidencias: 20, ultimaActividad: '2026-07-10' },
  { id: '4', nombre: 'Roberto Díaz', email: 'roberto.diaz@edu.do', cursos: ['6to A', '6to B'], asignaturas: ['Inglés'], planificacionStatus: 'completa', calificacionesStatus: 'al día', asistencia: 91, evidencias: 8, ultimaActividad: '2026-07-09' },
  { id: '5', nombre: 'Luisa Fernández', email: 'luisa.fernandez@edu.do', cursos: ['3ro A', '4to A'], asignaturas: ['Educación Física'], planificacionStatus: 'incompleta', calificacionesStatus: 'pendiente', asistencia: 78, evidencias: 3, ultimaActividad: '2026-07-05' },
  { id: '6', nombre: 'Pedro Ramírez', email: 'pedro.ramirez@edu.do', cursos: ['5to A'], asignaturas: ['Música'], planificacionStatus: 'incompleta', calificacionesStatus: 'pendiente', asistencia: 65, evidencias: 1, ultimaActividad: '2026-07-01' },
  { id: '7', nombre: 'Sofía Torres', email: 'sofia.torres@edu.do', cursos: ['1ro A', '1ro B', '2do A'], asignaturas: ['Lengua Española'], planificacionStatus: 'completa', calificacionesStatus: 'al día', asistencia: 93, evidencias: 15, ultimaActividad: '2026-07-10' },
  { id: '8', nombre: 'Jorge Medina', email: 'jorge.medina@edu.do', cursos: ['6to A'], asignaturas: ['Matemáticas', 'Ciencias Naturales'], planificacionStatus: 'completa', calificacionesStatus: 'al día', asistencia: 88, evidencias: 10, ultimaActividad: '2026-07-09' },
];

const MOCK_OBSERVATIONS: Observation[] = [
  { id: '1', docente: 'María García', fecha: '2026-07-08', curso: '3ro A', asignatura: 'Matemáticas', tipo: 'Visita', observaciones: 'Clase bien estructurada con uso de material didáctico. Participación activa de los estudiantes.', retroalimentacion: 'Fortalecer ejercicios de razonamiento lógico.', compromisos: 'Incluir 2 ejercicios de razonamiento por clase.', estado: 'Completado' },
  { id: '2', docente: 'Carlos Pérez', fecha: '2026-07-07', curso: '4to A', asignatura: 'Lengua Española', tipo: 'Observación', observaciones: 'Los estudiantes muestran dificultades en comprensión lectora. Se recomienda estrategias de lectura guiada.', retroalimentacion: 'Implementar círculos de lectura semanales.', compromisos: 'Realizar 1 círculo de lectura por semana.', estado: 'En seguimiento' },
  { id: '3', docente: 'Ana Martínez', fecha: '2026-07-03', curso: '5to B', asignatura: 'Ciencias Naturales', tipo: 'Seguimiento', observaciones: 'Mejora significativa en la participación. Laboratorio bien organizado.', retroalimentacion: 'Continuar con las prácticas de laboratorio.', compromisos: 'Mantener 1 práctica de laboratorio quincenal.', estado: 'Pendiente' },
  { id: '4', docente: 'Roberto Díaz', fecha: '2026-06-28', curso: '6to A', asignatura: 'Inglés', tipo: 'Visita', observaciones: 'Uso adecuado de recursos audiovisuales. Estudiantes motivados.', retroalimentacion: 'Incorporar más ejercicios de speaking.', compromisos: 'Dedicar 10 minutos por clase a conversación.', estado: 'Completado' },
];

const MOCK_ALERTS: Alert[] = [
  { id: '1', tipo: 'warning', titulo: 'Planificaciones pendientes', descripcion: '3 docentes tienen planificaciones incompletas.', fecha: '2026-07-10' },
  { id: '2', tipo: 'danger', titulo: 'Calificaciones sin registrar', descripcion: '2 docentes no han registrado calificaciones del período.', fecha: '2026-07-10' },
  { id: '3', tipo: 'danger', titulo: 'Asistencia crítica', descripcion: 'Pedro Ramírez tiene solo 65% de asistencia registrada.', fecha: '2026-07-09' },
  { id: '4', tipo: 'info', titulo: 'Nuevo docente asignado', descripcion: 'Rosa Mendoza ha sido asignada al curso 2do B.', fecha: '2026-07-08' },
  { id: '5', tipo: 'success', titulo: 'Observaciones completadas', descripcion: '2 observaciones de aula fueron completadas esta semana.', fecha: '2026-07-07' },
];

const MOCK_CURSOS = ['3ro A', '3ro B', '4to A', '5to A', '5to B', '5to C', '6to A', '6to B', '1ro A', '1ro B', '2do A'];
const MOCK_ASIGNATURAS = ['Matemáticas', 'Lengua Española', 'Ciencias Sociales', 'Ciencias Naturales', 'Inglés', 'Educación Física', 'Música'];

const MOCK_COMPARISON = {
  docentes: [
    { nombre: 'María García', promedioCalificaciones: 87, asistencia: 95, planificaciones: 100, evidencias: 12 },
    { nombre: 'Carlos Pérez', promedioCalificaciones: 72, asistencia: 82, planificaciones: 60, evidencias: 5 },
    { nombre: 'Ana Martínez', promedioCalificaciones: 91, asistencia: 98, planificaciones: 100, evidencias: 20 },
    { nombre: 'Roberto Díaz', promedioCalificaciones: 84, asistencia: 91, planificaciones: 100, evidencias: 8 },
    { nombre: 'Luisa Fernández', promedioCalificaciones: 96, asistencia: 78, planificaciones: 45, evidencias: 3 },
    { nombre: 'Pedro Ramírez', promedioCalificaciones: 68, asistencia: 65, planificaciones: 30, evidencias: 1 },
    { nombre: 'Sofía Torres', promedioCalificaciones: 89, asistencia: 93, planificaciones: 100, evidencias: 15 },
    { nombre: 'Jorge Medina', promedioCalificaciones: 81, asistencia: 88, planificaciones: 100, evidencias: 10 },
  ],
  cursos: [
    { nombre: '3ro A', promedioCalificaciones: 84, asistencia: 90, planificaciones: 85, evidencias: 15 },
    { nombre: '3ro B', promedioCalificaciones: 79, asistencia: 86, planificaciones: 70, evidencias: 10 },
    { nombre: '4to A', promedioCalificaciones: 72, asistencia: 82, planificaciones: 60, evidencias: 5 },
    { nombre: '5to B', promedioCalificaciones: 91, asistencia: 98, planificaciones: 100, evidencias: 20 },
    { nombre: '6to A', promedioCalificaciones: 82, asistencia: 90, planificaciones: 100, evidencias: 18 },
  ],
  asignaturas: [
    { nombre: 'Matemáticas', promedioCalificaciones: 78, asistencia: 88, planificaciones: 85, evidencias: 22 },
    { nombre: 'Lengua Española', promedioCalificaciones: 83, asistencia: 90, planificaciones: 80, evidencias: 18 },
    { nombre: 'Ciencias Sociales', promedioCalificaciones: 76, asistencia: 82, planificaciones: 60, evidencias: 5 },
    { nombre: 'Ciencias Naturales', promedioCalificaciones: 91, asistencia: 98, planificaciones: 100, evidencias: 20 },
    { nombre: 'Inglés', promedioCalificaciones: 84, asistencia: 91, planificaciones: 100, evidencias: 8 },
  ],
};

const MOCK_IA_DETECTION = {
  inflacionNotas: [
    { docente: 'Luisa Fernández', promedio: 96, estudiantes: 30 },
    { docente: 'Roberto Díaz', promedio: 94, estudiantes: 28 },
    { docente: 'Ana Martínez', promedio: 91, estudiantes: 25 },
  ],
  nuncaReprueban: [
    { docente: 'Luisa Fernández', aprobacion: 100, estudiantes: 30 },
    { docente: 'Ana Martínez', aprobacion: 100, estudiantes: 25 },
  ],
  nuncaSubenEvidencias: [
    { docente: 'Pedro Ramírez', diasSinSubir: 45 },
    { docente: 'Luisa Fernández', diasSinSubir: 30 },
    { docente: 'Carlos Pérez', diasSinSubir: 20 },
  ],
  pocasPlanificaciones: [
    { docente: 'Pedro Ramírez', planificaciones: 1, cursos: 4 },
    { docente: 'Luisa Fernández', planificaciones: 2, cursos: 3 },
    { docente: 'Carlos Pérez', planificaciones: 3, cursos: 5 },
  ],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
    completa: { variant: 'success', label: 'Completa' },
    incompleta: { variant: 'warning', label: 'Incompleta' },
    'al día': { variant: 'success', label: 'Al día' },
    pendiente: { variant: 'danger', label: 'Pendiente' },
    Completado: { variant: 'success', label: 'Completado' },
    'En seguimiento': { variant: 'info', label: 'En seguimiento' },
  };
  const m = map[status] ?? { variant: 'secondary' as const, label: status };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

const alertIcon = (tipo: Alert['tipo']) => {
  const icons: Record<string, React.ReactNode> = {
    warning: <AlertTriangle className="w-4 h-4 text-warning-600" />,
    danger: <AlertCircle className="w-4 h-4 text-danger-600" />,
    success: <CheckCircle2 className="w-4 h-4 text-success-600" />,
    info: <Bell className="w-4 h-4 text-primary-600" />,
  };
  return icons[tipo];
};

const alertBg = (tipo: Alert['tipo']) => {
  const bg: Record<string, string> = {
    warning: 'bg-warning-50 border-warning-200',
    danger: 'bg-danger-50 border-danger-200',
    success: 'bg-success-50 border-success-200',
    info: 'bg-primary-50 border-primary-200',
  };
  return bg[tipo];
};

const comparisonBar = (value: number, max = 100) => {
  const color = value >= 90 ? 'bg-success-500' : value >= 70 ? 'bg-warning-500' : 'bg-danger-500';
  return (
    <div className="w-full h-2 bg-secondary-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Tab: Inicio                                                        */
/* ------------------------------------------------------------------ */

export function InicioTab() {
  const { user } = useAuth();

  const kpis = [
    { label: 'Docentes activos', value: '8', icon: Users, color: 'bg-primary-100 text-primary-600' },
    { label: 'Planificaciones pendientes', value: '3', icon: ClipboardList, color: 'bg-warning-100 text-warning-600' },
    { label: 'Docentes sin registrar asistencia', value: '2', icon: UserX, color: 'bg-danger-100 text-danger-600' },
    { label: 'Calificaciones pendientes', value: '2', icon: Award, color: 'bg-orange-100 text-orange-600' },
    { label: 'Alertas activas', value: '5', icon: Bell, color: 'bg-purple-100 text-purple-600' },
    { label: 'Incidencias pendientes', value: '1', icon: AlertTriangle, color: 'bg-danger-100 text-danger-600' },
  ];

  const quickLinks = [
    { label: 'Supervisar Docentes', icon: Eye, href: '#supervision', tab: 'supervision' },
    { label: 'Ver Planificaciones', icon: FileText, href: '#', tab: 'inicio' },
    { label: 'Observaciones', icon: MessageSquare, href: '#observacion', tab: 'observacion' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de Coordinación</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido, {user?.firstName ?? 'Coordinador'}. Aquí puedes supervisar el progreso académico.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
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
            <CardDescription>Enlaces directos a las funciones más usadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-center group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-sm">{link.label}</span>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas Recientes</CardTitle>
            <CardDescription>Últimas notificaciones del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_ALERTS.slice(0, 4).map((alert) => (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${alertBg(alert.tipo)}`}>
                <div className="mt-0.5">{alertIcon(alert.tipo)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{alert.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.descripcion}</p>
                </div>
              </div>
            ))}
            {MOCK_ALERTS.length > 4 && (
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                Ver todas las alertas
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Supervisión                                                   */
/* ------------------------------------------------------------------ */

export function SupervisionTab() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const filtered = MOCK_TEACHERS.filter((t) => {
    const matchSearch =
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.cursos.some((c) => c.toLowerCase().includes(search.toLowerCase())) ||
      t.asignaturas.some((a) => a.toLowerCase().includes(search.toLowerCase()));
    if (!matchSearch) return false;
    if (filterStatus === 'planificacion-pendiente') return t.planificacionStatus === 'incompleta';
    if (filterStatus === 'calificaciones-pendiente') return t.calificacionesStatus === 'pendiente';
    if (filterStatus === 'asistencia-baja') return t.asistencia < 80;
    return true;
  });

  const selected = selectedId ? MOCK_TEACHERS.find((t) => t.id === selectedId) ?? null : null;

  const resetSelection = () => setSelectedId(null);

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={resetSelection}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">{selected.nombre}</h2>
            <p className="text-sm text-muted-foreground">{selected.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Cursos</p>
              <p className="text-xl font-bold text-foreground mt-1">{selected.cursos.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{selected.cursos.join(', ')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Asignaturas</p>
              <p className="text-xl font-bold text-foreground mt-1">{selected.asignaturas.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{selected.asignaturas.join(', ')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Asistencia</p>
              <p className={`text-xl font-bold mt-1 ${selected.asistencia >= 90 ? 'text-success-600' : selected.asistencia >= 80 ? 'text-warning-600' : 'text-danger-600'}`}>
                {selected.asistencia}%
              </p>
              <div className="w-full h-1.5 bg-secondary-100 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${selected.asistencia >= 90 ? 'bg-success-500' : selected.asistencia >= 80 ? 'bg-warning-500' : 'bg-danger-500'}`}
                  style={{ width: `${selected.asistencia}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Evidencias</p>
              <p className="text-xl font-bold text-foreground mt-1">{selected.evidencias}</p>
              <p className="text-xs text-muted-foreground mt-1">subidas este período</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Planificación</p>
              <div className="mt-1">{statusBadge(selected.planificacionStatus)}</div>
              <p className="text-xs text-muted-foreground mt-2">Calificaciones: {statusBadge(selected.calificacionesStatus)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Observaciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_OBSERVATIONS.filter((o) => o.docente === selected.nombre).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay observaciones registradas.</p>
              ) : (
                MOCK_OBSERVATIONS.filter((o) => o.docente === selected.nombre).map((obs) => (
                  <div key={obs.id} className="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{obs.tipo}</Badge>
                        <span className="text-sm text-muted-foreground">{obs.fecha}</span>
                      </div>
                      {statusBadge(obs.estado)}
                    </div>
                    <p className="text-sm text-foreground">{obs.curso} · {obs.asignatura}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{obs.observaciones}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Última Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50 border border-border">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Última conexión</p>
                <p className="text-xs text-muted-foreground">{selected.ultimaActividad}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Supervisión de Docentes</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} docente(s) encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar docente, curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="planificacion-pendiente">Planif. pendiente</SelectItem>
              <SelectItem value="calificaciones-pendiente">Calif. pendiente</SelectItem>
              <SelectItem value="asistencia-baja">Asistencia {'<'} 80%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((teacher) => {
          return (
            <Card
              key={teacher.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary-300 group"
              onClick={() => setSelectedId(teacher.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                      {teacher.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary-600 transition-colors">{teacher.nombre}</p>
                      <p className="text-xs text-muted-foreground">{teacher.cursos.join(', ')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{teacher.asignaturas.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookCheck className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="flex items-center gap-1.5">
                      Planificación: {statusBadge(teacher.planificacionStatus)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="flex items-center gap-1.5">
                      Calificaciones: {statusBadge(teacher.calificacionesStatus)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Asistencia: </span>
                    <span className={teacher.asistencia >= 90 ? 'text-success-600 font-medium' : teacher.asistencia >= 80 ? 'text-warning-600 font-medium' : 'text-danger-600 font-medium'}>
                      {teacher.asistencia}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{teacher.evidencias} evidencias</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{teacher.ultimaActividad}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
/*  Tab: Observación                                                   */
/* ------------------------------------------------------------------ */

export function ObservacionTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    docente: '',
    fecha: new Date().toISOString().slice(0, 10),
    curso: '',
    asignatura: '',
    tipo: 'Visita',
    observaciones: '',
    retroalimentacion: '',
    compromisos: '',
  });

  const change = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    alert(`Observación guardada (mock)\nDocente: ${form.docente}\nTipo: ${form.tipo}`);
    setShowForm(false);
    setForm({ docente: '', fecha: new Date().toISOString().slice(0, 10), curso: '', asignatura: '', tipo: 'Visita', observaciones: '', retroalimentacion: '', compromisos: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Observación de Aula</h2>
          <p className="text-sm text-muted-foreground">Registra visitas, observaciones y seguimientos pedagógicos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nueva Observación'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar {form.tipo}</CardTitle>
            <CardDescription>Completa los campos para registrar una nueva observación de aula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-700">Docente</label>
                <Select value={form.docente} onValueChange={(v) => change('docente', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_TEACHERS.map((t) => (
                      <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-700">Fecha</label>
                <Input type="date" value={form.fecha} onChange={(e) => change('fecha', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-700">Tipo</label>
                <Select value={form.tipo} onValueChange={(v) => change('tipo', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visita">Visita</SelectItem>
                    <SelectItem value="Observación">Observación</SelectItem>
                    <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-700">Curso</label>
                <Select value={form.curso} onValueChange={(v) => change('curso', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CURSOS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-700">Asignatura</label>
                <Select value={form.asignatura} onValueChange={(v) => change('asignatura', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_ASIGNATURAS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Observaciones</label>
              <textarea
                rows={3}
                value={form.observaciones}
                onChange={(e) => change('observaciones', e.target.value)}
                placeholder="Describe lo observado durante la visita..."
                className="w-full rounded-lg border border-secondary-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Retroalimentación</label>
              <textarea
                rows={3}
                value={form.retroalimentacion}
                onChange={(e) => change('retroalimentacion', e.target.value)}
                placeholder="Brinda retroalimentación constructiva al docente..."
                className="w-full rounded-lg border border-secondary-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Compromisos</label>
              <textarea
                rows={3}
                value={form.compromisos}
                onChange={(e) => change('compromisos', e.target.value)}
                placeholder="Acuerdos y compromisos establecidos con el docente..."
                className="w-full rounded-lg border border-secondary-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none resize-none"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Observación</Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Observaciones Recientes</CardTitle>
            <CardDescription>Historial de visitas y observaciones registradas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_OBSERVATIONS.map((obs) => (
              <div key={obs.id} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-xs">
                      {obs.docente.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{obs.docente}</p>
                      <p className="text-xs text-muted-foreground">{obs.curso} · {obs.asignatura}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{obs.tipo}</Badge>
                    {statusBadge(obs.estado)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{obs.fecha}</p>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{obs.observaciones}</p>
                  </div>
                  {obs.retroalimentacion && (
                    <div className="flex gap-2">
                      <MessageSquare className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground"><span className="font-medium">Retro: </span>{obs.retroalimentacion}</p>
                    </div>
                  )}
                  {obs.compromisos && (
                    <div className="flex gap-2">
                      <Target className="w-4 h-4 text-warning-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground"><span className="font-medium">Compromiso: </span>{obs.compromisos}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguimientos Pendientes</CardTitle>
            <CardDescription>Observaciones que requieren seguimiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_OBSERVATIONS.filter((o) => o.estado !== 'Completado').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-success-500 mb-2" />
                <p className="text-sm font-medium text-foreground">Todo al día</p>
                <p className="text-xs text-muted-foreground">No hay seguimientos pendientes</p>
              </div>
            ) : (
              MOCK_OBSERVATIONS.filter((o) => o.estado !== 'Completado').map((obs) => (
                <div key={obs.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{obs.docente}</p>
                    {statusBadge(obs.estado)}
                  </div>
                  <p className="text-xs text-muted-foreground">{obs.curso} · {obs.asignatura}</p>
                  <p className="text-xs text-muted-foreground">{obs.fecha} · {obs.tipo}</p>
                  <div className="mt-2 flex gap-1">
                    <Badge variant="warning" className="text-xs">Pendiente</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Analítica                                                     */
/* ------------------------------------------------------------------ */

export function AnaliticaTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Analítica Académica</h2>
        <p className="text-sm text-muted-foreground">Comparativas e indicadores para la toma de decisiones</p>
      </div>

      <ComparisonSection
        title="Comparar Docentes"
        icon={Users}
        items={MOCK_COMPARISON.docentes.map((d) => ({ ...d, id: d.nombre }))}
      />

      <ComparisonSection
        title="Comparar Cursos"
        icon={School}
        items={MOCK_COMPARISON.cursos.map((c) => ({ ...c, id: c.nombre }))}
      />

      <ComparisonSection
        title="Comparar Asignaturas"
        icon={BookMarked}
        items={MOCK_COMPARISON.asignaturas.map((a) => ({ ...a, id: a.nombre }))}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Detección IA
          </CardTitle>
          <CardDescription>
            Patrones anómalos detectados por el sistema de inteligencia artificial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-danger-500" />
                <h4 className="font-semibold text-sm text-foreground">Inflación de Notas</h4>
              </div>
              <div className="space-y-2">
                {MOCK_IA_DETECTION.inflacionNotas.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-danger-50 border border-danger-200">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.docente}</p>
                      <p className="text-xs text-muted-foreground">{item.estudiantes} estudiantes</p>
                    </div>
                    <Badge variant="danger">{item.promedio}% prom.</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-warning-500" />
                <h4 className="font-semibold text-sm text-foreground">Docentes que nunca reprueban</h4>
              </div>
              <div className="space-y-2">
                {MOCK_IA_DETECTION.nuncaReprueban.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-warning-50 border border-warning-200">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.docente}</p>
                      <p className="text-xs text-muted-foreground">{item.estudiantes} estudiantes</p>
                    </div>
                    <Badge variant="warning">{item.aprobacion}% aprob.</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-danger-500" />
                <h4 className="font-semibold text-sm text-foreground">Docentes que nunca suben evidencias</h4>
              </div>
              <div className="space-y-2">
                {MOCK_IA_DETECTION.nuncaSubenEvidencias.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-danger-50 border border-danger-200">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.docente}</p>
                      <p className="text-xs text-muted-foreground">Sin evidencias</p>
                    </div>
                    <Badge variant="danger">{item.diasSinSubir} días</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-warning-500" />
                <h4 className="font-semibold text-sm text-foreground">Docentes con pocas planificaciones</h4>
              </div>
              <div className="space-y-2">
                {MOCK_IA_DETECTION.pocasPlanificaciones.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-warning-50 border border-warning-200">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.docente}</p>
                      <p className="text-xs text-muted-foreground">{item.cursos} cursos</p>
                    </div>
                    <Badge variant="warning">{item.planificaciones} planif.</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comparison sub-component                                           */
/* ------------------------------------------------------------------ */

interface ComparisonItem {
  id: string;
  nombre: string;
  promedioCalificaciones: number;
  asistencia: number;
  planificaciones: number;
  evidencias: number;
}

function ComparisonSection({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ElementType;
  items: ComparisonItem[];
}) {
  const [a, setA] = useState(items[0]?.id ?? '');
  const [b, setB] = useState(items[1]?.id ?? '');

  const itemA = items.find((i) => i.id === a);
  const itemB = items.find((i) => i.id === b);

  const metrics = [
    { label: 'Promedio Calificaciones', key: 'promedioCalificaciones' as const, icon: Award },
    { label: 'Asistencia Registrada', key: 'asistencia' as const, icon: Calendar },
    { label: 'Planificaciones Completadas', key: 'planificaciones' as const, icon: ClipboardList },
    { label: 'Evidencias Subidas', key: 'evidencias' as const, icon: Upload },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Elemento A</label>
            <Select value={a} onValueChange={setA}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Elemento B</label>
            <Select value={b} onValueChange={setB}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {itemA && itemB ? (
          <div className="space-y-4 pt-2">
            {metrics.map((metric) => {
              const MetricIcon = metric.icon;
              const valA = itemA[metric.key];
              const valB = itemB[metric.key];
              const diff = valA - valB;
              const isHigher = diff > 0;
              return (
                <div key={metric.key} className="p-3 rounded-lg bg-secondary-50 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <MetricIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{metric.label}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{itemA.nombre}</p>
                      <p className={`text-lg font-bold ${valA >= 90 ? 'text-success-600' : valA >= 70 ? 'text-warning-600' : 'text-danger-600'}`}>
                        {metric.key === 'evidencias' ? valA : `${valA}%`}
                      </p>
                      {comparisonBar(metric.key === 'evidencias' ? (valA / 30) * 100 : valA)}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{itemB.nombre}</p>
                      <p className={`text-lg font-bold ${valB >= 90 ? 'text-success-600' : valB >= 70 ? 'text-warning-600' : 'text-danger-600'}`}>
                        {metric.key === 'evidencias' ? valB : `${valB}%`}
                      </p>
                      {comparisonBar(metric.key === 'evidencias' ? (valB / 30) * 100 : valB)}
                    </div>
                  </div>
                  {diff !== 0 && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs">
                      {isHigher ? (
                        <TrendingUp className="w-3.5 h-3.5 text-success-500" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-danger-500" />
                      )}
                      <span className={isHigher ? 'text-success-600' : 'text-danger-600'}>
                        {itemA.nombre} supera por {Math.abs(diff)}{metric.key === 'evidencias' ? '' : '%'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Scale className="w-10 h-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Selecciona dos elementos para comparar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main CoordinatorDashboard                                          */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'supervision', label: 'Supervisión', icon: Eye },
  { id: 'observacion', label: 'Observación', icon: ClipboardList },
  { id: 'analitica', label: 'Analítica', icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function CoordinatorDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('inicio');

  const renderTab = () => {
    switch (activeTab) {
      case 'inicio':
        return <InicioTab />;
      case 'supervision':
        return <SupervisionTab />;
      case 'observacion':
        return <ObservacionTab />;
      case 'analitica':
        return <AnaliticaTab />;
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
