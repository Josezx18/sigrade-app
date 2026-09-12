import { useState } from 'react';
import {
  Users, GraduationCap, Award, Calendar, Globe, MapPin, AlertTriangle,
  TrendingUp, ChevronDown, ChevronUp, BarChart3, ArrowUp, ArrowDown,
  AlertCircle, Clock, Download, Search, Filter, Eye, FileText, Lightbulb,
  Activity, BrainCircuit, Target, Zap, Heart, School
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useNationalDashboard } from '../../hooks/api/useAnalytics';

interface RegionData {
  id: string;
  name: string;
  districts: number;
  schools: number;
  students: number;
  teachers: number;
  avgGrade: number;
  attendance: number;
  approvalRate: number;
  dropoutRisk: number;
  trend: 'up' | 'down' | 'stable';
  districtsList: { name: string; schools: number; avgGrade: number }[];
}

const mockRegions: RegionData[] = [
  { id: 'REG-01', name: 'Regional 01 - Santo Domingo', districts: 9, schools: 342, students: 148000, teachers: 6240, avgGrade: 79.2, attendance: 90.5, approvalRate: 81.8, dropoutRisk: 7.2, trend: 'up',
    districtsList: [
      { name: 'Distrito 01-01', schools: 15, avgGrade: 79.5 }, { name: 'Distrito 01-02', schools: 12, avgGrade: 76.2 },
      { name: 'Distrito 01-03', schools: 18, avgGrade: 82.3 }, { name: 'Distrito 01-04', schools: 10, avgGrade: 74.8 },
      { name: 'Distrito 01-05', schools: 14, avgGrade: 81.1 }, { name: 'Distrito 01-06', schools: 8, avgGrade: 72.6 },
      { name: 'Distrito 01-07', schools: 11, avgGrade: 78.4 }, { name: 'Distrito 01-08', schools: 8, avgGrade: 77.9 },
      { name: 'Distrito 01-09', schools: 7, avgGrade: 75.3 },
    ] },
  { id: 'REG-02', name: 'Regional 02 - Santiago', districts: 8, schools: 298, students: 132000, teachers: 5600, avgGrade: 76.8, attendance: 88.2, approvalRate: 78.5, dropoutRisk: 9.8, trend: 'down',
    districtsList: [
      { name: 'Distrito 02-01', schools: 14, avgGrade: 77.2 }, { name: 'Distrito 02-02', schools: 11, avgGrade: 73.5 },
      { name: 'Distrito 02-03', schools: 9, avgGrade: 79.8 }, { name: 'Distrito 02-04', schools: 13, avgGrade: 75.1 },
      { name: 'Distrito 02-05', schools: 10, avgGrade: 80.4 }, { name: 'Distrito 02-06', schools: 8, avgGrade: 72.8 },
      { name: 'Distrito 02-07', schools: 12, avgGrade: 76.0 }, { name: 'Distrito 02-08', schools: 7, avgGrade: 74.6 },
    ] },
  { id: 'REG-03', name: 'Regional 03 - La Vega', districts: 7, schools: 215, students: 98500, teachers: 4120, avgGrade: 81.5, attendance: 92.1, approvalRate: 84.3, dropoutRisk: 5.4, trend: 'up',
    districtsList: [
      { name: 'Distrito 03-01', schools: 12, avgGrade: 82.1 }, { name: 'Distrito 03-02', schools: 9, avgGrade: 79.8 },
      { name: 'Distrito 03-03', schools: 14, avgGrade: 83.5 }, { name: 'Distrito 03-04', schools: 8, avgGrade: 80.2 },
      { name: 'Distrito 03-05', schools: 11, avgGrade: 78.9 }, { name: 'Distrito 03-06', schools: 7, avgGrade: 85.1 },
      { name: 'Distrito 03-07', schools: 10, avgGrade: 77.6 },
    ] },
  { id: 'REG-04', name: 'Regional 04 - San Pedro', districts: 10, schools: 380, students: 172000, teachers: 7240, avgGrade: 74.1, attendance: 85.7, approvalRate: 75.9, dropoutRisk: 14.6, trend: 'down',
    districtsList: [
      { name: 'Distrito 04-01', schools: 13, avgGrade: 75.2 }, { name: 'Distrito 04-02', schools: 10, avgGrade: 72.8 },
      { name: 'Distrito 04-03', schools: 16, avgGrade: 76.4 }, { name: 'Distrito 04-04', schools: 9, avgGrade: 70.5 },
      { name: 'Distrito 04-05', schools: 14, avgGrade: 73.1 }, { name: 'Distrito 04-06', schools: 11, avgGrade: 78.0 },
      { name: 'Distrito 04-07', schools: 8, avgGrade: 69.8 }, { name: 'Distrito 04-08', schools: 12, avgGrade: 74.5 },
      { name: 'Distrito 04-09', schools: 7, avgGrade: 76.2 }, { name: 'Distrito 04-10', schools: 9, avgGrade: 71.3 },
    ] },
  { id: 'REG-05', name: 'Regional 05 - San Cristóbal', districts: 6, schools: 195, students: 84200, teachers: 3540, avgGrade: 83.2, attendance: 93.5, approvalRate: 86.1, dropoutRisk: 4.1, trend: 'up',
    districtsList: [
      { name: 'Distrito 05-01', schools: 11, avgGrade: 84.5 }, { name: 'Distrito 05-02', schools: 8, avgGrade: 81.2 },
      { name: 'Distrito 05-03', schools: 13, avgGrade: 85.8 }, { name: 'Distrito 05-04', schools: 7, avgGrade: 79.6 },
      { name: 'Distrito 05-05', schools: 10, avgGrade: 82.3 }, { name: 'Distrito 05-06', schools: 9, avgGrade: 83.9 },
    ] },
  { id: 'REG-06', name: 'Regional 06 - La Romana', districts: 8, schools: 275, students: 118000, teachers: 4980, avgGrade: 77.3, attendance: 88.9, approvalRate: 79.2, dropoutRisk: 8.9, trend: 'stable',
    districtsList: [
      { name: 'Distrito 06-01', schools: 12, avgGrade: 78.5 }, { name: 'Distrito 06-02', schools: 9, avgGrade: 75.2 },
      { name: 'Distrito 06-03', schools: 14, avgGrade: 80.1 }, { name: 'Distrito 06-04', schools: 8, avgGrade: 73.8 },
      { name: 'Distrito 06-05', schools: 11, avgGrade: 76.4 }, { name: 'Distrito 06-06', schools: 7, avgGrade: 79.0 },
      { name: 'Distrito 06-07', schools: 10, avgGrade: 74.9 }, { name: 'Distrito 06-08', schools: 6, avgGrade: 77.6 },
    ] },
  { id: 'REG-07', name: 'Regional 07 - San Francisco', districts: 5, schools: 168, students: 72500, teachers: 3060, avgGrade: 80.9, attendance: 91.3, approvalRate: 83.4, dropoutRisk: 6.2, trend: 'up',
    districtsList: [
      { name: 'Distrito 07-01', schools: 10, avgGrade: 82.4 }, { name: 'Distrito 07-02', schools: 8, avgGrade: 79.1 },
      { name: 'Distrito 07-03', schools: 12, avgGrade: 81.8 }, { name: 'Distrito 07-04', schools: 7, avgGrade: 78.5 },
      { name: 'Distrito 07-05', schools: 9, avgGrade: 80.2 },
    ] },
  { id: 'REG-08', name: 'Regional 08 - Barahona', districts: 7, schools: 240, students: 105000, teachers: 4420, avgGrade: 75.6, attendance: 86.4, approvalRate: 77.1, dropoutRisk: 12.3, trend: 'down',
    districtsList: [
      { name: 'Distrito 08-01', schools: 11, avgGrade: 76.8 }, { name: 'Distrito 08-02', schools: 9, avgGrade: 73.2 },
      { name: 'Distrito 08-03', schools: 13, avgGrade: 77.5 }, { name: 'Distrito 08-04', schools: 7, avgGrade: 72.1 },
      { name: 'Distrito 08-05', schools: 10, avgGrade: 74.9 }, { name: 'Distrito 08-06', schools: 8, avgGrade: 76.3 },
      { name: 'Distrito 08-07', schools: 6, avgGrade: 71.8 },
    ] },
  { id: 'REG-09', name: 'Regional 09 - Mao', districts: 9, schools: 356, students: 156000, teachers: 6560, avgGrade: 78.4, attendance: 89.1, approvalRate: 80.6, dropoutRisk: 7.8, trend: 'up',
    districtsList: [
      { name: 'Distrito 09-01', schools: 14, avgGrade: 79.5 }, { name: 'Distrito 09-02', schools: 11, avgGrade: 76.8 },
      { name: 'Distrito 09-03', schools: 16, avgGrade: 80.2 }, { name: 'Distrito 09-04', schools: 9, avgGrade: 75.4 },
      { name: 'Distrito 09-05', schools: 13, avgGrade: 78.1 }, { name: 'Distrito 09-06', schools: 8, avgGrade: 82.0 },
      { name: 'Distrito 09-07', schools: 10, avgGrade: 77.3 }, { name: 'Distrito 09-08', schools: 7, avgGrade: 79.8 },
      { name: 'Distrito 09-09', schools: 12, avgGrade: 76.1 },
    ] },
  { id: 'REG-10', name: 'Regional 10 - Higüey', districts: 6, schools: 188, students: 81200, teachers: 3420, avgGrade: 82.7, attendance: 92.8, approvalRate: 85.5, dropoutRisk: 4.8, trend: 'up',
    districtsList: [
      { name: 'Distrito 10-01', schools: 10, avgGrade: 83.8 }, { name: 'Distrito 10-02', schools: 8, avgGrade: 81.2 },
      { name: 'Distrito 10-03', schools: 12, avgGrade: 84.5 }, { name: 'Distrito 10-04', schools: 7, avgGrade: 79.8 },
      { name: 'Distrito 10-05', schools: 9, avgGrade: 82.1 }, { name: 'Distrito 10-06', schools: 6, avgGrade: 80.9 },
    ] },
];

