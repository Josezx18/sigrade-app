import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, CalendarDays, Layers, BookOpen, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { toast } from '../../hooks/useToast';
import { api } from '../../lib/api';

interface SchoolYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  tenantId: string;
}

interface GradeLevel {
  id: string;
  name: string;
  ordinal: number;
  educationLevel: string;
  tenantId: string;
}

interface Course {
  id: string;
  name: string;
  gradeLevelId: string;
  schoolYearId: string;
  tutorId?: string;
  gradeLevel?: { name: string };
  schoolYear?: { name: string };
}

interface Subject {
  id: string;
  code: string;
  name: string;
  educationLevel: string;
  area: string;
  requiresLab: boolean;
  tenantId: string;
}

const academicApi = {
  get: <T,>(url: string) => api.get<T>(`/academic${url}`),
  post: <T,>(url: string, data: unknown) => api.post<T>(`/academic${url}`, data),
  put: <T,>(url: string, data: unknown) => api.put<T>(`/academic${url}`, data),
  delete: (url: string) => api.delete(`/academic${url}`),
};

const EDUCATION_LABELS: Record<string, string> = {
  PRIMARIA: 'Primaria',
  SECUNDARIA: 'Secundaria',
};

const EDUCATION_VARIANTS: Record<string, 'info' | 'warning'> = {
  PRIMARIA: 'info',
  SECUNDARIA: 'warning',
};

const AREA_LABELS: Record<string, string> = {
  LENGUA: 'Lengua',
  MATEMATICAS: 'Matemáticas',
  CIENCIAS: 'Ciencias Sociales',
  SOCIALES: 'Ciencias Sociales',
  NATURALES: 'Ciencias de la Naturaleza',
  IDIOMAS: 'Idiomas',
  ARTISTICA: 'Educación Artística',
  FISICA: 'Educación Física',
  FORMACION: 'Formación Integral',
  TECNICA: 'Técnico Profesional',
  OTRO: 'Otro',
};

const TABS = [
  { id: 'school-years', label: 'Años Escolares', icon: CalendarDays },
  { id: 'grade-levels', label: 'Niveles de Grado', icon: Layers },
  { id: 'courses', label: 'Cursos', icon: BookOpen },
  { id: 'subjects', label: 'Asignaturas', icon: GraduationCap },
] as const;

type TabId = (typeof TABS)[number]['id'];

const emptySchoolYear = { name: '', startDate: '', endDate: '', isActive: true };
const emptyGradeLevel = { name: '', ordinal: 0, educationLevel: 'PRIMARIA' };
const emptyCourse = { name: '', gradeLevelId: '', schoolYearId: '', tutorId: '' };
const emptySubject = { code: '', name: '', educationLevel: 'PRIMARIA', area: 'LENGUA', requiresLab: false };

function useAcademicQuery<T>(endpoint: string, tab: TabId) {
  return useQuery<T[]>({
    queryKey: ['academic', tab],
    queryFn: async () => {
      const { data } = await academicApi.get<T[]>(`/${endpoint}`);
      return data;
    },
  });
}

