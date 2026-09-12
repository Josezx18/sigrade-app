import { useState } from 'react';
import {
  Users, GraduationCap, Award, Calendar, Building2, MapPin,
  TrendingUp, ChevronDown, ChevronUp, BarChart3, Globe, ArrowUp, ArrowDown,
  AlertCircle, Clock, Download, Search, Filter, Eye, FileText, Lightbulb,
  Target, Activity, BrainCircuit, Star, Shield, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useRegionalDashboard } from '../../hooks/api/useAnalytics';


interface DistrictData {
  id: string;
  name: string;
  schools: number;
  students: number;
  teachers: number;
  avgGrade: number;
  attendance: number;
  approvalRate: number;
  dropoutRisk: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  topSchool: string;
  bottomSchool: string;
}

const mockDistricts: DistrictData[] = [
  { id: 'DIST-01', name: 'Distrito 01-01', schools: 15, students: 5420, teachers: 268, avgGrade: 79.5, attendance: 91.0, approvalRate: 82.3, dropoutRisk: 6.2, rank: 3, trend: 'up', topSchool: 'Politécnico Juan Bosch', bottomSchool: 'Escuela Rural Los Cacaos' },
  { id: 'DIST-02', name: 'Distrito 01-02', schools: 12, students: 4860, teachers: 234, avgGrade: 76.2, attendance: 88.0, approvalRate: 78.1, dropoutRisk: 9.8, rank: 5, trend: 'down', topSchool: 'Liceo Científico Dr. Díaz', bottomSchool: 'Liceo Nocturno Pedro Mir' },
  { id: 'DIST-03', name: 'Distrito 02-01', schools: 18, students: 7100, teachers: 356, avgGrade: 82.3, attendance: 93.0, approvalRate: 85.7, dropoutRisk: 4.1, rank: 1, trend: 'up', topSchool: 'Escuela Primaria Duarte', bottomSchool: 'Centro Ana Magnolia' },
  { id: 'DIST-04', name: 'Distrito 02-02', schools: 10, students: 3950, teachers: 198, avgGrade: 74.8, attendance: 86.0, approvalRate: 76.2, dropoutRisk: 12.5, rank: 7, trend: 'down', topSchool: 'Escuela Gregorio Luperón', bottomSchool: 'Escuela Rural Los Cacaos' },
  { id: 'DIST-05', name: 'Distrito 03-01', schools: 14, students: 5680, teachers: 284, avgGrade: 81.1, attendance: 90.0, approvalRate: 83.9, dropoutRisk: 5.3, rank: 2, trend: 'up', topSchool: 'Politécnico Juan Bosch', bottomSchool: 'Escuela Técnica López' },
  { id: 'DIST-06', name: 'Distrito 03-02', schools: 8, students: 3120, teachers: 156, avgGrade: 72.6, attendance: 85.0, approvalRate: 74.0, dropoutRisk: 15.4, rank: 8, trend: 'down', topSchool: 'Jardín Los Peques', bottomSchool: 'Liceo Nocturno Pedro Mir' },
  { id: 'DIST-07', name: 'Distrito 04-01', schools: 11, students: 4480, teachers: 224, avgGrade: 78.4, attendance: 89.0, approvalRate: 80.5, dropoutRisk: 7.6, rank: 4, trend: 'stable', topSchool: 'Escuela Arte y Cultura', bottomSchool: 'Centro Educación Especial' },
  { id: 'DIST-08', name: 'Distrito 04-02', schools: 8, students: 3840, teachers: 192, avgGrade: 77.9, attendance: 87.0, approvalRate: 79.8, dropoutRisk: 8.1, rank: 6, trend: 'up', topSchool: 'Liceo Científico Dr. Díaz', bottomSchool: 'Escuela Técnica López' },
];