const nationalAlerts = [
  { type: 'danger' as const, title: '4 regionales en alerta roja', description: 'Rendimiento por debajo del 75% y deserción superior al 12%' },
  { type: 'danger' as const, title: '2.1M estudiantes monitoreados', description: 'Tasa de deserción nacional estimada en 8.7%, superior al año anterior' },
  { type: 'warning' as const, title: 'Brecha rural-urbana se amplía', description: 'Las escuelas rurales tienen 18.4% menos rendimiento que las urbanas' },
  { type: 'warning' as const, title: 'Déficit docente en 3 regionales', description: 'Regional 04, 06 y 08 requieren 420 docentes adicionales' },
  { type: 'info' as const, title: 'Programa de incentivos muestra resultados', description: 'Regionales con incentivos docentes mejoraron 4.2% en rendimiento' },
];

const iaPatterns = [
  { icon: Zap, color: 'text-red-500 bg-red-50', title: 'Centros de Inflación de Bajo Rendimiento', description: 'Se identificaron 12 clusters geográficos donde el rendimiento es consistentemente bajo (<70%). Concentrados en regionales 04, 06 y 08. Se recomienda intervención focalizada con recursos adicionales.' },
  { icon: TrendingUp, color: 'text-orange-500 bg-orange-50', title: 'Distritos de Alto Riesgo de Deserción', description: '18 distritos superan el umbral del 15% de riesgo de deserción. Variables predictoras: asistencia <80%, ratio estudiantes/docente >35, y falta de transporte escolar.' },
  { icon: Lightbulb, color: 'text-green-500 bg-green-50', title: 'Mejores Prácticas Identificadas', description: 'Regional 05 (San Cristóbal) y Regional 10 (Higüey) muestran mejoras sostenidas. Factores comunes: programa de mentoría docente, jornada extendida y participación familiar activa.' },
  { icon: Heart, color: 'text-blue-500 bg-blue-50', title: 'Indicadores de Riesgo de Deserción Temprana', description: 'El modelo predictivo señala que estudiantes de 1er ciclo con 2 o más repitencias tienen 73% de probabilidad de desertar antes de 8vo grado. 15,200 estudiantes identificados.' },
  { icon: GraduationCap, color: 'text-purple-500 bg-purple-50', title: 'Necesidades de Capacitación Docente', description: 'El 38% de los docentes a nivel nacional requiere formación en metodologías activas. Mayor necesidad: matemáticas (42%), ciencias (39%) y educación inclusiva (35%).' },
];