function useAcademicMutation<TData>(endpoint: string, tab: TabId) {
  const queryClient = useQueryClient();
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['academic', tab] });
  }, [queryClient, tab]);

  const create = useMutation({
    mutationFn: async (payload: TData) => {
      const { data } = await academicApi.post<TData>(`/${endpoint}`, payload);
      return data;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<TData> }) => {
      const { data } = await academicApi.put<TData>(`/${endpoint}/${id}`, payload);
      return data;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await academicApi.delete(`/${endpoint}/${id}`);
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

const MOCK_SCHOOL_YEARS: SchoolYear[] = [
  { id: 'sy-001', name: '2024-2025', startDate: '2024-09-01', endDate: '2025-06-30', isActive: false, tenantId: 't-001' },
  { id: 'sy-002', name: '2025-2026', startDate: '2025-09-01', endDate: '2026-06-30', isActive: true, tenantId: 't-001' },
];

const MOCK_GRADE_LEVELS: GradeLevel[] = [
  { id: 'gl-001', name: '1° Primaria', ordinal: 1, educationLevel: 'PRIMARIA', tenantId: 't-001' },
  { id: 'gl-002', name: '2° Primaria', ordinal: 2, educationLevel: 'PRIMARIA', tenantId: 't-001' },
  { id: 'gl-003', name: '3° Primaria', ordinal: 3, educationLevel: 'PRIMARIA', tenantId: 't-001' },
  { id: 'gl-004', name: '4° Primaria', ordinal: 4, educationLevel: 'PRIMARIA', tenantId: 't-001' },
  { id: 'gl-005', name: '5° Primaria', ordinal: 5, educationLevel: 'PRIMARIA', tenantId: 't-001' },
  { id: 'gl-006', name: '6° Primaria', ordinal: 6, educationLevel: 'PRIMARIA', tenantId: 't-001' },
];

const MOCK_COURSES: Course[] = [
  { id: 'crs-001', name: '1° A', gradeLevelId: 'gl-001', schoolYearId: 'sy-002', tutorId: 'tch-001', gradeLevel: { name: '1° Primaria' }, schoolYear: { name: '2025-2026' } },
  { id: 'crs-002', name: '1° B', gradeLevelId: 'gl-001', schoolYearId: 'sy-002', tutorId: 'tch-002', gradeLevel: { name: '1° Primaria' }, schoolYear: { name: '2025-2026' } },
  { id: 'crs-003', name: '2° A', gradeLevelId: 'gl-002', schoolYearId: 'sy-002', tutorId: 'tch-003', gradeLevel: { name: '2° Primaria' }, schoolYear: { name: '2025-2026' } },
  { id: 'crs-004', name: '3° A', gradeLevelId: 'gl-003', schoolYearId: 'sy-002', gradeLevel: { name: '3° Primaria' }, schoolYear: { name: '2025-2026' } },
  { id: 'crs-005', name: '4° A', gradeLevelId: 'gl-004', schoolYearId: 'sy-002', gradeLevel: { name: '4° Primaria' }, schoolYear: { name: '2025-2026' } },
  { id: 'crs-006', name: '5° A', gradeLevelId: 'gl-005', schoolYearId: 'sy-002', gradeLevel: { name: '5° Primaria' }, schoolYear: { name: '2025-2026' } },
  { id: 'crs-007', name: '6° A', gradeLevelId: 'gl-006', schoolYearId: 'sy-002', gradeLevel: { name: '6° Primaria' }, schoolYear: { name: '2025-2026' } },
];

const MOCK_SUBJECTS: Subject[] = [
  { id: 'sub-001', code: 'MAT01', name: 'Matemáticas', educationLevel: 'PRIMARIA', area: 'MATEMATICAS', requiresLab: false, tenantId: 't-001' },
  { id: 'sub-002', code: 'LEN01', name: 'Lengua Española', educationLevel: 'PRIMARIA', area: 'LENGUA', requiresLab: false, tenantId: 't-001' },
  { id: 'sub-003', code: 'ING01', name: 'Inglés', educationLevel: 'PRIMARIA', area: 'IDIOMAS', requiresLab: false, tenantId: 't-001' },
  { id: 'sub-004', code: 'BIO01', name: 'Biología', educationLevel: 'PRIMARIA', area: 'NATURALES', requiresLab: true, tenantId: 't-001' },
  { id: 'sub-005', code: 'HIS01', name: 'Historia', educationLevel: 'PRIMARIA', area: 'SOCIALES', requiresLab: false, tenantId: 't-001' },
];

export default function Academic() {
  const [activeTab, setActiveTab] = useState<TabId>('school-years');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const schoolYearQuery = useAcademicQuery<SchoolYear>('school-years', 'school-years');
  const gradeLevelQuery = useAcademicQuery<GradeLevel>('grade-levels', 'grade-levels');
  const courseQuery = useAcademicQuery<Course>('courses', 'courses');
  const subjectQuery = useAcademicQuery<Subject>('subjects', 'subjects');

  const schoolYearMutation = useAcademicMutation<SchoolYear>('school-years', 'school-years');
  const gradeLevelMutation = useAcademicMutation<GradeLevel>('grade-levels', 'grade-levels');
  const courseMutation = useAcademicMutation<Course>('courses', 'courses');
  const subjectMutation = useAcademicMutation<Subject>('subjects', 'subjects');

  const currentQuery = (() => {
    switch (activeTab) {
      case 'school-years': return schoolYearQuery;
      case 'grade-levels': return gradeLevelQuery;
      case 'courses': return courseQuery;
      case 'subjects': return subjectQuery;
    }
  })();

  const currentMutation = (() => {
    switch (activeTab) {
      case 'school-years': return schoolYearMutation;
      case 'grade-levels': return gradeLevelMutation;
      case 'courses': return courseMutation;
      case 'subjects': return subjectMutation;
    }
  })();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await currentMutation.remove.mutateAsync(deleteId);
      toast({ title: 'Elemento eliminado', variant: 'success' });
      setDeleteId(null);
    } catch {
      toast({ title: 'Error al eliminar', variant: 'danger' });
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    setEditingId(id);
    setShowModal(true);
  };

  const mockForTab = useMemo(() => {
    switch (activeTab) {
      case 'school-years': return MOCK_SCHOOL_YEARS;
      case 'grade-levels': return MOCK_GRADE_LEVELS;
      case 'courses': return MOCK_COURSES;
      case 'subjects': return MOCK_SUBJECTS;
    }
  }, [activeTab]);
  const data = currentQuery.data ?? (!currentQuery.isLoading ? mockForTab : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión Académica</h1>
          <p className="text-sm text-gray-500 mt-1">Años escolares, niveles, cursos y asignaturas</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {currentQuery.isLoading ? (
        <Card>
          <CardContent>
            <LoadingSpinner />
          </CardContent>
        </Card>
      ) : currentQuery.isError && !currentQuery.data ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-medium text-red-600 mb-2">Error al cargar datos</h3>
              <p className="text-sm text-gray-500 mb-4">No se pudieron obtener los datos. Intente de nuevo.</p>
              <button
                onClick={() => currentQuery.refetch()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={
                <Plus className="w-12 h-12 text-gray-300" />
              }
              title="No hay registros"
              description={`No se encontraron ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}.`}
              action={
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  + Agregar
                </button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Listado de {TABS.find((t) => t.id === activeTab)?.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {activeTab === 'school-years' && (
                <SchoolYearsTable
                  data={data as SchoolYear[]}
                  onEdit={openEditModal}
                  onDelete={(id) => setDeleteId(id)}
                  isPending={currentMutation.remove.isPending}
                />
              )}
              {activeTab === 'grade-levels' && (
                <GradeLevelsTable
                  data={data as GradeLevel[]}
                  onEdit={openEditModal}
                  onDelete={(id) => setDeleteId(id)}
                  isPending={currentMutation.remove.isPending}
                />
              )}
              {activeTab === 'courses' && (
                <CoursesTable
                  data={data as Course[]}
                  onEdit={openEditModal}
                  onDelete={(id) => setDeleteId(id)}
                  isPending={currentMutation.remove.isPending}
                />
              )}
              {activeTab === 'subjects' && (
                <SubjectsTable
                  data={data as Subject[]}
                  onEdit={openEditModal}
                  onDelete={(id) => setDeleteId(id)}
                  isPending={currentMutation.remove.isPending}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <AcademicFormModal
        tab={activeTab}
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        onSubmit={async (payload) => {
          try {
            if (editingId) {
              await currentMutation.update.mutateAsync({ id: editingId, payload });
              toast({ title: 'Actualizado correctamente', variant: 'success' });
            } else {
              await currentMutation.create.mutateAsync(payload as never);
              toast({ title: 'Creado correctamente', variant: 'success' });
            }
            setShowModal(false);
            setEditingId(null);
          } catch {
            toast({ title: 'Error al guardar', variant: 'danger' });
          }
        }}
        editId={editingId}
        data={data}
        loading={currentMutation.create.isPending || currentMutation.update.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar registro"
        message="¿Está seguro de eliminar este registro? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={currentMutation.remove.isPending}
      />
    </div>
  );
}

function SchoolYearsTable({
  data,
  onEdit,
  onDelete,
  isPending,
}: {
  data: SchoolYear[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Inicio</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Fin</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{new Date(item.startDate).toLocaleDateString('es-DO')}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{new Date(item.endDate).toLocaleDateString('es-DO')}</td>
            <td className="px-4 py-3">
              <Badge variant={item.isActive ? 'success' : 'default'}>
                {item.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <button onClick={() => onEdit(item.id)} className="text-sm text-blue-600 hover:text-blue-800 mr-3">
                <Pencil className="w-4 h-4 inline" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 inline" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GradeLevelsTable({
  data,
  onEdit,
  onDelete,
  isPending,
}: {
  data: GradeLevel[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel Educativo</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{item.ordinal}</td>
            <td className="px-4 py-3">
              <Badge variant={EDUCATION_VARIANTS[item.educationLevel] ?? 'default'}>
                {EDUCATION_LABELS[item.educationLevel] ?? item.educationLevel}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <button onClick={() => onEdit(item.id)} className="text-sm text-blue-600 hover:text-blue-800 mr-3">
                <Pencil className="w-4 h-4 inline" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 inline" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CoursesTable({
  data,
  onEdit,
  onDelete,
  isPending,
}: {
  data: Course[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Año Escolar</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{item.gradeLevel?.name ?? item.gradeLevelId}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{item.schoolYear?.name ?? item.schoolYearId}</td>
            <td className="px-4 py-3 text-sm text-gray-600">
              {item.tutorId ? item.tutorId : <span className="text-gray-400">—</span>}
            </td>
            <td className="px-4 py-3 text-right">
              <button onClick={() => onEdit(item.id)} className="text-sm text-blue-600 hover:text-blue-800 mr-3">
                <Pencil className="w-4 h-4 inline" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 inline" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SubjectsTable({
  data,
  onEdit,
  onDelete,
  isPending,
}: {
  data: Subject[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel Educativo</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Laboratorio</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.code}</td>
            <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
            <td className="px-4 py-3">
              <Badge variant={EDUCATION_VARIANTS[item.educationLevel] ?? 'default'}>
                {EDUCATION_LABELS[item.educationLevel] ?? item.educationLevel}
              </Badge>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{AREA_LABELS[item.area] ?? item.area}</td>
            <td className="px-4 py-3">
              <Badge variant={item.requiresLab ? 'success' : 'default'}>
                {item.requiresLab ? 'Sí' : 'No'}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <button onClick={() => onEdit(item.id)} className="text-sm text-blue-600 hover:text-blue-800 mr-3">
                <Pencil className="w-4 h-4 inline" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 inline" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AcademicFormModal({
  tab,
  isOpen,
  onClose,
  onSubmit,
  editId,
  data,
  loading,
}: {
  tab: TabId;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void | Promise<void>;
  editId: string | null;
  data: unknown[];
  loading: boolean;
}) {
  const editingItem = editId ? (data as Array<Record<string, unknown>>).find((d) => (d as Record<string, unknown>).id === editId) : null;

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    switch (tab) {
      case 'school-years': return { ...emptySchoolYear };
      case 'grade-levels': return { ...emptyGradeLevel };
      case 'courses': return { ...emptyCourse };
      case 'subjects': return { ...emptySubject };
    }
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({ ...editingItem } as Record<string, unknown>);
    } else {
      switch (tab) {
        case 'school-years': setFormData({ ...emptySchoolYear }); break;
        case 'grade-levels': setFormData({ ...emptyGradeLevel }); break;
        case 'courses': setFormData({ ...emptyCourse }); break;
        case 'subjects': setFormData({ ...emptySubject }); break;
      }
    }
  }, [editingItem, tab, isOpen]);

  const updateField = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const title = (() => {
    const labels: Record<TabId, string> = {
      'school-years': 'Año Escolar',
      'grade-levels': 'Nivel de Grado',
      'courses': 'Curso',
      'subjects': 'Asignatura',
    };
    return editingItem ? `Editar ${labels[tab]}` : `Nuevo ${labels[tab]}`;
  })();

  return (
    <Modal open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {tab === 'school-years' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={(formData.name as string) ?? ''}
                onChange={(e) => updateField('name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio *</label>
                <input
                  type="date"
                  value={(formData.startDate as string) ?? ''}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin *</label>
                <input
                  type="date"
                  value={(formData.endDate as string) ?? ''}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={(formData.isActive as boolean) ?? false}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Activo</label>
            </div>
          </>
        )}

        {tab === 'grade-levels' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={(formData.name as string) ?? ''}
                onChange={(e) => updateField('name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden *</label>
                <input
                  type="number"
                  value={(formData.ordinal as number) ?? 0}
                  onChange={(e) => updateField('ordinal', parseInt(e.target.value, 10))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel Educativo *</label>
                <select
                  value={(formData.educationLevel as string) ?? 'PRIMARIA'}
                  onChange={(e) => updateField('educationLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="PRIMARIA">Primaria</option>
                  <option value="SECUNDARIA">Secundaria</option>
                </select>
              </div>
            </div>
          </>
        )}

        {tab === 'courses' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={(formData.name as string) ?? ''}
                onChange={(e) => updateField('name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Grado ID *</label>
              <input
                type="text"
                value={(formData.gradeLevelId as string) ?? ''}
                onChange={(e) => updateField('gradeLevelId', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año Escolar ID *</label>
              <input
                type="text"
                value={(formData.schoolYearId as string) ?? ''}
                onChange={(e) => updateField('schoolYearId', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tutor ID</label>
              <input
                type="text"
                value={(formData.tutorId as string) ?? ''}
                onChange={(e) => updateField('tutorId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </>
        )}

        {tab === 'subjects' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                <input
                  type="text"
                  value={(formData.code as string) ?? ''}
                  onChange={(e) => updateField('code', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={(formData.name as string) ?? ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel Educativo *</label>
                <select
                  value={(formData.educationLevel as string) ?? 'PRIMARIA'}
                  onChange={(e) => updateField('educationLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="PRIMARIA">Primaria</option>
                  <option value="SECUNDARIA">Secundaria</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
                <select
                  value={(formData.area as string) ?? 'LENGUA'}
                  onChange={(e) => updateField('area', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {Object.entries(AREA_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresLab"
                checked={(formData.requiresLab as boolean) ?? false}
                onChange={(e) => updateField('requiresLab', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="requiresLab" className="text-sm font-medium text-gray-700">Requiere Laboratorio</label>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