const qualityMetrics = [
  { label: 'Índice de Calidad Educativa', value: '78.4%', change: '+2.1%', trend: 'up' as const },
  { label: 'Efectividad Docente', value: '82.6%', change: '+1.5%', trend: 'up' as const },
  { label: 'Infraestructura Escolar', value: '74.2%', change: '-0.8%', trend: 'down' as const },
  { label: 'Inclusión Educativa', value: '88.3%', change: '+3.2%', trend: 'up' as const },
  { label: 'Gestión Administrativa', value: '79.1%', change: '+0.4%', trend: 'up' as const },
  { label: 'Participación Familiar', value: '65.7%', change: '+5.9%', trend: 'up' as const },
];

const aiPatterns = [
  { title: 'Focos de Bajo Rendimiento', description: 'Se detectaron 3 distritos con rendimiento consistentemente bajo en matemáticas y ciencias', severity: 'high' as const },
  { title: 'Patrón de Deserción', description: 'Los estudiantes de zonas rurales tienen 2.3x más probabilidad de abandonar en el primer trimestre', severity: 'high' as const },
  { title: 'Mejoras Significativas', description: 'Distrito 02-01 muestra mejora sostenida en asistencia tras implementar programa de incentivos', severity: 'low' as const },
  { title: 'Necesidades de Capacitación', description: 'El 42% de los docentes en Distrito 03-02 requiere formación en nuevas metodologías', severity: 'medium' as const },
  { title: 'Brecha de Género en STEM', description: 'Solo el 31% de las estudiantes opta por carreras técnicas en los politécnicos de la región', severity: 'medium' as const },
];

const tabs = [
  { id: 'inicio', label: 'Inicio', icon: Globe },
  { id: 'distritos', label: 'Distritos', icon: MapPin },
  { id: 'comparativas', label: 'Comparativas', icon: BarChart3 },
  { id: 'indicadores', label: 'Indicadores', icon: Activity },
];

function TabBar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 bg-secondary-100 p-1 rounded-lg w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            active === tab.id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- RegionalDashboard ---------- */
export function RegionalDashboard() {
  const [activeTab, setActiveTab] = useState('inicio');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel Regional</h1>
          <p className="text-muted-foreground">Regional 01 · Santo Domingo</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary-100 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Actualizado hace 3 min
          </span>
          <button className="flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-100 px-3 py-1.5 rounded-full hover:bg-primary-200">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
        </div>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'inicio' && <InicioTab />}
      {activeTab === 'distritos' && <DistritosTab />}
      {activeTab === 'comparativas' && <ComparativasTab />}
      {activeTab === 'indicadores' && <IndicadoresTab />}
    </div>
  );
}

