import { useState } from 'react';
import { Calendar, Clock, Layers, BookOpen, Plus, CheckCircle, Power, Search, Filter, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { Table, type Column } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useSchoolYears, useCreateSchoolYear, useUpdateSchoolYear, usePeriods, useCreatePeriod, useUpdatePeriod, useGradeLevels, useSubjects } from '../../hooks/api/useAcademic';
import type { SchoolYear, AcademicPeriod, GradeLevel, Subject as AcademicSubject } from '../../services/academicApi';

type TabKey = 'ciclo-escolar' | 'periodos' | 'grados' | 'asignaturas';

interface TabItem {
  key: TabKey;
  label: string;
  icon: typeof Calendar;
}

const TABS: TabItem[] = [
  { key: 'ciclo-escolar', label: 'Ciclo Escolar', icon: Calendar },
  { key: 'periodos', label: 'Períodos', icon: Clock },
  { key: 'grados', label: 'Grados', icon: Layers },
  { key: 'asignaturas', label: 'Asignaturas', icon: BookOpen },
];

type SubjectArea = 'MATEMATICAS' | 'LENGUA_ESPAÑOLA' | 'CIENCIAS_NATURALES' | 'CIENCIAS_SOCIALES' | 'EDUCACION_FISICA' | 'ARTES' | 'IDIOMAS_EXTRANJEROS' | 'FORMACION_HUMANA' | 'TECNOLOGIA';

const AREA_OPTIONS: SubjectArea[] = [
  'MATEMATICAS', 'LENGUA_ESPAÑOLA', 'CIENCIAS_NATURALES', 'CIENCIAS_SOCIALES',
  'EDUCACION_FISICA', 'ARTES', 'IDIOMAS_EXTRANJEROS', 'FORMACION_HUMANA', 'TECNOLOGIA',
];

const AREA_LABELS: Record<SubjectArea, string> = {
  MATEMATICAS: 'Matemáticas',
  LENGUA_ESPAÑOLA: 'Lengua Española',
  CIENCIAS_NATURALES: 'Ciencias Naturales',
  CIENCIAS_SOCIALES: 'Ciencias Sociales',
  EDUCACION_FISICA: 'Educación Física',
  ARTES: 'Artes',
  IDIOMAS_EXTRANJEROS: 'Idiomas Extranjeros',
  FORMACION_HUMANA: 'Formación Humana',
  TECNOLOGIA: 'Tecnología',
};

export function Config() {
  const [activeTab, setActiveTab] = useState<TabKey>('ciclo-escolar');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Configuración del Sistema</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Administra la configuración académica de la institución
        </p>
      </div>

      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex gap-6" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'ciclo-escolar' && <CicloEscolarTab />}
      {activeTab === 'periodos' && <PeriodosTab />}
      {activeTab === 'grados' && <GradosTab />}
      {activeTab === 'asignaturas' && <AsignaturasTab />}
    </div>
  );
}

