import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Calendar, Filter, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { useExportCsv, useExportXlsx, useExportPdf } from '../../hooks/api/useExport';

type ExportFormat = 'xlsx' | 'pdf';
type ExportStatus = 'completed' | 'processing' | 'failed';
type PlanningStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
type AttendanceGroupBy = 'student' | 'date' | 'subject';
type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

interface RecentExport {
  id: string;
  date: string;
  type: string;
  format: ExportFormat;
  status: ExportStatus;
}

interface ScheduledExport {
  id: string;
  reportType: string;
  frequency: ScheduleFrequency;
  nextRun: string;
  active: boolean;
}

interface Curso { id: string; nombre: string; }
interface Asignatura { id: string; nombre: string; }
interface Periodo { id: string; nombre: string; }
interface Docente { id: string; nombre: string; }

const cursosMock: Curso[] = [
  { id: '1', nombre: '1° Básico A' },
  { id: '2', nombre: '2° Básico B' },
  { id: '3', nombre: '3° Medio C' },
  { id: '4', nombre: '4° Medio A' },
];

const asignaturasMock: Asignatura[] = [
  { id: '1', nombre: 'Matemáticas' },
  { id: '2', nombre: 'Lenguaje' },
  { id: '3', nombre: 'Ciencias' },
  { id: '4', nombre: 'Historia' },
  { id: '5', nombre: 'Inglés' },
];

const periodosMock: Periodo[] = [
  { id: '1', nombre: 'Semestre 1 - 2025' },
  { id: '2', nombre: 'Semestre 2 - 2025' },
  { id: '3', nombre: 'Semestre 1 - 2026' },
];

const docentesMock: Docente[] = [
  { id: '1', nombre: 'María González' },
  { id: '2', nombre: 'Carlos Muñoz' },
  { id: '3', nombre: 'Ana Soto' },
  { id: '4', nombre: 'Pedro Ramírez' },
];

const recentExportsMock: RecentExport[] = [
  { id: '1', date: '2026-07-08 14:30', type: 'Calificaciones', format: 'xlsx', status: 'completed' },
  { id: '2', date: '2026-07-08 10:15', type: 'Asistencia', format: 'pdf', status: 'completed' },
  { id: '3', date: '2026-07-07 16:45', type: 'Planificaciones', format: 'xlsx', status: 'processing' },
  { id: '4', date: '2026-07-07 09:00', type: 'Reportes', format: 'pdf', status: 'failed' },
];

const scheduledExportsMock: ScheduledExport[] = [
  { id: '1', reportType: 'Rendimiento General', frequency: 'weekly', nextRun: '2026-07-13', active: true },
  { id: '2', reportType: 'Asistencia General', frequency: 'daily', nextRun: '2026-07-11', active: true },
  { id: '3', reportType: 'Alertas y Casos', frequency: 'monthly', nextRun: '2026-08-01', active: false },
];

const gradesPreviewMock = [
  { estudiante: 'Juan Pérez', asignatura: 'Matemáticas', nota: 92, periodo: 'S1-2025' },
  { estudiante: 'María Soto', asignatura: 'Lenguaje', nota: 78, periodo: 'S1-2025' },
  { estudiante: 'Pedro Díaz', asignatura: 'Ciencias', nota: 85, periodo: 'S1-2025' },
  { estudiante: 'Ana Muñoz', asignatura: 'Historia', nota: 65, periodo: 'S1-2025' },
  { estudiante: 'Luis Rojas', asignatura: 'Inglés', nota: 90, periodo: 'S1-2025' },
];

const attendancePreviewMock = [
  { estudiante: 'Juan Pérez', fecha: '2026-07-01', presente: true },
  { estudiante: 'María Soto', fecha: '2026-07-01', presente: true },
  { estudiante: 'Pedro Díaz', fecha: '2026-07-01', presente: false },
  { estudiante: 'Ana Muñoz', fecha: '2026-07-01', presente: true },
  { estudiante: 'Luis Rojas', fecha: '2026-07-01', presente: false },
];