const tabs = [
  { id: 'inicio', label: 'Inicio', icon: Globe },
  { id: 'regiones', label: 'Regiones', icon: MapPin },
  { id: 'indicadores', label: 'Indicadores Nacionales', icon: Activity },
  { id: 'ia', label: 'IA Nacional', icon: BrainCircuit },
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

function getGradeColor(value: number): string {
  if (value >= 82) return 'text-green-600';
  if (value >= 78) return 'text-yellow-600';
  if (value >= 74) return 'text-orange-600';
  return 'text-red-600';
}

function getGradeBg(value: number): string {
  if (value >= 82) return 'bg-green-500';
  if (value >= 78) return 'bg-yellow-500';
  if (value >= 74) return 'bg-orange-500';
  return 'bg-red-500';
}

/* ---------- NationalDashboard ---------- */
export function NationalDashboard() {
  const [activeTab, setActiveTab] = useState('inicio');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel Nacional</h1>
          <p className="text-muted-foreground">MINERD · Sistema de Gestión Regional de Datos Educativos</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary-100 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Actualizado hace 8 min
          </span>
          <button className="flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-100 px-3 py-1.5 rounded-full hover:bg-primary-200">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
        </div>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'inicio' && <InicioTab />}
      {activeTab === 'regiones' && <RegionesTab />}
      {activeTab === 'indicadores' && <IndicadoresNacionalesTab />}
      {activeTab === 'ia' && <IaNacionalTab />}
    </div>
  );
}

