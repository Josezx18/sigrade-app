import { useState, useMemo } from 'react';
import {
  Home, ClipboardList, AlertTriangle, Calendar, FileText,
  Plus, Search, Download, FileSpreadsheet,
  Clock, Activity, MessageSquare, CheckCircle2,
  Eye, Edit3, Bell, BarChart3, AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '../../components/ui/Select';
import { Table, Column } from '../../components/ui/Table';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  useRiskDashboard, useRiskAlerts, useUpdateRiskAlert,
  useCounselingCases, useCreateCounselingCase, useUpdateCounselingCase,
  useCounselingNotes, useCounselingInterventions, useCounselingStats
} from '../../hooks/api/useCounseling';
import type { RiskAlert, CounselingCase, CounselingStats } from '../../services/counselingApi';

type CaseType = 'ACADEMIC_SUPPORT' | 'BEHAVIORAL' | 'FAMILY' | 'PSYCHOLOGICAL' | 'CAREER_GUIDANCE' | 'CRISIS';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'REFERRED' | 'CLOSED';
type AlertType = 'ACADEMIC_FAILURE' | 'CHRONIC_ABSENCE' | 'BEHAVIORAL' | 'SOCIOEMOTIONAL' | 'DROPOUT_RISK' | 'LEARNING_DIFFICULTY';
type AlertStatus = 'PENDING' | 'IN_REVIEW' | 'INTERVENTION' | 'RESOLVED' | 'DISMISSED';

const CASE_TYPE_LABELS: Record<CaseType, string> = {
  ACADEMIC_SUPPORT: 'Apoyo Académico',
  BEHAVIORAL: 'Conductual',
  FAMILY: 'Familiar',
  PSYCHOLOGICAL: 'Psicológico',
  CAREER_GUIDANCE: 'Orientación Vocacional',
  CRISIS: 'Crisis',
};

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  ACADEMIC_FAILURE: 'Bajo Rendimiento',
  CHRONIC_ABSENCE: 'Ausencia Crónica',
  BEHAVIORAL: 'Conductual',
  SOCIOEMOTIONAL: 'Socioemocional',
  DROPOUT_RISK: 'Riesgo de Deserción',
  LEARNING_DIFFICULTY: 'Dificultad de Aprendizaje',
};

const SEVERITY_CFG: Record<Severity, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  LOW: { variant: 'success', label: 'Baja' },
  MEDIUM: { variant: 'warning', label: 'Media' },
  HIGH: { variant: 'danger', label: 'Alta' },
  CRITICAL: { variant: 'danger', label: 'Crítica' },
};

const STATUS_CFG: Record<CaseStatus, { variant: 'info' | 'warning' | 'secondary' | 'success'; label: string }> = {
  OPEN: { variant: 'info', label: 'Abierto' },
  IN_PROGRESS: { variant: 'warning', label: 'En Progreso' },
  REFERRED: { variant: 'secondary', label: 'Derivado' },
  CLOSED: { variant: 'success', label: 'Cerrado' },
};

const ALERT_STATUS_CFG: Record<AlertStatus, { variant: 'warning' | 'info' | 'danger' | 'success' | 'secondary'; label: string }> = {
  PENDING: { variant: 'warning', label: 'Pendiente' },
  IN_REVIEW: { variant: 'info', label: 'En Revisión' },
  INTERVENTION: { variant: 'danger', label: 'Intervención' },
  RESOLVED: { variant: 'success', label: 'Resuelta' },
  DISMISSED: { variant: 'secondary', label: 'Descartada' },
};

const TIMELINE_CFG: Record<string, { label: string; color: string }> = {
  ENTREVISTA: { label: 'Entrevista', color: 'bg-blue-100 text-blue-700' },
  ACUERDO: { label: 'Acuerdo', color: 'bg-green-100 text-green-700' },
  DOCUMENTO: { label: 'Documento', color: 'bg-yellow-100 text-yellow-700' },
  ACCION: { label: 'Acción', color: 'bg-purple-100 text-purple-700' },
  NOTA: { label: 'Nota', color: 'bg-gray-100 text-gray-700' },
};