const planningPreviewMock = [
  { docente: 'María González', curso: '1° Básico A', asignatura: 'Matemáticas', estado: 'APPROVED' as PlanningStatus },
  { docente: 'Carlos Muñoz', curso: '2° Básico B', asignatura: 'Lenguaje', estado: 'SUBMITTED' as PlanningStatus },
  { docente: 'Ana Soto', curso: '3° Medio C', asignatura: 'Ciencias', estado: 'DRAFT' as PlanningStatus },
  { docente: 'Pedro Ramírez', curso: '4° Medio A', asignatura: 'Historia', estado: 'REJECTED' as PlanningStatus },
  { docente: 'María González', curso: '1° Básico A', asignatura: 'Ciencias', estado: 'APPROVED' as PlanningStatus },
];

const statusBadge = (status: ExportStatus) => {
  const map: Record<ExportStatus, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
    completed: { variant: 'success', label: 'Completado' },
    processing: { variant: 'warning', label: 'Procesando' },
    failed: { variant: 'danger', label: 'Fallido' },
  };
  return map[status];
};

const formatLabel: Record<ExportFormat, string> = {
  xlsx: 'Excel (.xlsx)',
  pdf: 'PDF',
};

function PreviewTable({ headers, rows }: { headers: string[]; rows: Record<string, string | number | boolean>[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-secondary-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary-50 border-b border-secondary-200">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-medium text-secondary-600 text-xs uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-secondary-100 last:border-0 hover:bg-secondary-50/50">
              {headers.map((h) => (
                <td key={h} className="px-4 py-2.5 text-secondary-700">
                  {String(row[h] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentExports({ exports: list }: { exports: RecentExport[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-secondary-500" />
          Exportaciones Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {list.map((exp) => {
            const badge = statusBadge(exp.status);
            return (
              <div key={exp.id} className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0">
                <div className="flex items-center gap-3">
                  {exp.format === 'xlsx' ? (
                    <FileSpreadsheet className="h-5 w-5 text-success-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-danger-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-secondary-800">{exp.type}</p>
                    <p className="text-xs text-secondary-500">{exp.date} &middot; {formatLabel[exp.format]}</p>
                  </div>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function useExportAction() {
  const exportCsv = useExportCsv();
  const exportXlsx = useExportXlsx();
  const exportPdf = useExportPdf();
  return { exportCsv, exportXlsx, exportPdf };
}

export function CalificacionesTab() {
  const [curso, setCurso] = useState('');
  const [asignatura, setAsignatura] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [estudiante, setEstudiante] = useState('');
  const [incluirDetalles, setIncluirDetalles] = useState(true);
  const [incluirPromedios, setIncluirPromedios] = useState(false);
  const [formato, setFormato] = useState<ExportFormat>('xlsx');
  const { exportXlsx, exportPdf, exportCsv } = useExportAction();

  const exportMutation = formato === 'pdf' ? exportPdf : formato === 'xlsx' ? exportXlsx : exportCsv;

  const handleExport = () => {
    exportMutation.mutate({
      data: gradesPreviewMock as unknown as Record<string, unknown>[],
      filename: 'calificaciones',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-secondary-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Curso</label>
              <Select value={curso} onValueChange={setCurso}>
                <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                <SelectContent>
                  {cursosMock.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Asignatura</label>
              <Select value={asignatura} onValueChange={setAsignatura}>
                <SelectTrigger><SelectValue placeholder="Seleccionar asignatura" /></SelectTrigger>
                <SelectContent>
                  {asignaturasMock.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger><SelectValue placeholder="Seleccionar período" /></SelectTrigger>
                <SelectContent>
                  {periodosMock.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Estudiante (opcional)</label>
              <Input
                placeholder="Buscar estudiante..."
                value={estudiante}
                onChange={(e) => setEstudiante(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opciones de Exportación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-secondary-700 cursor-pointer">
              <input
                type="checkbox"
                checked={incluirDetalles}
                onChange={(e) => setIncluirDetalles(e.target.checked)}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              Incluir detalles
            </label>
            <label className="flex items-center gap-2 text-sm text-secondary-700 cursor-pointer">
              <input
                type="checkbox"
                checked={incluirPromedios}
                onChange={(e) => setIncluirPromedios(e.target.checked)}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              Incluir promedios
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary-700">Formato:</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={formato === 'xlsx' ? 'primary' : 'outline'}
                  onClick={() => setFormato('xlsx')}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx)
                </Button>
                <Button
                  size="sm"
                  variant={formato === 'pdf' ? 'primary' : 'outline'}
                  onClick={() => setFormato('pdf')}
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-secondary-500" />
            Vista Previa (primeros 5 registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PreviewTable
            headers={['estudiante', 'asignatura', 'nota', 'periodo']}
            rows={gradesPreviewMock}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={handleExport} disabled={exportMutation.isPending || !curso || !asignatura || !periodo} isLoading={exportMutation.isPending}>
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      <RecentExports exports={recentExportsMock} />
    </div>
  );
}

export function AsistenciaTab() {
  const [curso, setCurso] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estudiante, setEstudiante] = useState('');
  const [agruparPor, setAgruparPor] = useState<AttendanceGroupBy>('student');
  const [incluirEstadisticas, setIncluirEstadisticas] = useState(true);
  const [formato, setFormato] = useState<ExportFormat>('xlsx');
  const { exportXlsx, exportPdf, exportCsv } = useExportAction();

  const exportMutation = formato === 'pdf' ? exportPdf : formato === 'xlsx' ? exportXlsx : exportCsv;

  const handleExport = () => {
    exportMutation.mutate({
      data: attendancePreviewMock as unknown as Record<string, unknown>[],
      filename: 'asistencia',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-secondary-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Curso</label>
              <Select value={curso} onValueChange={setCurso}>
                <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                <SelectContent>
                  {cursosMock.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Desde</label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Hasta</label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Estudiante (opcional)</label>
              <Input
                placeholder="Buscar estudiante..."
                value={estudiante}
                onChange={(e) => setEstudiante(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opciones de Exportación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary-700">Agrupar por:</span>
              <Select value={agruparPor} onValueChange={(v) => setAgruparPor(v as AttendanceGroupBy)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Estudiante</SelectItem>
                  <SelectItem value="date">Fecha</SelectItem>
                  <SelectItem value="subject">Asignatura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-secondary-700 cursor-pointer">
              <input
                type="checkbox"
                checked={incluirEstadisticas}
                onChange={(e) => setIncluirEstadisticas(e.target.checked)}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              Incluir estadísticas
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary-700">Formato:</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={formato === 'xlsx' ? 'primary' : 'outline'}
                  onClick={() => setFormato('xlsx')}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant={formato === 'pdf' ? 'primary' : 'outline'}
                  onClick={() => setFormato('pdf')}
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-secondary-500" />
            Vista Previa (primeros 5 registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PreviewTable
            headers={['estudiante', 'fecha', 'presente']}
            rows={attendancePreviewMock}
          />
        </CardContent>
      </Card>

      <Button onClick={handleExport} disabled={exportMutation.isPending || !curso} isLoading={exportMutation.isPending}>
        <Download className="h-4 w-4" />
        Exportar
      </Button>

      <RecentExports exports={recentExportsMock} />
    </div>
  );
}

export function PlanificacionesTab() {
  const [docente, setDocente] = useState('');
  const [curso, setCurso] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [estado, setEstado] = useState<PlanningStatus | ''>('');
  const [formato, setFormato] = useState<ExportFormat>('xlsx');
  const { exportXlsx, exportPdf, exportCsv } = useExportAction();

  const exportMutation = formato === 'pdf' ? exportPdf : formato === 'xlsx' ? exportXlsx : exportCsv;

  const handleExport = () => {
    exportMutation.mutate({
      data: planningPreviewMock as unknown as Record<string, unknown>[],
      filename: 'planificaciones',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-secondary-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Docente</label>
              <Select value={docente} onValueChange={setDocente}>
                <SelectTrigger><SelectValue placeholder="Seleccionar docente" /></SelectTrigger>
                <SelectContent>
                  {docentesMock.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Curso</label>
              <Select value={curso} onValueChange={setCurso}>
                <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                <SelectContent>
                  {cursosMock.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger><SelectValue placeholder="Seleccionar período" /></SelectTrigger>
                <SelectContent>
                  {periodosMock.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Estado</label>
              <Select value={estado} onValueChange={(v) => setEstado(v as PlanningStatus | '')}>
                <SelectTrigger><SelectValue placeholder="Todos los estados" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="SUBMITTED">Enviado</SelectItem>
                  <SelectItem value="APPROVED">Aprobado</SelectItem>
                  <SelectItem value="REJECTED">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opciones de Exportación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary-700">Formato:</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={formato === 'xlsx' ? 'primary' : 'outline'}
                onClick={() => setFormato('xlsx')}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                size="sm"
                variant={formato === 'pdf' ? 'primary' : 'outline'}
                onClick={() => setFormato('pdf')}
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-secondary-500" />
            Vista Previa (primeros 5 registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PreviewTable
            headers={['docente', 'curso', 'asignatura', 'estado']}
            rows={planningPreviewMock}
          />
        </CardContent>
      </Card>

      <Button onClick={handleExport} disabled={exportMutation.isPending} isLoading={exportMutation.isPending}>
        <Download className="h-4 w-4" />
        Exportar
      </Button>

      <RecentExports exports={recentExportsMock} />
    </div>
  );
}

export function ReportesTab() {
  const [selectedReport, setSelectedReport] = useState('');
  const [curso, setCurso] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [docente, setDocente] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleFreq, setScheduleFreq] = useState<ScheduleFrequency>('weekly');
  const { exportPdf } = useExportAction();

  const exportMutation = exportPdf;

  const reportTypes = [
    { id: 'rendimiento', nombre: 'Rendimiento General', desc: 'Promedios, aprobación y reprobación por curso y asignatura.' },
    { id: 'asistencia', nombre: 'Asistencia General', desc: 'Porcentajes de asistencia por curso y período.' },
    { id: 'planificaciones', nombre: 'Planificaciones por Docente', desc: 'Estado de planificaciones agrupadas por docente.' },
    { id: 'alertas', nombre: 'Alertas y Casos', desc: 'Alertas de riesgo y casos activos en consejería.' },
    { id: 'estudiantes', nombre: 'Listado de Estudiantes', desc: 'Datos generales de estudiantes por curso.' },
  ];

  const reportData: Record<string, unknown>[] = (() => {
    switch (selectedReport) {
      case 'rendimiento':
      case 'estudiantes':
        return gradesPreviewMock as unknown as Record<string, unknown>[];
      case 'asistencia':
        return attendancePreviewMock as unknown as Record<string, unknown>[];
      case 'planificaciones':
        return planningPreviewMock as unknown as Record<string, unknown>[];
      case 'alertas':
      default:
        return [];
    }
  })();

  const handleExport = () => {
    exportMutation.mutate({
      data: reportData,
      filename: selectedReport || 'reporte',
    });
  };

  const handleSchedule = () => {
    setScheduleOpen(false);
  };

  const reportFilters = () => {
    switch (selectedReport) {
      case 'rendimiento':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Curso</label>
              <Select value={curso} onValueChange={setCurso}>
                <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                <SelectContent>
                  {cursosMock.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger><SelectValue placeholder="Seleccionar período" /></SelectTrigger>
                <SelectContent>
                  {periodosMock.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'asistencia':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Curso</label>
              <Select value={curso} onValueChange={setCurso}>
                <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                <SelectContent>
                  {cursosMock.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger><SelectValue placeholder="Seleccionar período" /></SelectTrigger>
                <SelectContent>
                  {periodosMock.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'planificaciones':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Docente</label>
              <Select value={docente} onValueChange={setDocente}>
                <SelectTrigger><SelectValue placeholder="Seleccionar docente" /></SelectTrigger>
                <SelectContent>
                  {docentesMock.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger><SelectValue placeholder="Seleccionar período" /></SelectTrigger>
                <SelectContent>
                  {periodosMock.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'alertas':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Curso</label>
              <Select value={curso} onValueChange={setCurso}>
                <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                <SelectContent>
                  {cursosMock.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary-700">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger><SelectValue placeholder="Seleccionar período" /></SelectTrigger>
                <SelectContent>
                  {periodosMock.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'estudiantes':
        return (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary-700">Curso</label>
            <Select value={curso} onValueChange={setCurso}>
              <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
              <SelectContent>
                {cursosMock.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return <p className="text-sm text-secondary-500">Selecciona un tipo de reporte para ver sus filtros.</p>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportTypes.map((rt) => (
              <button
                key={rt.id}
                type="button"
                onClick={() => setSelectedReport(rt.id)}
                className={`text-left p-4 rounded-lg border transition-all ${
                  selectedReport === rt.id
                    ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50'
                    : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                }`}
              >
                <p className="text-sm font-medium text-secondary-800">{rt.nombre}</p>
                <p className="text-xs text-secondary-500 mt-1">{rt.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedReport && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4 text-secondary-500" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportFilters()}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleExport} disabled={exportMutation.isPending} isLoading={exportMutation.isPending}>
              <Download className="h-4 w-4" />
              Generar y Exportar
            </Button>
            <Button variant="outline" onClick={() => setScheduleOpen(!scheduleOpen)}>
              <Calendar className="h-4 w-4" />
              Programar exportación
            </Button>
          </div>

          {scheduleOpen && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-secondary-500" />
                  Programar Exportación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">Frecuencia</label>
                    <Select value={scheduleFreq} onValueChange={(v) => setScheduleFreq(v as ScheduleFrequency)}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diaria</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSchedule}>
                    <Calendar className="h-4 w-4" />
                    Guardar Programación
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-secondary-500" />
                Exportaciones Programadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduledExportsMock.map((se) => (
                  <div key={se.id} className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-secondary-400" />
                      <div>
                        <p className="text-sm font-medium text-secondary-800">{se.reportType}</p>
                        <p className="text-xs text-secondary-500">
                          {se.frequency === 'daily' ? 'Diaria' : se.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
                          {' · '}Próxima: {se.nextRun}
                        </p>
                      </div>
                    </div>
                    <Badge variant={se.active ? 'success' : 'secondary'}>
                      {se.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <RecentExports exports={recentExportsMock} />
    </div>
  );
}

const TABS = [
  { id: 'calificaciones', label: 'Calificaciones' },
  { id: 'asistencia', label: 'Asistencia' },
  { id: 'planificaciones', label: 'Planificaciones' },
  { id: 'reportes', label: 'Reportes' },
];

export default function ExportData() {
  const [activeTab, setActiveTab] = useState('calificaciones');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Exportar Datos</h1>
          <p className="text-sm text-secondary-500 mt-1">
            Exporta calificaciones, asistencia, planificaciones y reportes a Excel o PDF.
          </p>
        </div>
      </div>

      <div className="border-b border-secondary-200">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'calificaciones' && <CalificacionesTab />}
      {activeTab === 'asistencia' && <AsistenciaTab />}
      {activeTab === 'planificaciones' && <PlanificacionesTab />}
      {activeTab === 'reportes' && <ReportesTab />}
    </div>
  );
}
