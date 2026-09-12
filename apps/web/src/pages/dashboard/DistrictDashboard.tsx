import { useState } from 'react';
import {
  Users, Award, Calendar, Building2, TrendingUp, AlertTriangle,
  School, MapPin, ChevronDown, ChevronUp, BarChart3, ArrowUp, ArrowDown,
  Bell, FileText, UserPlus, Eye, AlertCircle, BookOpen,
  Download, Search, Filter, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useDistrictDashboard } from '../../hooks/api/useAnalytics';

const mockSchools = [
  { id: 'SCH-001', name: 'Escuela Primaria Juan Pablo Duarte', code: 'JUAN-001', location: 'Santo Domingo Este', students: 520, teachers: 28, avgGrade: 82.1, attendance: 93.0, approvalRate: 85.4, dropoutRisk: 4.2, status: 'Activo' as const, teachersList: [{ name: 'María González', subject: 'Matemáticas', students: 32, avgGrade: 84.2 }, { name: 'Pedro Rodríguez', subject: 'Lengua Española', students: 30, avgGrade: 81.5 }, { name: 'Ana Martínez', subject: 'Ciencias Sociales', students: 28, avgGrade: 79.8 }], gradeDistribution: [{ range: '90-100', count: 85 }, { range: '80-89', count: 142 }, { range: '70-79', count: 156 }, { range: '60-69', count: 98 }, { range: '<60', count: 39 }], recentAlerts: [{ type: 'info', message: 'Mejora en asistencia mensual', date: '2026-06-15' }] },
  { id: 'SCH-002', name: 'Liceo Secundario María Teresa', code: 'MARI-002', location: 'Santiago Oeste', students: 680, teachers: 35, avgGrade: 76.4, attendance: 89.0, approvalRate: 72.8, dropoutRisk: 8.7, status: 'Activo' as const, teachersList: [{ name: 'Carlos Méndez', subject: 'Física', students: 35, avgGrade: 74.1 }, { name: 'Rosa Pérez', subject: 'Química', students: 33, avgGrade: 78.3 }, { name: 'Luis Fernández', subject: 'Biología', students: 30, avgGrade: 71.2 }], gradeDistribution: [{ range: '90-100', count: 68 }, { range: '80-89', count: 124 }, { range: '70-79', count: 185 }, { range: '60-69', count: 176 }, { range: '<60', count: 127 }], recentAlerts: [{ type: 'warning', message: 'Bajo rendimiento en matemáticas', date: '2026-06-12' }, { type: 'warning', message: 'Inasistencias recurrentes en 4to grado', date: '2026-06-10' }] },
  { id: 'SCH-003', name: 'Escuela Básica Gregorio Luperón', code: 'GREG-003', location: 'La Vega', students: 410, teachers: 22, avgGrade: 79.8, attendance: 92.0, approvalRate: 81.2, dropoutRisk: 5.1, status: 'Activo' as const, teachersList: [{ name: 'Diana Castillo', subject: 'Matemáticas', students: 25, avgGrade: 80.3 }, { name: 'José Ramírez', subject: 'Lengua Española', students: 24, avgGrade: 78.9 }], gradeDistribution: [{ range: '90-100', count: 52 }, { range: '80-89', count: 108 }, { range: '70-79', count: 123 }, { range: '60-69', count: 89 }, { range: '<60', count: 38 }], recentAlerts: [] },
  { id: 'SCH-004', name: 'Centro Educativo Ana Magnolia', code: 'ANA-004', location: 'San Pedro de Macorís', students: 340, teachers: 18, avgGrade: 74.2, attendance: 86.0, approvalRate: 70.5, dropoutRisk: 12.3, status: 'Activo' as const, teachersList: [{ name: 'Sofía Hernández', subject: 'Ciencias Sociales', students: 22, avgGrade: 73.1 }, { name: 'Miguel Ángel', subject: 'Formación Humana', students: 20, avgGrade: 75.8 }], gradeDistribution: [{ range: '90-100', count: 32 }, { range: '80-89', count: 72 }, { range: '70-79', count: 95 }, { range: '60-69', count: 88 }, { range: '<60', count: 53 }], recentAlerts: [{ type: 'danger', message: 'Alto riesgo de deserción detectado', date: '2026-06-14' }, { type: 'warning', message: 'Baja asistencia en turno vespertino', date: '2026-06-11' }] },
  { id: 'SCH-005', name: 'Politécnico Prof. Juan Bosch', code: 'JUAN-005', location: 'San Cristóbal', students: 560, teachers: 42, avgGrade: 88.5, attendance: 95.0, approvalRate: 92.1, dropoutRisk: 2.1, status: 'Activo' as const, teachersList: [{ name: 'Roberto Sánchez', subject: 'Informática', students: 30, avgGrade: 91.2 }, { name: 'Laura Jiménez', subject: 'Electricidad', students: 28, avgGrade: 87.5 }, { name: 'Fernando Díaz', subject: 'Matemáticas', students: 32, avgGrade: 86.9 }], gradeDistribution: [{ range: '90-100', count: 142 }, { range: '80-89', count: 186 }, { range: '70-79', count: 124 }, { range: '60-69', count: 72 }, { range: '<60', count: 36 }], recentAlerts: [] },
  { id: 'SCH-006', name: 'Escuela Rural Los Cacaos', code: 'RURA-006', location: 'Los Cacaos', students: 95, teachers: 6, avgGrade: 65.3, attendance: 78.0, approvalRate: 58.2, dropoutRisk: 24.7, status: 'Riesgo' as const, teachersList: [{ name: 'Juana López', subject: 'Multigrado', students: 22, avgGrade: 64.1 }, { name: 'Manuel Pérez', subject: 'Multigrado', students: 18, avgGrade: 66.8 }], gradeDistribution: [{ range: '90-100', count: 5 }, { range: '80-89', count: 12 }, { range: '70-79', count: 18 }, { range: '60-69', count: 28 }, { range: '<60', count: 32 }], recentAlerts: [{ type: 'danger', message: 'Riesgo crítico de deserción (24.7%)', date: '2026-06-14' }, { type: 'danger', message: 'Asistencia por debajo del 80%', date: '2026-06-13' }, { type: 'warning', message: 'Falta de docentes titulares', date: '2026-06-10' }] },
  { id: 'SCH-007', name: 'Liceo Científico Dr. Rafael Díaz', code: 'RAFA-007', location: 'Moca', students: 490, teachers: 30, avgGrade: 81.0, attendance: 91.0, approvalRate: 83.7, dropoutRisk: 5.8, status: 'Activo' as const, teachersList: [{ name: 'Elena Vargas', subject: 'Matemáticas', students: 28, avgGrade: 82.4 }, { name: 'Ricardo Torres', subject: 'Física', students: 26, avgGrade: 80.1 }], gradeDistribution: [{ range: '90-100', count: 78 }, { range: '80-89', count: 132 }, { range: '70-79', count: 145 }, { range: '60-69', count: 92 }, { range: '<60', count: 43 }], recentAlerts: [] },
  { id: 'SCH-008', name: 'Escuela de Arte y Cultura', code: 'ARTE-008', location: 'Santiago', students: 230, teachers: 15, avgGrade: 85.7, attendance: 94.0, approvalRate: 89.3, dropoutRisk: 3.4, status: 'Activo' as const, teachersList: [{ name: 'Claudia Reyes', subject: 'Música', students: 18, avgGrade: 87.2 }, { name: 'Andrés Cruz', subject: 'Artes Plásticas', students: 16, avgGrade: 84.5 }], gradeDistribution: [{ range: '90-100', count: 62 }, { range: '80-89', count: 78 }, { range: '70-79', count: 54 }, { range: '60-69', count: 28 }, { range: '<60', count: 8 }], recentAlerts: [] },
  { id: 'SCH-009', name: 'Centro de Educación Especial', code: 'ESPE-009', location: 'Santo Domingo Norte', students: 85, teachers: 12, avgGrade: 70.1, attendance: 88.0, approvalRate: 65.4, dropoutRisk: 9.2, status: 'Activo' as const, teachersList: [{ name: 'Isabel Moronta', subject: 'Educación Especial', students: 10, avgGrade: 71.3 }, { name: 'Tomás Valdez', subject: 'Terapia Ocupacional', students: 8, avgGrade: 68.7 }], gradeDistribution: [{ range: '90-100', count: 8 }, { range: '80-89', count: 14 }, { range: '70-79', count: 22 }, { range: '60-69', count: 25 }, { range: '<60', count: 16 }], recentAlerts: [{ type: 'info', message: 'Taller de capacitación docente completado', date: '2026-06-08' }] },
  { id: 'SCH-010', name: 'Escuela Técnica Prof. Ramón López', code: 'RAMO-010', location: 'Bonao', students: 375, teachers: 24, avgGrade: 76.9, attendance: 87.0, approvalRate: 74.6, dropoutRisk: 10.5, status: 'Activo' as const, teachersList: [{ name: 'Héctor Peña', subject: 'Soldadura', students: 20, avgGrade: 78.2 }, { name: 'Marisol Tejada', subject: 'Contabilidad', students: 22, avgGrade: 75.8 }], gradeDistribution: [{ range: '90-100', count: 38 }, { range: '80-89', count: 82 }, { range: '70-79', count: 105 }, { range: '60-69', count: 98 }, { range: '<60', count: 52 }], recentAlerts: [{ type: 'warning', message: 'Equipos de taller necesitan mantenimiento', date: '2026-06-09' }] },
  { id: 'SCH-011', name: 'Liceo Nocturno Pedro Mir', code: 'PEDR-011', location: 'Santiago', students: 310, teachers: 14, avgGrade: 68.4, attendance: 82.0, approvalRate: 62.3, dropoutRisk: 18.9, status: 'Riesgo' as const, teachersList: [{ name: 'Rafael Disla', subject: 'Matemáticas', students: 25, avgGrade: 67.1 }, { name: 'Yolanda Reyes', subject: 'Lengua Española', students: 24, avgGrade: 69.8 }], gradeDistribution: [{ range: '90-100', count: 18 }, { range: '80-89', count: 45 }, { range: '70-79', count: 72 }, { range: '60-69', count: 95 }, { range: '<60', count: 80 }], recentAlerts: [{ type: 'danger', message: 'Deserción estudiantil en aumento', date: '2026-06-14' }, { type: 'warning', message: 'Bajo rendimiento en educación de adultos', date: '2026-06-12' }] },
  { id: 'SCH-012', name: 'Jardín de Infantes Los Peques', code: 'PEQU-012', location: 'La Vega', students: 185, teachers: 8, avgGrade: 83.2, attendance: 96.0, approvalRate: 87.5, dropoutRisk: 1.8, status: 'Activo' as const, teachersList: [{ name: 'Katherine Ozuna', subject: 'Educación Inicial', students: 20, avgGrade: 84.5 }, { name: 'Gloria Estévez', subject: 'Educación Inicial', students: 18, avgGrade: 82.8 }], gradeDistribution: [{ range: '90-100', count: 48 }, { range: '80-89', count: 62 }, { range: '70-79', count: 45 }, { range: '60-69', count: 22 }, { range: '<60', count: 8 }], recentAlerts: [] },
];