/* ---------- InicioTab ---------- */
export function InicioTab() {
  const { data, isLoading, error } = useNationalDashboard();

  if (isLoading) return <LoadingSpinner />;
  const k = data?.kpis ?? (error ? undefined : undefined);
  const totalRegions = k?.totalRegional ?? mockRegions.length;
  const totalDistricts = k?.totalDistricts ?? mockRegions.reduce((s, r) => s + r.districts, 0);
  const totalSchools = k?.totalSchools ?? mockRegions.reduce((s, r) => s + r.schools, 0);
  const totalStudents = k?.totalStudents ?? mockRegions.reduce((s, r) => s + r.students, 0);
  const totalTeachers = k?.activeTeachers ?? mockRegions.reduce((s, r) => s + r.teachers, 0);
  const avgGrade = k ? k.averageGrade : mockRegions.reduce((s, r) => s + r.avgGrade, 0) / mockRegions.length;
  const avgAttendance = k ? k.attendanceRate : mockRegions.reduce((s, r) => s + r.attendance, 0) / mockRegions.length;
  const riskRegions = mockRegions.filter((r) => r.dropoutRisk > 10).length;
  const approvalRate = k ? k.approvalRate : mockRegions.reduce((s, r) => s + r.approvalRate, 0) / mockRegions.length;
  const topRegion = [...mockRegions].sort((a, b) => b.avgGrade - a.avgGrade)[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatsCard label="Regionales" value={totalRegions} icon={<Globe className="w-6 h-6" />} color="info" />
        <StatsCard label="Distritos" value={totalDistricts} icon={<MapPin className="w-6 h-6" />} color="primary" />
        <StatsCard label="Centros" value={totalSchools.toLocaleString()} icon={<School className="w-6 h-6" />} color="success" />
        <StatsCard label="Estudiantes" value={totalStudents.toLocaleString()} icon={<Users className="w-6 h-6" />} color="primary" subtitle={`${(totalTeachers / 1000).toFixed(1)}K docentes`} />
        <StatsCard label="Rendimiento" value={`${avgGrade.toFixed(1)}%`} icon={<Award className="w-6 h-6" />} color="warning" subtitle={`${approvalRate.toFixed(1)}% aprob.`} />
        <StatsCard label="Asistencia" value={`${avgAttendance.toFixed(1)}%`} icon={<Calendar className="w-6 h-6" />} color="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              Rendimiento por Regional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {[...mockRegions].sort((a, b) => b.avgGrade - a.avgGrade).map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="w-40 truncate text-sm font-medium">{r.name}</div>
                  <div className="flex-1 bg-secondary-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getGradeBg(r.avgGrade)} transition-all`}
                      style={{ width: `${(r.avgGrade / 100) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-semibold">{r.avgGrade.toFixed(1)}%</div>
                  <div className="w-8 text-center">
                    {r.trend === 'up' ? <ArrowUp className="w-3.5 h-3.5 inline text-green-500" /> : r.trend === 'down' ? <ArrowDown className="w-3.5 h-3.5 inline text-red-500" /> : <span className="text-muted-foreground text-xs">—</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-danger-500" /> Alertas Nacionales</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nationalAlerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${a.type === 'danger' ? 'bg-danger-50' : a.type === 'warning' ? 'bg-warning-50' : 'bg-blue-50'}`}>
                  <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${a.type === 'danger' ? 'text-danger-600' : a.type === 'warning' ? 'text-warning-600' : 'text-blue-600'}`} />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Mejor Regional</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8" />
              </div>
              <p className="font-semibold text-lg">{topRegion.name}</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{topRegion.avgGrade.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground mt-1">{topRegion.schools.toLocaleString()} centros · {topRegion.districts} distritos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Regional con Mayor Deserción</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <p className="font-semibold text-lg">{[...mockRegions].sort((a, b) => b.dropoutRisk - a.dropoutRisk)[0].name}</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{[...mockRegions].sort((a, b) => b.dropoutRisk - a.dropoutRisk)[0].dropoutRisk.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground mt-1">{riskRegions} regionales superan el 10% de riesgo</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resumen Nacional</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Total regionales</span>
                <span className="text-sm font-semibold">{totalRegions}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Total distritos</span>
                <span className="text-sm font-semibold">{totalDistricts}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Total centros</span>
                <span className="text-sm font-semibold">{totalSchools.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Estudiantes por docente</span>
                <span className="text-sm font-semibold">{totalStudents > 0 && totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Regional más poblada</span>
                <span className="text-sm font-semibold">{[...mockRegions].sort((a, b) => b.students - a.students)[0].name.split(' - ')[1]}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------- RegionesTab ---------- */
export function RegionesTab() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const sorted = [...mockRegions].sort((a, b) => b.avgGrade - a.avgGrade);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{mockRegions.length} regionales educativas a nivel nacional</p>
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
                  <th className="w-8 px-4 py-3 text-center font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Regional</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Distritos</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Centros</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estudiantes</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Docentes</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Nota</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Asist.</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Deserción</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, index) => {
                  const isExpanded = expanded.has(r.id);
                  return (
                    <>
                      <tr key={r.id} className="border-b border-border hover:bg-accent/50 cursor-pointer" onClick={() => toggle(r.id)}>
                        <td className="px-4 py-3 text-center">
                          {isExpanded ? <ChevronUp className="w-4 h-4 inline text-muted-foreground" /> : <ChevronDown className="w-4 h-4 inline text-muted-foreground" />}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-center">{r.districts}</td>
                        <td className="px-4 py-3 text-center">{r.schools.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">{(r.students / 1000).toFixed(1)}K</td>
                        <td className="px-4 py-3 text-center">{(r.teachers / 1000).toFixed(1)}K</td>
                        <td className={`px-4 py-3 text-center font-semibold ${getGradeColor(r.avgGrade)}`}>{r.avgGrade.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-center">{r.attendance.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-center">
                          <span className={r.dropoutRisk > 10 ? 'text-danger-600 font-medium' : r.dropoutRisk > 7 ? 'text-warning-600' : 'text-success-600'}>
                            {r.dropoutRisk.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.trend === 'up' ? <ArrowUp className="w-4 h-4 inline text-success-500" /> : r.trend === 'down' ? <ArrowDown className="w-4 h-4 inline text-danger-500" /> : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${r.id}-expanded`} className="bg-secondary-50/50">
                          <td colSpan={11} className="px-4 py-4">
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Distritos de {r.name.split(' - ')[1]}</h4>
                              <div className="grid grid-cols-3 gap-3">
                                {r.districtsList.map((d, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-border text-sm">
                                    <span className="text-muted-foreground">{d.name}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-muted-foreground">{d.schools} centros</span>
                                      <span className={`font-semibold text-xs ${getGradeColor(d.avgGrade)}`}>{d.avgGrade.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-primary-100 text-primary-700 hover:bg-primary-200">
                                <Eye className="w-3.5 h-3.5" /> Ver Detalle
                              </button>
                              <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-secondary-100 text-secondary-700 hover:bg-secondary-200">
                                <FileText className="w-3.5 h-3.5" /> Reporte Completo
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

/* ---------- IndicadoresNacionalesTab ---------- */
export function IndicadoresNacionalesTab() {
  const sorted = [...mockRegions].sort((a, b) => b.avgGrade - a.avgGrade);
  const maxStudents = Math.max(...mockRegions.map((r) => r.students));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Mapa de Calor - Rendimiento por Regional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {sorted.map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-xl border text-center transition-all hover:scale-105 ${
                  r.avgGrade >= 82 ? 'bg-green-50 border-green-300' :
                  r.avgGrade >= 78 ? 'bg-yellow-50 border-yellow-300' :
                  r.avgGrade >= 74 ? 'bg-orange-50 border-orange-300' :
                  'bg-red-50 border-red-300'
                }`}
              >
                <p className="text-xs font-medium mb-1 truncate">{r.name.split(' - ')[1]}</p>
                <p className={`text-2xl font-bold ${getGradeColor(r.avgGrade)}`}>{r.avgGrade.toFixed(1)}%</p>
                <div className="mt-2 bg-white/60 rounded-full h-1.5">
                  <div className={`h-full rounded-full ${getGradeBg(r.avgGrade)}`} style={{ width: `${(r.avgGrade / 100) * 100}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{r.schools.toLocaleString()} centros</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Tendencias Nacionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Rendimiento en mejora</span>
                </div>
                <span className="text-sm font-bold text-green-600">{mockRegions.filter((r) => r.trend === 'up').length} regionales</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">Rendimiento en declive</span>
                </div>
                <span className="text-sm font-bold text-red-600">{mockRegions.filter((r) => r.trend === 'down').length} regionales</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground">—</span>
                  <span className="text-sm font-medium">Rendimiento estable</span>
                </div>
                <span className="text-sm font-bold">{mockRegions.filter((r) => r.trend === 'stable').length} regionales</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              Comparativa de Indicadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Promedio Nacional', value: `${(mockRegions.reduce((s, r) => s + r.avgGrade, 0) / mockRegions.length).toFixed(1)}%`, detail: '78.6% meta MINERD' },
                { label: 'Mejor Rendimiento', value: `${Math.max(...mockRegions.map((r) => r.avgGrade)).toFixed(1)}%`, detail: sorted[0].name },
                { label: 'Peor Rendimiento', value: `${Math.min(...mockRegions.map((r) => r.avgGrade)).toFixed(1)}%`, detail: sorted[sorted.length - 1].name },
                { label: 'Asistencia Promedio', value: `${(mockRegions.reduce((s, r) => s + r.attendance, 0) / mockRegions.length).toFixed(1)}%` },
                { label: 'Deserción Promedio', value: `${(mockRegions.reduce((s, r) => s + r.dropoutRisk, 0) / mockRegions.length).toFixed(1)}%`, detail: `${mockRegions.filter((r) => r.dropoutRisk > 10).length} regionales en riesgo` },
                { label: 'Brecha Máxima', value: `${(Math.max(...mockRegions.map((r) => r.avgGrade)) - Math.min(...mockRegions.map((r) => r.avgGrade))).toFixed(1)} pts`, detail: 'Entre mejor y peor regional' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{item.value}</span>
                    {item.detail && <p className="text-[10px] text-muted-foreground">{item.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Distribución de Población Estudiantil</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {sorted.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="w-36 truncate text-sm font-medium">{r.name.split(' - ')[1]}</div>
                <div className="flex-1 bg-secondary-100 rounded-full h-5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${(r.students / maxStudents) * 100}%` }} />
                </div>
                <div className="w-20 text-right">
                  <p className="text-sm font-semibold">{(r.students / 1000).toFixed(1)}K</p>
                  <p className="text-[10px] text-muted-foreground">{r.schools} centros</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- IaNacionalTab ---------- */
export function IaNacionalTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-500" />
            Patrones Auto-Detectados por IA
          </CardTitle>
          <p className="text-sm text-muted-foreground">Análisis basado en machine learning sobre datos históricos del sistema educativo nacional. Actualizado cada 24 horas.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {iaPatterns.map((p, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${p.color}`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{p.title}</h3>
                    <Badge variant={i < 2 ? 'danger' : i < 3 ? 'warning' : 'info'}>
                      {i < 2 ? 'Alta prioridad' : i < 3 ? 'Media' : 'Informativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Recomendaciones Generadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                'Asignar recursos adicionales a los 12 clusters de bajo rendimiento identificados',
                'Implementar programa de transporte escolar en distritos con deserción >15%',
                'Expandir el programa de mentoría docente de Regional 05 a otras regionales',
                'Establecer alerta temprana para estudiantes con 2+ repitencias en 1er ciclo',
                'Desarrollar plan de capacitación masiva en matemáticas y ciencias',
              ].map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-primary-50 border border-primary-200">
                  <Lightbulb className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-primary-900">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              Métricas del Modelo Predictivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-2xl font-bold text-green-600">87.3%</p>
                  <p className="text-xs text-muted-foreground mt-1">Precisión predictiva</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">15,200</p>
                  <p className="text-xs text-muted-foreground mt-1">Estudiantes en riesgo</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Variables analizadas</span>
                  <span className="font-semibold">42 factores</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Período de análisis</span>
                  <span className="font-semibold">Últimos 3 años</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frecuencia de actualización</span>
                  <span className="font-semibold">Cada 24 horas</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cobertura</span>
                  <span className="font-semibold">100% regionales</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Alertas activas</span>
                  <span className="font-semibold">{iaPatterns.filter((_, i) => i < 2).length} críticas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