/* ---------- InicioTab ---------- */
export function InicioTab() {
  const { data, isLoading } = useRegionalDashboard();

  if (isLoading) return <LoadingSpinner />;

  const k = data?.kpis;
  const totalSchools = k ? (k.totalSchools ?? mockDistricts.reduce((s, d) => s + d.schools, 0)) : mockDistricts.reduce((s, d) => s + d.schools, 0);
  const totalStudents = k ? k.totalStudents : mockDistricts.reduce((s, d) => s + d.students, 0);
  const totalTeachers = k ? k.activeTeachers : mockDistricts.reduce((s, d) => s + d.teachers, 0);
  const avgGrade = k ? k.averageGrade : mockDistricts.reduce((s, d) => s + d.avgGrade, 0) / mockDistricts.length;
  const avgAttendance = k ? k.attendanceRate : mockDistricts.reduce((s, d) => s + d.attendance, 0) / mockDistricts.length;
  const riskDistricts = mockDistricts.filter((d) => d.dropoutRisk > 10).length;
  const approvalRate = k ? k.approvalRate : mockDistricts.reduce((s, d) => s + d.approvalRate, 0) / mockDistricts.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard label="Distritos" value={mockDistricts.length} icon={<MapPin className="w-6 h-6" />} color="info" />
        <StatsCard label="Centros" value={totalSchools} icon={<Building2 className="w-6 h-6" />} color="primary" subtitle={`${totalTeachers} docentes`} />
        <StatsCard label="Estudiantes" value={totalStudents.toLocaleString()} icon={<Users className="w-6 h-6" />} color="success" />
        <StatsCard label="Rendimiento" value={`${avgGrade.toFixed(1)}%`} icon={<Award className="w-6 h-6" />} color="warning" subtitle={`${approvalRate.toFixed(1)}% aprob.`} />
        <StatsCard label="Asistencia" value={`${avgAttendance.toFixed(1)}%`} icon={<Calendar className="w-6 h-6" />} color="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              Ranking Regional vs Nacional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-primary-50 border border-primary-200">
                <p className="text-3xl font-bold text-primary-700">3º</p>
                <p className="text-xs text-muted-foreground mt-1">Posición Nacional</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-success-50 border border-success-200">
                <p className="text-3xl font-bold text-success-700">82.3%</p>
                <p className="text-xs text-muted-foreground mt-1">Mejor Distrito</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-warning-50 border border-warning-200">
                <p className="text-3xl font-bold text-warning-700">72.6%</p>
                <p className="text-xs text-muted-foreground mt-1">Distrito más bajo</p>
              </div>
            </div>
            <div className="space-y-2">
              {mockDistricts.sort((a, b) => a.rank - b.rank).slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${d.rank <= 3 ? 'bg-success-500' : d.rank <= 5 ? 'bg-primary-500' : 'bg-secondary-400'}`}>
                    {d.rank}
                  </span>
                  <div className="flex-1 text-sm font-medium">{d.name}</div>
                  <div className="text-sm text-muted-foreground">{d.avgGrade.toFixed(1)}%</div>
                  <div className={`flex items-center gap-0.5 text-xs ${d.trend === 'up' ? 'text-success-600' : d.trend === 'down' ? 'text-danger-600' : 'text-muted-foreground'}`}>
                    {d.trend === 'up' && <ArrowUp className="w-3 h-3" />}
                    {d.trend === 'down' && <ArrowDown className="w-3 h-3" />}
                    {d.trend === 'up' ? '+1.2%' : d.trend === 'down' ? '-0.8%' : '0.0%'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Acciones Rápidas</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ver Reportes', icon: FileText, color: 'bg-blue-100 text-blue-600' },
                { label: 'Coordinar Visita', icon: Calendar, color: 'bg-green-100 text-green-600' },
                { label: 'Alertas Masivas', icon: Bell, color: 'bg-purple-100 text-purple-600' },
                { label: 'Estadísticas', icon: BarChart3, color: 'bg-orange-100 text-orange-600' },
                { label: 'Capacitaciones', icon: GraduationCap, color: 'bg-cyan-100 text-cyan-600' },
                { label: 'Directorio', icon: Users, color: 'bg-pink-100 text-pink-600' },
              ].map((action) => (
                <button key={action.label} className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                    <action.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-medium text-center text-muted-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Alertas Regionales</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <AlertBlock icon={<AlertCircle className="w-5 h-5" />} color="danger"
              title={`${riskDistricts} distritos con alto riesgo de deserción`}
              subtitle="Requieren intervención prioritaria" />
            <AlertBlock icon={<TrendingUp className="w-5 h-5" />} color="warning"
              title={`${mockDistricts.filter((d) => d.avgGrade < 75).length} distritos bajo la media regional`}
              subtitle="Rendimiento por debajo del 75%" />
            <AlertBlock icon={<Star className="w-5 h-5" />} color="warning"
              title={`${mockDistricts.filter((d) => d.trend === 'down').length} distritos en declive`}
              subtitle="Tendencia negativa detectada" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- DistritosTab ---------- */
export function DistritosTab() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const sorted = [...mockDistricts].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{mockDistricts.length} distritos educativos en la regional</p>
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
                  <th className="w-10 px-4 py-3 text-center font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Distrito</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Centros</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estudiantes</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Docentes</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Nota</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Asist.</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Aprob.</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Riesgo</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => {
                  const isExpanded = expanded.has(d.id);
                  return (
                    <>
                      <tr key={d.id} className="border-b border-border hover:bg-accent/50 cursor-pointer" onClick={() => toggle(d.id)}>
                        <td className="px-4 py-3 text-center">
                          {isExpanded ? <ChevronUp className="w-4 h-4 inline text-muted-foreground" /> : <ChevronDown className="w-4 h-4 inline text-muted-foreground" />}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-muted-foreground">{d.rank}</td>
                        <td className="px-4 py-3 font-medium">{d.name}</td>
                        <td className="px-4 py-3 text-center">{d.schools}</td>
                        <td className="px-4 py-3 text-center">{d.students.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">{d.teachers}</td>
                        <td className="px-4 py-3 text-center font-semibold">{d.avgGrade.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-center">{d.attendance.toFixed(0)}%</td>
                        <td className="px-4 py-3 text-center">{d.approvalRate.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-center">
                          <span className={d.dropoutRisk > 10 ? 'text-danger-600 font-medium' : 'text-success-600'}>
                            {d.dropoutRisk.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {d.trend === 'up' ? <ArrowUp className="w-4 h-4 text-success-500 inline" /> : d.trend === 'down' ? <ArrowDown className="w-4 h-4 text-danger-500 inline" /> : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${d.id}-expanded`} className="bg-secondary-50/50">
                          <td colSpan={11} className="px-4 py-4">
                            <div className="grid grid-cols-3 gap-6">
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Información General</h4>
                                <div className="space-y-1.5 text-sm">
                                  <p><span className="text-muted-foreground">Mejor centro:</span> {d.topSchool}</p>
                                  <p><span className="text-muted-foreground">Centro con dificultades:</span> {d.bottomSchool}</p>
                                  <p><span className="text-muted-foreground">Relación estudiantes/docente:</span> {(d.students / d.teachers).toFixed(1)}</p>
                                  <p><span className="text-muted-foreground">Promedio de centros:</span> {(d.students / d.schools).toFixed(0)} est/centro</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Rendimiento Visual</h4>
                                <div className="space-y-2">
                                  <div>
                                    <div className="flex justify-between text-xs mb-1"><span>Nota Promedio</span><span>{d.avgGrade.toFixed(1)}%</span></div>
                                    <div className="bg-secondary-200 rounded-full h-2">
                                      <div className="h-full rounded-full bg-primary-500" style={{ width: `${d.avgGrade}%` }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-xs mb-1"><span>Asistencia</span><span>{d.attendance.toFixed(0)}%</span></div>
                                    <div className="bg-secondary-200 rounded-full h-2">
                                      <div className="h-full rounded-full bg-green-500" style={{ width: `${d.attendance}%` }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-xs mb-1"><span>Aprobación</span><span>{d.approvalRate.toFixed(1)}%</span></div>
                                    <div className="bg-secondary-200 rounded-full h-2">
                                      <div className="h-full rounded-full bg-yellow-500" style={{ width: `${d.approvalRate}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recomendaciones</h4>
                                <ul className="space-y-1.5 text-xs text-muted-foreground">
                                  {d.dropoutRisk > 10 && <li className="flex items-start gap-1"><AlertCircle className="w-3 h-3 text-danger-500 mt-0.5 shrink-0" /> Intervenir para reducir deserción escolar</li>}
                                  {d.attendance < 88 && <li className="flex items-start gap-1"><AlertCircle className="w-3 h-3 text-warning-500 mt-0.5 shrink-0" /> Implementar programa de asistencia</li>}
                                  {d.avgGrade < 78 && <li className="flex items-start gap-1"><AlertCircle className="w-3 h-3 text-warning-500 mt-0.5 shrink-0" /> Reforzar plan de nivelación académica</li>}
                                  <li className="flex items-start gap-1"><Lightbulb className="w-3 h-3 text-primary-500 mt-0.5 shrink-0" /> Compartir prácticas del mejor centro</li>
                                </ul>
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

/* ---------- ComparativasTab ---------- */
export function ComparativasTab() {
  const sorted = [...mockDistricts].sort((a, b) => b.avgGrade - a.avgGrade);
  const maxGrade = sorted[0].avgGrade;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              Comparativa de Rendimiento por Distrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sorted.map((d, i) => {
                const pct = (d.avgGrade / maxGrade) * 100;
                return (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className="w-5 text-xs text-muted-foreground text-right">{i + 1}</span>
                    <div className="w-36 truncate text-sm font-medium">{d.name}</div>
                    <div className="flex-1 bg-secondary-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${d.avgGrade >= 80 ? 'bg-green-500' : d.avgGrade >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 text-right">
                      <p className="text-sm font-semibold">{d.avgGrade.toFixed(1)}%</p>
                      <p className="text-[10px] text-muted-foreground">{d.attendance.toFixed(0)}% asist.</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              Ranking de Distritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sorted.map((d, i) => (
                <div key={d.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${i < 3 ? 'bg-success-50 border border-success-200' : 'hover:bg-accent/50'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-secondary-300'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.schools} centros · {d.students.toLocaleString()} est.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{d.avgGrade.toFixed(1)}%</p>
                    <p className={`text-xs ${d.trend === 'up' ? 'text-success-600' : d.trend === 'down' ? 'text-danger-600' : 'text-muted-foreground'}`}>
                      {d.trend === 'up' ? '↑ Subiendo' : d.trend === 'down' ? '↓ Bajando' : '— Estable'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Métricas Comparativas Clave</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricBox label="Mejor Rendimiento" value={`${sorted[0].avgGrade.toFixed(1)}%`} sub={sorted[0].name} trend="up" />
            <MetricBox label="Mayor Asistencia" value={`${Math.max(...mockDistricts.map((d) => d.attendance)).toFixed(0)}%`} sub={sorted.find((d) => d.attendance === Math.max(...mockDistricts.map((d2) => d2.attendance)))?.name || ''} trend="up" />
            <MetricBox label="Brecha de Rendimiento" value={`${(sorted[0].avgGrade - sorted[sorted.length - 1].avgGrade).toFixed(1)} pts`} sub="Entre mejor y peor distrito" />
            <MetricBox label="% Distritos en Mejora" value={`${(mockDistricts.filter((d) => d.trend === 'up').length / mockDistricts.length * 100).toFixed(0)}%`} sub={`${mockDistricts.filter((d) => d.trend === 'up').length} de ${mockDistricts.length}`} trend="up" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- IndicadoresTab ---------- */
export function IndicadoresTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              Indicadores de Calidad Regional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityMetrics.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{m.value}</span>
                      <span className={`text-xs flex items-center gap-0.5 ${m.trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
                        {m.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {m.change}
                      </span>
                    </div>
                  </div>
                  <div className="bg-secondary-200 rounded-full h-2.5">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${parseFloat(m.value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-500" />
              Patrones Detectados por IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiPatterns.map((p, i) => (
                <div key={i} className={`p-3 rounded-lg border ${p.severity === 'high' ? 'bg-danger-50 border-danger-200' : p.severity === 'medium' ? 'bg-warning-50 border-warning-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className={`w-4 h-4 ${p.severity === 'high' ? 'text-danger-600' : p.severity === 'medium' ? 'text-warning-600' : 'text-blue-600'}`} />
                    <span className="text-sm font-semibold">{p.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">{p.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Distribución de Rendimiento por Distrito</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockDistricts.map((d) => (
              <div key={d.id} className="p-4 rounded-lg border border-border text-center">
                <p className="text-sm font-medium mb-2">{d.name}</p>
                <div className={`text-2xl font-bold ${d.avgGrade >= 80 ? 'text-success-600' : d.avgGrade >= 75 ? 'text-warning-600' : 'text-danger-600'}`}>
                  {d.avgGrade.toFixed(1)}%
                </div>
                <div className="mt-2 bg-secondary-100 rounded-full h-2">
                  <div
                    className={`h-full rounded-full ${d.avgGrade >= 80 ? 'bg-success-500' : d.avgGrade >= 75 ? 'bg-warning-500' : 'bg-danger-500'}`}
                    style={{ width: `${(d.avgGrade / maxGrade) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{d.approvalRate.toFixed(1)}% aprob.</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Helpers ---------- */
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

const maxGrade = Math.max(...mockDistricts.map((d) => d.avgGrade));