const quickActions = [
  { label: 'Registrar Estudiante', icon: UserPlus, color: 'bg-blue-100 text-blue-600' },
  { label: 'Ver Reportes', icon: FileText, color: 'bg-green-100 text-green-600' },
  { label: 'Enviar Notificaciones', icon: Bell, color: 'bg-purple-100 text-purple-600' },
  { label: 'Generar Certificados', icon: Award, color: 'bg-orange-100 text-orange-600' },
  { label: 'Programar Visita', icon: Calendar, color: 'bg-cyan-100 text-cyan-600' },
  { label: 'Revisar Planificaciones', icon: BookOpen, color: 'bg-pink-100 text-pink-600' },
];

const tabs = [
  { id: 'inicio', label: 'Inicio', icon: Building2 },
  { id: 'escuelas', label: 'Escuelas', icon: School },
  { id: 'rendimiento', label: 'Rendimiento', icon: BarChart3 },
  { id: 'alertas', label: 'Alertas', icon: AlertTriangle },
];

function TabBar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 bg-secondary-100 p-1 rounded-lg w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            active === tab.id
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'success' | 'danger' | 'warning'> = { Activo: 'success', Riesgo: 'danger', Inactivo: 'warning' };
  return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
}

/* ---------- DistrictDashboard ---------- */
export function DistrictDashboard() {
  const [activeTab, setActiveTab] = useState('inicio');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel del Distrito</h1>
          <p className="text-muted-foreground">Distrito Educativo 01-01 · Santo Domingo</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary-100 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Actualizado hace 5 min
          </span>
          <button className="flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-100 px-3 py-1.5 rounded-full hover:bg-primary-200">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
        </div>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'inicio' && <InicioTab />}
      {activeTab === 'escuelas' && <EscuelasTab />}
      {activeTab === 'rendimiento' && <RendimientoTab />}
      {activeTab === 'alertas' && <AlertasTab />}
    </div>
  );
}