function CicloEscolarTab() {
  const { data: schoolYears, isLoading, error } = useSchoolYears();
  const createSchoolYear = useCreateSchoolYear();
  const updateSchoolYear = useUpdateSchoolYear();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });

  const columns: Column<SchoolYear>[] = [
    { key: 'name', header: 'Nombre', accessor: 'name' },
    {
      key: 'startDate',
      header: 'Fecha Inicio',
      accessor: (row) => new Date(row.startDate).toLocaleDateString('es-DO'),
    },
    {
      key: 'endDate',
      header: 'Fecha Fin',
      accessor: (row) => new Date(row.endDate).toLocaleDateString('es-DO'),
    },
    {
      key: 'isActive',
      header: 'Estado',
      accessor: 'isActive',
      render: (value) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'ACTIVO' : 'INACTIVO'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      accessor: () => null,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {!row.isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                updateSchoolYear.mutate({ id: row.id, data: { isActive: true } });
              }}
            >
              <Power className="h-3.5 w-3.5 mr-1" />
              Activar
            </Button>
          )}
          {row.isActive && (
            <Badge variant="info" className="text-xs">Actual</Badge>
          )}
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    createSchoolYear.mutate({
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
    });
    setForm({ name: '', startDate: '', endDate: '' });
    setModalOpen(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>Error al cargar ciclos escolares: {(error as Error).message}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ciclos Escolares</CardTitle>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Ciclo
        </Button>
      </CardHeader>
      <CardContent>
        <Table
          columns={columns}
          data={schoolYears ?? []}
          keyExtractor={(row) => row.id}
        />
      </CardContent>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Nuevo Ciclo Escolar"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: 2026-2027"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Fecha Inicio"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <Input
            label="Fecha Fin"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.name || !form.startDate || !form.endDate}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function PeriodosTab() {
  const { data: schoolYears } = useSchoolYears();
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | undefined>();
  const { data: periods, isLoading, error } = usePeriods(selectedSchoolYearId);
  const createPeriod = useCreatePeriod();
  const updatePeriod = useUpdatePeriod();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', order: '', startDate: '', endDate: '' });

  const filteredPeriods = (periods ?? []).sort((a, b) => a.order - b.order);

  const columns: Column<AcademicPeriod>[] = [
    { key: 'name', header: 'Nombre', accessor: 'name' },
    { key: 'order', header: 'Orden', accessor: 'order' },
    {
      key: 'startDate',
      header: 'Inicio',
      accessor: (row) => new Date(row.startDate).toLocaleDateString('es-DO'),
    },
    {
      key: 'endDate',
      header: 'Fin',
      accessor: (row) => new Date(row.endDate).toLocaleDateString('es-DO'),
    },
    {
      key: 'isActive',
      header: 'Activo',
      accessor: 'isActive',
      render: (value) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Sí' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      accessor: () => null,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {!row.isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                updatePeriod.mutate({ id: row.id, data: { isActive: true } });
              }}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Activar
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    if (!selectedSchoolYearId) return;
    createPeriod.mutate({
      name: form.name,
      schoolYearId: selectedSchoolYearId,
      order: parseInt(form.order, 10),
      startDate: form.startDate,
      endDate: form.endDate,
    });
    setForm({ name: '', order: '', startDate: '', endDate: '' });
    setModalOpen(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>Error al cargar períodos: {(error as Error).message}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <CardTitle>Períodos Académicos</CardTitle>
          <div className="w-64">
            <Select
              value={selectedSchoolYearId}
              onValueChange={setSelectedSchoolYearId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar año escolar" />
              </SelectTrigger>
              <SelectContent>
                {(schoolYears ?? []).map((sy) => (
                  <SelectItem key={sy.id} value={sy.id}>
                    {sy.name} {sy.isActive ? '(Actual)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Período
        </Button>
      </CardHeader>
      <CardContent>
        <Table
          columns={columns}
          data={filteredPeriods}
          keyExtractor={(row) => row.id}
        />
      </CardContent>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Nuevo Período"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Primer Período"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Orden"
            type="number"
            placeholder="1"
            value={form.order}
            onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
          />
          <Input
            label="Fecha Inicio"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <Input
            label="Fecha Fin"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.name || !form.order || !form.startDate || !form.endDate}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function GradosTab() {
  const { data: gradeLevels, isLoading, error } = useGradeLevels();

  const columns: Column<GradeLevel>[] = [
    { key: 'name', header: 'Nombre', accessor: 'name' },
    { key: 'code', header: 'Código', accessor: 'code' },
    { key: 'level', header: 'Nivel', accessor: (row) => row.level },
    {
      key: 'actions',
      header: 'Acciones',
      accessor: () => null,
      render: () => (
        <Button variant="ghost" size="sm">
          Editar
        </Button>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>Error al cargar grados: {(error as Error).message}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Grados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table
          columns={columns}
          data={gradeLevels ?? []}
          keyExtractor={(row) => row.id}
        />
      </CardContent>
    </Card>
  );
}

function AsignaturasTab() {
  const [areaFilter, setAreaFilter] = useState<SubjectArea | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const { data: subjectsData, isLoading, error } = useSubjects({
    ...(areaFilter !== 'ALL' ? { area: areaFilter } : {}),
    ...(search ? { search } : {}),
  });
  const subjects = subjectsData?.data ?? [];

  const filteredSubjects = subjects.filter((s) => {
    const matchesArea = areaFilter === 'ALL' || s.area === areaFilter;
    const query = search.toLowerCase();
    const matchesSearch = !query || s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query);
    return matchesArea && matchesSearch;
  });

  const columns: Column<AcademicSubject>[] = [
    { key: 'name', header: 'Nombre', accessor: 'name' },
    { key: 'code', header: 'Código', accessor: 'code' },
    {
      key: 'area',
      header: 'Área',
      accessor: 'area',
      render: (value) => {
        const area = value as SubjectArea;
        return (
          <Badge variant="secondary">{AREA_LABELS[area] || (value as string)}</Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      accessor: () => null,
      render: () => (
        <Button variant="ghost" size="sm">
          Editar
        </Button>
      ),
    },
  ];

  const activeFilters = areaFilter !== 'ALL' || search.length > 0;

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>Error al cargar asignaturas: {(error as Error).message}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <CardTitle>Asignaturas</CardTitle>
          <div className="w-56">
            <Input
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-48">
            <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v as SubjectArea | 'ALL')}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las áreas</SelectItem>
                {AREA_OPTIONS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {AREA_LABELS[area]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeFilters && (
          <div className="flex items-center gap-2 mb-4 text-sm text-secondary-500">
            <Filter className="h-4 w-4" />
            <span>
              {filteredSubjects.length} resultado{filteredSubjects.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        <Table
          columns={columns}
          data={filteredSubjects}
          keyExtractor={(row) => row.id}
        />
      </CardContent>
    </Card>
  );
}