const TIMELINE_ICONS: Record<string, React.ReactNode> = {
  ENTREVISTA: <MessageSquare className="w-4 h-4" />,
  ACUERDO: <CheckCircle2 className="w-4 h-4" />,
  DOCUMENTO: <FileText className="w-4 h-4" />,
  ACCION: <Activity className="w-4 h-4" />,
  NOTA: <FileText className="w-4 h-4" />,
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

const studentName = (s?: { firstName?: string; lastName?: string; studentCode?: string }) =>
  s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || '—' : '—';

const studentCode = (s?: { studentCode?: string }) => s?.studentCode ?? '—';

// ===================== MOCK DATA =====================

const MOCK_DASHBOARD = { totalAlerts: 8, recentAlerts: 3, criticalAlerts: 2 };

const MOCK_STATS: CounselingStats = {
  totalCases: 12,
  casesByStatus: { OPEN: 5, IN_PROGRESS: 4, REFERRED: 2, CLOSED: 1 },
  casesByType: { ACADEMIC_SUPPORT: 4, BEHAVIORAL: 3, FAMILY: 2, PSYCHOLOGICAL: 2, CAREER_GUIDANCE: 1 },
  totalInterventions: 18,
  criticalCases: 3,
};

const MOCK_RISK_ALERTS: RiskAlert[] = [
  { id: 'alert-001', studentId: 'stu-001', type: 'ACADEMIC_FAILURE', severity: 'HIGH', status: 'PENDING', title: 'Bajo rendimiento en Matemáticas', description: 'Ha reprobado 3 exámenes consecutivos', createdById: 'tch-001', createdAt: '2025-04-01', student: { firstName: 'Carlos', lastName: 'López' }, assignedTo: { firstName: 'Laura', lastName: 'Herrera' } },
  { id: 'alert-002', studentId: 'stu-003', type: 'CHRONIC_ABSENCE', severity: 'CRITICAL', status: 'IN_REVIEW', title: 'Faltas reiteradas', description: 'Ha faltado 15 días este mes', createdById: 'tch-002', createdAt: '2025-04-02', student: { firstName: 'José', lastName: 'Martínez' } },
  { id: 'alert-003', studentId: 'stu-006', type: 'BEHAVIORAL', severity: 'MEDIUM', status: 'PENDING', title: 'Problemas de conducta en aula', description: 'Interrumpe constantemente las clases', createdById: 'tch-003', createdAt: '2025-04-03', student: { firstName: 'Sofía', lastName: 'Torres' } },
  { id: 'alert-004', studentId: 'stu-008', type: 'SOCIOEMOTIONAL', severity: 'HIGH', status: 'INTERVENTION', title: 'Aislamiento social', description: 'Se muestra retraída y no participa en grupo', createdById: 'tch-001', createdAt: '2025-04-04', student: { firstName: 'Valentina', lastName: 'Díaz' } },
  { id: 'alert-005', studentId: 'stu-010', type: 'DROPOUT_RISK', severity: 'HIGH', status: 'PENDING', title: 'Riesgo de deserción', description: 'Ha expresado intención de abandonar la escuela', createdById: 'tch-004', createdAt: '2025-04-05', student: { firstName: 'Camila', lastName: 'Mendoza' } },
];

const MOCK_COUNSELING_CASES: CounselingCase[] = [
  { id: 'case-001', studentId: 'stu-001', counselorId: 'cns-001', type: 'ACADEMIC_SUPPORT', status: 'OPEN', createdAt: '2025-03-15', updatedAt: '2025-04-01', student: { firstName: 'Carlos', lastName: 'López', studentCode: 'S001' }, counselor: { firstName: 'Laura', lastName: 'Herrera' } },
  { id: 'case-002', studentId: 'stu-003', counselorId: 'cns-001', type: 'BEHAVIORAL', status: 'IN_PROGRESS', createdAt: '2025-03-20', updatedAt: '2025-04-02', student: { firstName: 'José', lastName: 'Martínez', studentCode: 'S003' }, counselor: { firstName: 'Laura', lastName: 'Herrera' } },
  { id: 'case-003', studentId: 'stu-006', counselorId: 'cns-002', type: 'PSYCHOLOGICAL', status: 'IN_PROGRESS', createdAt: '2025-03-25', updatedAt: '2025-04-03', student: { firstName: 'Sofía', lastName: 'Torres', studentCode: 'S006' }, counselor: { firstName: 'Pedro', lastName: 'Sánchez' } },
  { id: 'case-004', studentId: 'stu-008', counselorId: 'cns-001', type: 'FAMILY', status: 'OPEN', createdAt: '2025-04-01', updatedAt: '2025-04-01', student: { firstName: 'Valentina', lastName: 'Díaz', studentCode: 'S008' }, counselor: { firstName: 'Laura', lastName: 'Herrera' } },
  { id: 'case-005', studentId: 'stu-010', counselorId: 'cns-002', type: 'CAREER_GUIDANCE', status: 'REFERRED', createdAt: '2025-04-02', updatedAt: '2025-04-04', student: { firstName: 'Camila', lastName: 'Mendoza', studentCode: 'S010' }, counselor: { firstName: 'Pedro', lastName: 'Sánchez' } },
  { id: 'case-006', studentId: 'stu-002', counselorId: 'cns-001', type: 'ACADEMIC_SUPPORT', status: 'CLOSED', createdAt: '2025-02-10', updatedAt: '2025-03-15', student: { firstName: 'María', lastName: 'García', studentCode: 'S002' }, counselor: { firstName: 'Laura', lastName: 'Herrera' } },
];

// MOCK_NOTES and MOCK_INTERVENTIONS can be added when SeguimientoTab needs mock data for dynamic selId

// ===================== TABS =====================

export function InicioTab() {
  const { user } = useAuth();

  const { data: dashRaw, isLoading: dashLoading, error: dashError } = useRiskDashboard();
  const { data: statsRaw, isLoading: statsLoading, error: statsError } = useCounselingStats();
  const { data: casesRaw, isLoading: casesLoading, error: casesError } = useCounselingCases({});
  const { data: alertsRaw, isLoading: alertsLoading, error: alertsError } = useRiskAlerts({});

  const dashboard = dashRaw ?? (!dashLoading ? MOCK_DASHBOARD : undefined);
  const stats = statsRaw ?? (!statsLoading ? MOCK_STATS : undefined);
  const casesData = casesRaw ?? (!casesLoading ? { data: MOCK_COUNSELING_CASES, total: 6, page: 1, limit: 10, totalPages: 1 } : undefined);
  const alertsData = alertsRaw ?? (!alertsLoading ? { data: MOCK_RISK_ALERTS, total: 5, page: 1, limit: 10, totalPages: 1 } : undefined);

  if (dashLoading || statsLoading || casesLoading || alertsLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  if ((dashError && !dashboard) || (statsError && !stats) || (casesError && !casesData) || (alertsError && !alertsData)) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" /> Error al cargar datos
      </div>
    );
  }

  const activeCases = stats?.totalCases ?? 0;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newThisMonth = (casesData?.data ?? []).filter(c => c.createdAt?.startsWith(thisMonth)).length;
  const riskCount = stats?.criticalCases ?? 0;
  const pendingInterventions = stats?.totalInterventions ?? 0;
  const totalAlerts = dashboard?.totalAlerts ?? 0;
  const unreadAlerts = dashboard?.recentAlerts ?? 0;

  const kpis = [
    { label: 'Casos Activos', value: activeCases, icon: ClipboardList, bg: 'bg-blue-100 text-blue-600' },
    { label: 'Casos Nuevos (este mes)', value: newThisMonth, icon: Plus, bg: 'bg-green-100 text-green-600' },
    { label: 'Estudiantes en Riesgo', value: riskCount, icon: AlertTriangle, bg: 'bg-red-100 text-red-600' },
    { label: 'Intervenciones Pendientes', value: pendingInterventions, icon: Activity, bg: 'bg-orange-100 text-orange-600' },
    { label: 'Total Alertas', value: totalAlerts, icon: Bell, bg: 'bg-yellow-100 text-yellow-600' },
    { label: 'Alertas Sin Revisar', value: unreadAlerts, icon: Calendar, bg: 'bg-purple-100 text-purple-600' },
  ];

  const quickActions = [
    { label: 'Nuevo Caso', icon: Plus, bg: 'bg-primary-600' },
    { label: 'Registrar Entrevista', icon: MessageSquare, bg: 'bg-blue-600' },
    { label: 'Ver Alertas', icon: Bell, bg: 'bg-yellow-500' },
    { label: 'Generar Reporte', icon: FileText, bg: 'bg-green-600' },
  ];

  const recent = [...(casesData?.data ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const pendingAlerts = (alertsData?.data ?? [])
    .filter(a => a.status === 'PENDING' || a.status === 'IN_REVIEW')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-1">Bienvenido, {user?.firstName ?? 'Orientador'}</h2>
          <p className="text-primary-100">Panel de Orientación y Consejería — Resumen general del estado actual</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className={`p-2.5 rounded-lg ${k.bg}`}><k.icon className="w-5 h-5" /></div>
              <p className="text-2xl font-bold text-secondary-900">{k.value}</p>
              <p className="text-xs text-secondary-500">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickActions.map(a => (
          <Button key={a.label} variant="outline" size="lg" className="h-auto py-4 justify-start gap-3 hover:border-primary-300">
            <div className={`p-2 rounded-lg ${a.bg} text-white`}><a.icon className="w-4 h-4" /></div>
            <span className="font-medium">{a.label}</span>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="w-4 h-4" />Casos Recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-secondary-100">
              {recent.map(c => (
                <div key={c.id} className="flex items-center justify-between px-6 py-3 hover:bg-secondary-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{studentName(c.student)}</p>
                    <p className="text-xs text-secondary-500">{CASE_TYPE_LABELS[c.type as CaseType] ?? c.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_CFG[c.status as CaseStatus]?.variant}>{STATUS_CFG[c.status as CaseStatus]?.label ?? c.status}</Badge>
                    <span className="text-xs text-secondary-400">{fmtDate(c.createdAt)}</span>
                  </div>
                </div>
              ))}
              {recent.length === 0 && (
                <p className="text-center text-sm text-secondary-400 py-6">No hay casos recientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Bell className="w-4 h-4" />Alertas Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-secondary-100">
              {pendingAlerts.map(a => (
                <div key={a.id} className="flex items-center justify-between px-6 py-3 hover:bg-secondary-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">{a.description ?? a.title}</p>
                    <p className="text-xs text-secondary-500">{studentName(a.student)}</p>
                  </div>
                  <Badge variant={SEVERITY_CFG[a.severity as Severity]?.variant}>{SEVERITY_CFG[a.severity as Severity]?.label ?? a.severity}</Badge>
                </div>
              ))}
              {pendingAlerts.length === 0 && (
                <p className="text-center text-sm text-secondary-400 py-6">No hay alertas pendientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CasosTab() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('ALL');
  const [fSta, setFSta] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ studentId: '', type: '' });

  const filters = useMemo(() => ({
    ...(fType !== 'ALL' ? { type: fType } : {}),
    ...(fSta !== 'ALL' ? { status: fSta } : {}),
  }), [fType, fSta]);

  const { data: casesRaw, isLoading, error } = useCounselingCases(filters);
  const casesData = useMemo(() => casesRaw ?? (!isLoading ? { data: MOCK_COUNSELING_CASES, total: 6, page: 1, limit: 10, totalPages: 1 } : undefined), [casesRaw, isLoading]);
  const createCase = useCreateCounselingCase();
  const updateCase = useUpdateCounselingCase();

  const filtered = useMemo(() => {
    if (!casesData?.data) return [];
    return casesData.data.filter(c => {
      if (!search) return true;
      const name = studentName(c.student).toLowerCase();
      const code = studentCode(c.student).toLowerCase();
      const term = search.toLowerCase();
      return name.includes(term) || code.includes(term);
    });
  }, [casesData, search]);

  const studentsList = useMemo(() => {
    const map = new Map<string, string>();
    (casesData?.data ?? []).forEach(c => {
      if (!c.student || map.has(c.studentId)) return;
      map.set(c.studentId, `${studentName(c.student)} (${studentCode(c.student)})`);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [casesData]);

  const handleCreate = () => {
    createCase.mutate(
      { studentId: form.studentId, counselorId: user?.id ?? '', type: form.type },
      { onSuccess: () => { setModalOpen(false); setForm({ studentId: '', type: '' }); } }
    );
  };

  const handleClose = (id: string) => {
    updateCase.mutate({ id, data: { status: 'CLOSED' } });
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (error && !casesData) return (
    <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5" /> Error al cargar casos
    </div>
  );

  const cols: Column<CounselingCase>[] = [
    { key: 'student', header: 'Estudiante', accessor: r => (
      <div>
        <p className="font-medium text-secondary-900">{studentName(r.student)}</p>
        <p className="text-xs text-secondary-500">{studentCode(r.student)}</p>
      </div>
    )},
    { key: 'type', header: 'Tipo', accessor: r => CASE_TYPE_LABELS[r.type as CaseType] ?? r.type },
    { key: 'status', header: 'Estado', accessor: r => (
      <Badge variant={STATUS_CFG[r.status as CaseStatus]?.variant}>{STATUS_CFG[r.status as CaseStatus]?.label ?? r.status}</Badge>
    )},
    { key: 'createdAt', header: 'Fecha apertura', accessor: r => fmtDate(r.createdAt) },
    { key: 'actions', header: 'Acciones', accessor: () => null, render: (_v, r) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost"><Eye className="w-3.5 h-3.5" /></Button>
        <Button size="sm" variant="ghost"><Edit3 className="w-3.5 h-3.5" /></Button>
        {r.status !== 'CLOSED' && (
          <Button size="sm" variant="ghost" className="text-success-600" onClick={() => handleClose(r.id)}>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Buscar por nombre o código..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} className="w-64" />
          <Select value={fType} onValueChange={setFType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              {(Object.keys(CASE_TYPE_LABELS) as CaseType[]).map(t => <SelectItem key={t} value={t}>{CASE_TYPE_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fSta} onValueChange={setFSta}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              {(Object.keys(STATUS_CFG) as CaseStatus[]).map(s => <SelectItem key={s} value={s}>{STATUS_CFG[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-1" />Abrir Nuevo Caso</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table columns={cols} data={filtered} keyExtractor={r => r.id} striped={false} hoverable bordered={false} emptyMessage="No se encontraron casos con los filtros seleccionados" />
        </CardContent>
      </Card>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Abrir Nuevo Caso" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Estudiante</label>
            <Select value={form.studentId} onValueChange={v => setForm({ ...form, studentId: v })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar estudiante..." /></SelectTrigger>
              <SelectContent>
                {studentsList.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Tipo</label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CASE_TYPE_LABELS) as CaseType[]).map(t => <SelectItem key={t} value={t}>{CASE_TYPE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.studentId || !form.type || createCase.isPending}>
              {createCase.isPending ? 'Creando...' : 'Crear Caso'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function SeguimientoTab() {
  const { data: casesRaw, isLoading: casesLoading } = useCounselingCases({});
  const casesData = casesRaw ?? (!casesLoading ? { data: MOCK_COUNSELING_CASES, total: 6, page: 1, limit: 10, totalPages: 1 } : undefined);
  const [selId, setSelId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({
    type: 'ENTREVISTA', date: new Date().toISOString().split('T')[0], description: '', responsible: ''
  });

  const { data: notes, isLoading: notesLoading } = useCounselingNotes(selId);
  const { data: interventions, isLoading: intLoading } = useCounselingInterventions(selId);

  const selCase = casesData?.data?.find(c => c.id === selId);
  const isLoading = casesLoading || notesLoading || intLoading;

  const timeline = useMemo(() => {
    const entries: Array<{
      id: string; type: string; date: string; description: string; details: string; responsible: string;
    }> = [];

    if (notes) {
      notes.forEach(n => entries.push({
        id: n.id, type: 'NOTA', date: n.createdAt, description: n.content, details: '', responsible: n.authorId,
      }));
    }
    if (interventions) {
      interventions.forEach(i => entries.push({
        id: i.id, type: i.type, date: i.startDate, description: i.description, details: i.outcome ?? '', responsible: i.responsibleId,
      }));
    }

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, interventions]);

  if (!selId && casesData?.data?.length) {
    if (selId === '') setSelId(casesData.data[0].id);
  }

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <Select value={selId} onValueChange={v => { setSelId(v); }}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Seleccionar caso..." /></SelectTrigger>
            <SelectContent>
              {(casesData?.data ?? []).map(c => (
                <SelectItem key={c.id} value={c.id}>{studentName(c.student)} - {CASE_TYPE_LABELS[c.type as CaseType] ?? c.type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Agregar Seguimiento</Button>
        </div>

        {selCase ? (
          <div className="relative pl-8">
            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-secondary-200" />
            {timeline.map(entry => {
              const cfg = TIMELINE_CFG[entry.type] ?? { label: entry.type, color: 'bg-gray-100 text-gray-700' };
              const icon = TIMELINE_ICONS[entry.type] ?? <FileText className="w-4 h-4" />;
              return (
                <div key={entry.id} className="relative pb-6">
                  <div className={`absolute -left-[1.125rem] p-1.5 rounded-full ${cfg.color} ring-4 ring-white`}>{icon}</div>
                  <Card className="ml-4">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                        <span className="text-xs text-secondary-400">{fmtDate(entry.date)}</span>
                      </div>
                      <p className="font-medium text-secondary-900">{entry.description}</p>
                      {entry.details && <p className="text-sm text-secondary-500 mt-1">{entry.details}</p>}
                      <p className="text-xs text-secondary-400 mt-2">Responsable: {entry.responsible || '—'}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
            {timeline.length === 0 && <p className="text-secondary-500 text-sm py-8 text-center">No hay registros de seguimiento para este caso.</p>}
          </div>
        ) : (
          <p className="text-secondary-500 text-sm py-8 text-center">Seleccione un caso para ver su seguimiento</p>
        )}
      </div>

      {selCase && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información del Caso</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-secondary-500 uppercase tracking-wide">Estudiante</p>
                <p className="font-medium text-secondary-900">{studentName(selCase.student)}</p>
                <p className="text-sm text-secondary-500">{studentCode(selCase.student)}</p>
              </div>
              <div><p className="text-xs text-secondary-500 uppercase tracking-wide">Tipo</p><p className="text-sm">{CASE_TYPE_LABELS[selCase.type as CaseType] ?? selCase.type}</p></div>
              <div>
                <p className="text-xs text-secondary-500 uppercase tracking-wide">Estado</p>
                <Badge variant={STATUS_CFG[selCase.status as CaseStatus]?.variant}>{STATUS_CFG[selCase.status as CaseStatus]?.label ?? selCase.status}</Badge>
              </div>
              <div><p className="text-xs text-secondary-500 uppercase tracking-wide">Fecha de Apertura</p><p className="text-sm">{fmtDate(selCase.createdAt)}</p></div>
              <div><p className="text-xs text-secondary-500 uppercase tracking-wide">Consejero Asignado</p><p className="text-sm">{selCase.counselor ? `${selCase.counselor.firstName} ${selCase.counselor.lastName}` : '—'}</p></div>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal open={addOpen} onOpenChange={setAddOpen} title="Agregar Seguimiento" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Tipo</label>
            <Select value={entryForm.type} onValueChange={v => setEntryForm({ ...entryForm, type: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTREVISTA">Entrevista</SelectItem>
                <SelectItem value="ACUERDO">Acuerdo</SelectItem>
                <SelectItem value="DOCUMENTO">Documento</SelectItem>
                <SelectItem value="ACCION">Acción</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input label="Fecha" type="date" value={entryForm.date} onChange={e => setEntryForm({ ...entryForm, date: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Descripción</label>
            <textarea className="w-full rounded-lg border border-secondary-300 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none" rows={3} value={entryForm.description} onChange={e => setEntryForm({ ...entryForm, description: e.target.value })} placeholder="Describa el detalle del seguimiento..." />
          </div>
          <Input label="Responsable" value={entryForm.responsible} onChange={e => setEntryForm({ ...entryForm, responsible: e.target.value })} placeholder="Nombre del responsable" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={() => setAddOpen(false)} disabled={!entryForm.description || !entryForm.responsible}>Agregar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function AlertasTab() {
  const [fType, setFType] = useState('ALL');
  const [fSev, setFSev] = useState('ALL');
  const [fSta, setFSta] = useState('ALL');

  const filters = useMemo(() => ({
    ...(fType !== 'ALL' ? { type: fType } : {}),
    ...(fSev !== 'ALL' ? { severity: fSev } : {}),
    ...(fSta !== 'ALL' ? { status: fSta } : {}),
  }), [fType, fSev, fSta]);

  const { data: alertsRaw, isLoading, error } = useRiskAlerts(filters);
  const alertsData = alertsRaw ?? (!isLoading ? { data: MOCK_RISK_ALERTS, total: 5, page: 1, limit: 10, totalPages: 1 } : undefined);
  const updateAlert = useUpdateRiskAlert();

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (error && !alertsData) return (
    <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5" /> Error al cargar alertas
    </div>
  );

  const recentAlerts = [...(alertsData?.data ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const handleStatusChange = (id: string, status: string) => {
    updateAlert.mutate({ id, data: { status } });
  };

  const cols: Column<RiskAlert>[] = [
    { key: 'description', header: 'Descripción', accessor: r => (
      <div>
        <p className="text-sm font-medium text-secondary-900">{r.description ?? r.title}</p>
        <p className="text-xs text-secondary-500">{studentName(r.student)}</p>
      </div>
    )},
    { key: 'type', header: 'Tipo', accessor: r => (
      <Badge variant="outline" className="text-xs whitespace-nowrap">{ALERT_TYPE_LABELS[r.type as AlertType] ?? r.type}</Badge>
    )},
    { key: 'severity', header: 'Severidad', accessor: r => (
      <Badge variant={SEVERITY_CFG[r.severity as Severity]?.variant}>{SEVERITY_CFG[r.severity as Severity]?.label ?? r.severity}</Badge>
    )},
    { key: 'status', header: 'Estado', accessor: r => (
      <Badge variant={ALERT_STATUS_CFG[r.status as AlertStatus]?.variant}>{ALERT_STATUS_CFG[r.status as AlertStatus]?.label ?? r.status}</Badge>
    )},
    { key: 'createdAt', header: 'Fecha', accessor: r => fmtDate(r.createdAt) },
    { key: 'actions', header: 'Acciones', accessor: () => null, render: (_v, r) => (
      <div className="flex gap-1">
        {r.status === 'PENDING' && (
          <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => handleStatusChange(r.id, 'IN_REVIEW')}>Revisar</Button>
        )}
        {(r.status === 'PENDING' || r.status === 'IN_REVIEW') && (
          <Button size="sm" variant="ghost" className="text-orange-600" onClick={() => handleStatusChange(r.id, 'INTERVENTION')}>Intervenir</Button>
        )}
        {r.status !== 'RESOLVED' && r.status !== 'DISMISSED' && (
          <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleStatusChange(r.id, 'RESOLVED')}>Resolver</Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={fType} onValueChange={setFType}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tipo de alerta" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            {(Object.keys(ALERT_TYPE_LABELS) as AlertType[]).map(t => <SelectItem key={t} value={t}>{ALERT_TYPE_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fSev} onValueChange={setFSev}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Severidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Severity[]).map(s => <SelectItem key={s} value={s}>{SEVERITY_CFG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fSta} onValueChange={setFSta}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {(Object.keys(ALERT_STATUS_CFG) as AlertStatus[]).map(s => <SelectItem key={s} value={s}>{ALERT_STATUS_CFG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table columns={cols} data={alertsData?.data ?? []} keyExtractor={r => r.id} striped={false} hoverable bordered={false} emptyMessage="No se encontraron alertas con los filtros seleccionados" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Activity className="w-4 h-4" />Alertas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAlerts.map(a => (
              <Card key={a.id} className="border-l-4 border-l-warning-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <Badge variant="outline" className="text-xs mb-2">{ALERT_TYPE_LABELS[a.type as AlertType] ?? a.type}</Badge>
                      <p className="text-sm text-secondary-700">{a.description ?? a.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={SEVERITY_CFG[a.severity as Severity]?.variant}>{SEVERITY_CFG[a.severity as Severity]?.label ?? a.severity}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {recentAlerts.length === 0 && (
              <p className="text-sm text-secondary-400 col-span-3 text-center py-4">No hay alertas recientes</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportesTab() {
  const { data: statsRaw, isLoading, error } = useCounselingStats();
  const stats = statsRaw ?? (!isLoading ? MOCK_STATS : undefined);
  const [active, setActive] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (error && !stats) return (
    <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5" /> Error al cargar estadísticas
    </div>
  );

  const reports = [
    {
      id: 'total', label: 'Total Casos', icon: ClipboardList, color: 'text-blue-600 bg-blue-50',
      get: () => ({
        count: stats?.totalCases ?? 0,
        students: [] as string[],
        trend: `${stats?.totalCases ?? 0} casos registrados`,
        details: Object.entries(stats?.casesByStatus ?? {}).map(([k, v]) => ({
          student: k, type: STATUS_CFG[k as CaseStatus]?.label ?? k, meta: `${v} casos`
        })),
      }),
    },
    {
      id: 'riesgo', label: 'Estudiantes en Riesgo', icon: AlertTriangle, color: 'text-red-600 bg-red-50',
      get: () => ({
        count: stats?.criticalCases ?? 0,
        students: [] as string[],
        trend: `${stats?.criticalCases ?? 0} casos críticos`,
        details: Object.entries(stats?.casesByType ?? {}).map(([k, v]) => ({
          student: k, type: CASE_TYPE_LABELS[k as CaseType] ?? k, meta: `${v} casos`
        })),
      }),
    },
    {
      id: 'estados', label: 'Casos por Estado', icon: BarChart3, color: 'text-green-600 bg-green-50',
      get: () => ({
        count: Object.keys(stats?.casesByStatus ?? {}).length,
        students: [] as string[],
        trend: `${(stats?.totalCases ?? 0)} casos en total`,
        details: Object.entries(stats?.casesByStatus ?? {}).map(([k, v]) => ({
          student: STATUS_CFG[k as CaseStatus]?.label ?? k, type: 'Estado', meta: `${v} casos`
        })),
      }),
    },
    {
      id: 'intervenciones', label: 'Intervenciones', icon: Activity, color: 'text-purple-600 bg-purple-50',
      get: () => ({
        count: stats?.totalInterventions ?? 0,
        students: [] as string[],
        trend: `${stats?.totalInterventions ?? 0} intervenciones realizadas`,
        details: Object.entries(stats?.casesByType ?? {}).map(([k, v]) => ({
          student: CASE_TYPE_LABELS[k as CaseType] ?? k, type: 'Tipo de caso', meta: `${v} casos`
        })),
      }),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map(r => {
          const d = r.get();
          return (
            <Card key={r.id} className={`cursor-pointer transition-all hover:shadow-md ${active === r.id ? 'ring-2 ring-primary-500' : ''}`} onClick={() => setActive(active === r.id ? null : r.id)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${r.color}`}><r.icon className="w-5 h-5" /></div>
                  <span className="text-2xl font-bold text-secondary-900">{d.count}</span>
                </div>
                <h3 className="font-medium text-secondary-900 text-sm">{r.label}</h3>
                <p className="text-xs text-secondary-500 mt-1">{d.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {active && (() => {
        const r = reports.find(x => x.id === active);
        if (!r) return null;
        const d = r.get();
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><r.icon className="w-4 h-4" />{r.label} — Detalle</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1" />PDF</Button>
                  <Button size="sm" variant="outline"><FileSpreadsheet className="w-4 h-4 mr-1" />Excel</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 mb-4">
                <p className="text-sm text-secondary-600">Total: <strong className="text-secondary-900">{d.count}</strong></p>
                <p className="text-sm text-secondary-600">Tendencia: <strong className="text-secondary-900">{d.trend}</strong></p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200 bg-secondary-50">
                      <th className="h-10 px-4 text-left font-medium text-secondary-600">Categoría</th>
                      <th className="h-10 px-4 text-left font-medium text-secondary-600">Detalle</th>
                      <th className="h-10 px-4 text-left font-medium text-secondary-600">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {d.details.map((x, i) => (
                      <tr key={i} className="hover:bg-secondary-50">
                        <td className="px-4 py-3">{x.student}</td>
                        <td className="px-4 py-3">{x.type || '-'}</td>
                        <td className="px-4 py-3">{x.meta || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}

// ===================== MAIN =====================

const TABS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'casos', label: 'Casos', icon: ClipboardList },
  { id: 'seguimiento', label: 'Seguimiento', icon: Activity },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function Counseling() {
  const [tab, setTab] = useState<TabId>('inicio');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Orientación y Consejería</h1>
      </div>

      <div className="flex gap-1 border-b border-secondary-200">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'}`}
            >
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'inicio' && <InicioTab />}
      {tab === 'casos' && <CasosTab />}
      {tab === 'seguimiento' && <SeguimientoTab />}
      {tab === 'alertas' && <AlertasTab />}
      {tab === 'reportes' && <ReportesTab />}
    </div>
  );
}