/* ---------- InicioTab ---------- */
export function InicioTab() {
  const { data, isLoading } = useDistrictDashboard();

  if (isLoading) return <LoadingSpinner />;

  const k = data?.kpis;
  const totalStudents = k ? k.totalStudents : mockSchools.reduce((s, c) => s + c.students, 0);
  const totalTeachers = k ? k.activeTeachers : mockSchools.reduce((s, c) => s + c.teachers, 0);
  const avgGrade = k ? k.averageGrade : mockSchools.reduce((s, c) => s + c.avgGrade, 0) / mockSchools.length;
  const avgAttendance = k ? k.attendanceRate : mockSchools.reduce((s, c) => s + c.attendance, 0) / mockSchools.length;
  const totalAlerts = k ? k.studentsWithAlerts : mockSchools.reduce((s, c) => s + c.recentAlerts.length, 0);
  const schoolCount = k?.totalSchools ?? mockSchools.length;
  const riskSchools = mockSchools.filter((s) => s.status === 'Riesgo').length;
  const highDropout = mockSchools.filter((s) => s.dropoutRisk > 10).length;
  const approvalRate = k ? k.approvalRate : mockSchools.reduce((s, c) => s + c.approvalRate, 0) / mockSchools.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard label="Centros Supervisados" value={schoolCount} icon={<Building2 className="w-6 h-6" />} color="info" />
        <StatsCard label="Estudiantes" value={totalStudents} icon={<Users className="w-6 h-6" />} color="primary" subtitle={`${totalTeachers} docentes`} />
        <StatsCard label="Nota Promedio" value={`${avgGrade.toFixed(1)}%`} icon={<Award className="w-6 h-6" />} color="success" subtitle={`${approvalRate.toFixed(0)}% aprob.`} />
        <StatsCard label="Asistencia" value={`${avgAttendance.toFixed(1)}%`} icon={<Calendar className="w-6 h-6" />} color="warning" />
        <StatsCard label="Alertas" value={totalAlerts} icon={<AlertTriangle className="w-6 h-6" />} color="danger" subtitle={`${riskSchools} centros en riesgo`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Resumen de Rendimiento por Centro</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSchools.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center gap-4">
                  <div className="w-44 truncate text-sm font-medium">{s.name}</div>
                  <div className="flex-1 bg-secondary-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-green-500 transition-all" style={{ width: `${s.avgGrade}%` }} />
                  </div>
                  <div className="w-16 text-right text-sm font-semibold">{s.avgGrade.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Acciones Rápidas</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button key={action.label} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-center text-muted-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Alertas del Distrito</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <AlertBlock icon={<AlertCircle className="w-5 h-5" />} color="danger" title={`${highDropout} centros con alto riesgo de deserción`} subtitle="Requieren intervención inmediata" />
            <AlertBlock icon={<TrendingUp className="w-5 h-5" />} color="warning" title={`${mockSchools.filter((s) => s.avgGrade < 75).length} centros con bajo rendimiento`} subtitle="Por debajo del umbral del 75%" />
            <AlertBlock icon={<Calendar className="w-5 h-5" />} color="warning" title={`${mockSchools.filter((s) => s.attendance < 85).length} centros con baja asistencia`} subtitle="Asistencia inferior al 85%" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- EscuelasTab ---------- */
export function EscuelasTab() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{mockSchools.length} centros educativos supervisados</p>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent">
            <Search className="w-4 h-4" /> Buscar
          </button>
          <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent">
            <Filter className="w-4 h-4" /> Filtrar
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary-50">
                  <th className="w-10 px-4 py-3" />
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Centro</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ubicación</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Est.</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Doc.</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Nota</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Asist.</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {mockSchools.map((school) => {
                  const isExpanded = expanded.has(school.id);
                  return (
                    <>
                      <tr key={school.id} className="border-b border-border hover:bg-accent/50 cursor-pointer" onClick={() => toggle(school.id)}>
                        <td className="px-4 py-3 text-center">
                          {isExpanded ? <ChevronUp className="w-4 h-4 inline text-muted-foreground" /> : <ChevronDown className="w-4 h-4 inline text-muted-foreground" />}
                        </td>
                        <td className="px-4 py-3 font-medium">{school.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{school.code}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{school.location}</span>
                        </td>
                        <td className="px-4 py-3 text-center">{school.students}</td>
                        <td className="px-4 py-3 text-center">{school.teachers}</td>
                        <td className="px-4 py-3 text-center font-semibold">{school.avgGrade.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-center">{school.attendance.toFixed(0)}%</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={school.status} /></td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${school.id}-expanded`} className="bg-secondary-50/50">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-3 gap-6">
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Docentes Destacados</h4>
                                <div className="space-y-1.5">
                                  {school.teachersList.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                      <span>{t.name}</span>
                                      <span className="text-muted-foreground text-xs">{t.subject} · {t.avgGrade.toFixed(1)}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Distribución de Notas</h4>
                                <div className="space-y-1.5">
                                  {school.gradeDistribution.map((g, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      <span className="w-12 text-muted-foreground">{g.range}</span>
                                      <div className="flex-1 bg-secondary-200 rounded-full h-2">
                                        <div className="h-full rounded-full bg-primary-400" style={{ width: `${(g.count / school.students) * 100}%` }} />
                                      </div>
                                      <span className="w-8 text-right text-xs text-muted-foreground">{g.count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Alertas Recientes</h4>
                                {school.recentAlerts.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {school.recentAlerts.map((a, i) => (
                                      <div key={i} className={`flex items-start gap-1.5 text-xs p-1.5 rounded ${a.type === 'danger' ? 'bg-danger-50 text-danger-700' : a.type === 'warning' ? 'bg-warning-50 text-warning-700' : 'bg-blue-50 text-blue-700'}`}>
                                        <span className="mt-0.5">{a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵'}</span>
                                        <div>
                                          <p>{a.message}</p>
                                          <p className="text-[10px] opacity-75">{a.date}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">Sin alertas recientes</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2 justify-end">
                              <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-primary-100 text-primary-700 hover:bg-primary-200">
                                <Eye className="w-3.5 h-3.5" /> Ver Detalle
                              </button>
                              <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-secondary-100 text-secondary-700 hover:bg-secondary-200">
                                <FileText className="w-3.5 h-3.5" /> Reporte
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- RendimientoTab ---------- */
export function RendimientoTab() {
  const sorted = [...mockSchools].sort((a, b) => b.avgGrade - a.avgGrade);
  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.slice(-3).reverse();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              Comparativa de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sorted.map((s, i) => {
                const maxGrade = sorted[0].avgGrade;
                const pct = (s.avgGrade / maxGrade) * 100;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="w-6 text-xs text-muted-foreground text-right">{i + 1}</span>
                    <div className="w-40 truncate text-sm">{s.name}</div>
                    <div className="flex-1 bg-secondary-100 rounded-full h-4 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all ${s.avgGrade >= 80 ? 'bg-green-500' : s.avgGrade >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm font-semibold">{s.avgGrade.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success-600">
                <ArrowUp className="w-5 h-5" />
                Mejores Centros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {top3.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg bg-success-50 border border-success-200">
                    <div className="w-10 h-10 rounded-full bg-success-600 text-white flex items-center justify-center font-bold text-lg">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.students} estudiantes · {s.teachers} docentes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success-700">{s.avgGrade.toFixed(1)}%</p>
                      <p className="text-xs text-success-600">{s.attendance.toFixed(0)}% asist.</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-danger-600">
                <ArrowDown className="w-5 h-5" />
                Centros con Dificultades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bottom3.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg bg-danger-50 border border-danger-200">
                    <div className="w-10 h-10 rounded-full bg-danger-600 text-white flex items-center justify-center font-bold text-lg">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.students} estudiantes · Riesgo: {s.dropoutRisk.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-danger-700">{s.avgGrade.toFixed(1)}%</p>
                      <p className="text-xs text-danger-600">{s.attendance.toFixed(0)}% asist.</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Métricas Comparativas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricBox label="Promedio General" value={`${(mockSchools.reduce((s, c) => s + c.avgGrade, 0) / mockSchools.length).toFixed(1)}%`} sub="+2.3% vs semestre anterior" trend="up" />
            <MetricBox label="Mayor Nota" value={`${Math.max(...mockSchools.map((s) => s.avgGrade)).toFixed(1)}%`} sub={sorted[0].name} trend="up" />
            <MetricBox label="Menor Nota" value={`${Math.min(...mockSchools.map((s) => s.avgGrade)).toFixed(1)}%`} sub={sorted[sorted.length - 1].name} trend="down" />
            <MetricBox label="Brecha Máxima" value={`${(sorted[0].avgGrade - sorted[sorted.length - 1].avgGrade).toFixed(1)} pts`} sub="Diferencia entre extremos" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- AlertasTab ---------- */
export function AlertasTab() {
  const lowPerf = mockSchools.filter((s) => s.avgGrade < 75);
  const attendanceIssues = mockSchools.filter((s) => s.attendance < 85);
  const highRisk = mockSchools.filter((s) => s.dropoutRisk > 10);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Bajo Rendimiento" value={lowPerf.length} icon={<TrendingUp className="w-6 h-6" />} color="danger" subtitle="Nota < 75%" />
        <StatsCard label="Problemas Asistencia" value={attendanceIssues.length} icon={<Calendar className="w-6 h-6" />} color="warning" subtitle="Asistencia < 85%" />
        <StatsCard label="Riesgo Deserción" value={highRisk.length} icon={<AlertTriangle className="w-6 h-6" />} color="danger" subtitle="Riesgo > 10%" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ArrowDown className="w-5 h-5 text-danger-500" /> Centros con Bajo Rendimiento</CardTitle></CardHeader>
          <CardContent>
            {lowPerf.length > 0 ? (
              <div className="space-y-3">
                {lowPerf.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-danger-50 border border-danger-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.location} · {s.students} estudiantes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-danger-700">{s.avgGrade.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">{s.approvalRate.toFixed(1)}% aprob.</p>
                    </div>
                    <Badge variant="danger">{s.dropoutRisk.toFixed(1)}% riesgo</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Todos los centros están por encima del umbral de rendimiento</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-warning-500" /> Problemas de Asistencia</CardTitle></CardHeader>
          <CardContent>
            {attendanceIssues.length > 0 ? (
              <div className="space-y-3">
                {attendanceIssues.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-warning-50 border border-warning-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.location}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-warning-700">{s.attendance.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">asistencia</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold">{s.students} est.</p>
                      <p className="text-xs text-muted-foreground">matrícula</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No hay problemas de asistencia reportados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-danger-500" /> Alertas por Centro</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockSchools.filter((s) => s.recentAlerts.length > 0).map((s) => (
              <div key={s.id} className="p-3 rounded-lg border border-border hover:bg-accent/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.code}</span>
                </div>
                <div className="space-y-1 ml-6">
                  {s.recentAlerts.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${a.type === 'danger' ? 'bg-danger-500' : a.type === 'warning' ? 'bg-warning-500' : 'bg-blue-500'}`} />
                      <span className="text-muted-foreground">{a.message}</span>
                      <span className="text-muted-foreground/50">{a.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Shared Helpers ---------- */
function AlertBlock({ icon, color, title, subtitle }: { icon: React.ReactNode; color: 'danger' | 'warning'; title: string; subtitle: string }) {
  const bg = color === 'danger' ? 'bg-danger-50 border-danger-200' : 'bg-warning-50 border-warning-200';
  const text = color === 'danger' ? 'text-danger-600' : 'text-warning-600';
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl ${bg} border`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${text}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function MetricBox({ label, value, sub, trend }: { label: string; value: string; sub: string; trend?: 'up' | 'down' }) {
  return (
    <div className="p-4 rounded-lg border border-border">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className={`text-xs mt-1 flex items-center gap-1 ${trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-muted-foreground'}`}>
        {trend === 'up' && <ArrowUp className="w-3 h-3" />}
        {trend === 'down' && <ArrowDown className="w-3 h-3" />}
        {sub}
      </p>
    </div>
  );
}
