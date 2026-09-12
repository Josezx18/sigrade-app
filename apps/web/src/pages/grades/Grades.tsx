import { useState } from 'react';
import { Plus, Upload, Pencil, Trash2 } from 'lucide-react';
import { useGrades, useCreateGrade, useUpdateGrade, useDeleteGrade, useBulkCreateGrades } from '../../hooks/useGrades';
import { Grade, GradeCreateDTO, GradeFilters } from '../../services/gradeApi';
import { PaginatedResponse } from '../../lib/types';
import { toast } from '../../hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const VALUE_BADGE = [
  { min: 90, max: 100, variant: 'success' as const, label: 'Excelente' },
  { min: 70, max: 89, variant: 'info' as const, label: 'Bueno' },
  { min: 50, max: 69, variant: 'warning' as const, label: 'Regular' },
  { min: 0, max: 49, variant: 'danger' as const, label: 'Deficiente' },
];

function getValueBadge(value: number) {
  return VALUE_BADGE.find((b) => value >= b.min && value <= b.max) ?? VALUE_BADGE[3];
}

const emptyForm: GradeCreateDTO = {
  studentId: '',
  subjectId: '',
  teacherId: '',
  periodId: '',
  value: 0,
  weight: 1,
  comment: '',
  evidenceUrl: '',
};

const MOCK_GRADES: Grade[] = [
  { id: 'grd-001', studentId: 'stu-001', studentName: 'Carlos López', subjectId: 'sub-1', subjectName: 'Matemáticas', teacherId: 'tch-001', periodId: 'per-1', value: 92, weight: 1, comment: 'Buen desempeño', createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'grd-002', studentId: 'stu-001', studentName: 'Carlos López', subjectId: 'sub-2', subjectName: 'Lengua', teacherId: 'tch-002', periodId: 'per-1', value: 85, weight: 1, createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'grd-003', studentId: 'stu-002', studentName: 'María García', subjectId: 'sub-1', subjectName: 'Matemáticas', teacherId: 'tch-001', periodId: 'per-1', value: 78, weight: 1, comment: 'Puede mejorar', createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'grd-004', studentId: 'stu-002', studentName: 'María García', subjectId: 'sub-3', subjectName: 'Inglés', teacherId: 'tch-006', periodId: 'per-1', value: 95, weight: 1, createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'grd-005', studentId: 'stu-003', studentName: 'José Martínez', subjectId: 'sub-1', subjectName: 'Matemáticas', teacherId: 'tch-001', periodId: 'per-1', value: 65, weight: 1.5, comment: 'Trabajo en clase', createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'grd-006', studentId: 'stu-004', studentName: 'Ana Rodríguez', subjectId: 'sub-4', subjectName: 'Biología', teacherId: 'tch-003', periodId: 'per-1', value: 88, weight: 1, createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'grd-007', studentId: 'stu-005', studentName: 'Luis Fernández', subjectId: 'sub-5', subjectName: 'Historia', teacherId: 'tch-004', periodId: 'per-1', value: 72, weight: 1, comment: 'Examen parcial', createdAt: '2025-04-02', updatedAt: '2025-04-02' },
  { id: 'grd-008', studentId: 'stu-009', studentName: 'Andrés Vargas', subjectId: 'sub-1', subjectName: 'Matemáticas', teacherId: 'tch-001', periodId: 'per-1', value: 91, weight: 2, createdAt: '2025-04-02', updatedAt: '2025-04-02' },
];

const MOCK_GRADES_RESPONSE: PaginatedResponse<Grade> = {
  data: MOCK_GRADES,
  total: 8,
  page: 1,
  limit: 10,
  totalPages: 1,
};

export default function Grades() {
  const [filters, setFilters] = useState<GradeFilters>({ page: 1, limit: 10 });
  const { data: apiData, isLoading, isError, error, refetch } = useGrades(filters);
  const data = apiData ?? (isLoading ? undefined : MOCK_GRADES_RESPONSE);

  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();
  const bulkCreateGrades = useBulkCreateGrades();

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [formData, setFormData] = useState<GradeCreateDTO>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkData, setBulkData] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (grade: Grade) => {
    setEditingId(grade.id);
    setFormData({
      studentId: grade.studentId,
      subjectId: grade.subjectId,
      teacherId: grade.teacherId,
      periodId: grade.periodId,
      value: grade.value,
      weight: grade.weight ?? 1,
      comment: grade.comment ?? '',
      evidenceUrl: grade.evidenceUrl ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateGrade.mutateAsync({ id: editingId, data: formData });
        toast({ title: 'Nota actualizada', variant: 'success' });
      } else {
        await createGrade.mutateAsync(formData);
        toast({ title: 'Nota creada', variant: 'success' });
      }
      setModalOpen(false);
    } catch {
      toast({ title: 'Error al guardar nota', variant: 'danger' });
    }
  };

  const handleBulkCreate = async () => {
    let parsed: GradeCreateDTO[];
    try {
      parsed = JSON.parse(bulkData);
    } catch {
      toast({ title: 'Formato JSON inválido', variant: 'danger' });
      return;
    }
    try {
      await bulkCreateGrades.mutateAsync(parsed);
      toast({ title: 'Notas creadas masivamente', variant: 'success' });
      setBulkModalOpen(false);
      setBulkData('');
    } catch {
      toast({ title: 'Error al crear notas masivas', variant: 'danger' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGrade.mutateAsync(deleteId);
      toast({ title: 'Nota eliminada', variant: 'success' });
      setDeleteId(null);
    } catch {
      toast({ title: 'Error al eliminar nota', variant: 'danger' });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nueva Nota
          </button>
          <button
            onClick={() => setBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Carga Masiva
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estudiante</label>
              <input
                type="text"
                placeholder="ID Estudiante"
                className="h-9 rounded-md border border-gray-300 px-3 text-sm"
                value={filters.studentId ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, studentId: e.target.value || undefined, page: 1 }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Asignatura</label>
              <input
                type="text"
                placeholder="ID Asignatura"
                className="h-9 rounded-md border border-gray-300 px-3 text-sm"
                value={filters.subjectId ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, subjectId: e.target.value || undefined, page: 1 }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Curso</label>
              <input
                type="text"
                placeholder="ID Curso"
                className="h-9 rounded-md border border-gray-300 px-3 text-sm"
                value={filters.courseId ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, courseId: e.target.value || undefined, page: 1 }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Periodo</label>
              <input
                type="text"
                placeholder="ID Periodo"
                className="h-9 rounded-md border border-gray-300 px-3 text-sm"
                value={filters.periodId ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, periodId: e.target.value || undefined, page: 1 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner />
          ) : isError && !data ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium text-red-600">Error al cargar las notas</p>
              <p className="text-sm text-gray-500">{(error as Error)?.message}</p>
              <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                Reintentar
              </button>
            </div>
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="Sin notas"
              description="No se encontraron notas con los filtros actuales."
              action={
                <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  <Plus className="h-4 w-4 inline mr-1" />
                  Crear primera nota
                </button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Estudiante</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Asignatura</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Valor</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Peso</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Comentario</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((grade: Grade) => {
                      const badge = getValueBadge(grade.value);
                      return (
                        <tr key={grade.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3">{grade.studentName ?? `#${grade.studentId.slice(0, 8)}`}</td>
                          <td className="px-4 py-3">{grade.subjectName ?? `#${grade.subjectId.slice(0, 8)}`}</td>
                          <td className="px-4 py-3">
                            <Badge variant={badge.variant}>
                              {grade.value} - {badge.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">{grade.weight ?? 1}</td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-gray-500">{grade.comment ?? '-'}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(grade.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditModal(grade)} className="p-2 text-gray-500 hover:text-blue-600" title="Editar">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button onClick={() => setDeleteId(grade.id)} className="p-2 text-gray-500 hover:text-red-600" title="Eliminar">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {data.totalPages > 1 && (
                <div className="border-t px-4 py-3">
                  <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditingId(null); } }} title={editingId ? 'Editar Nota' : 'Nueva Nota'}>
        <div className="space-y-4">
          {(['studentId', 'subjectId', 'teacherId', 'periodId'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('Id', ' ID')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={formData[field]}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              type="number" min={0} max={100} step={0.1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.value || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, value: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
            <input
              type="number" min={0.1} step={0.1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.weight}
              onChange={(e) => setFormData((prev) => ({ ...prev, weight: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.comment}
              onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); setEditingId(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={createGrade.isPending || updateGrade.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={bulkModalOpen} onOpenChange={(o) => { if (!o) setBulkModalOpen(false); }} title="Carga Masiva de Notas">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Ingresa un arreglo JSON con las notas a crear.</p>
          <pre className="rounded-md bg-gray-50 p-3 text-xs">{`[{ "studentId": "uuid", "subjectId": "uuid", "teacherId": "uuid", "periodId": "uuid", "value": 85 }]`}</pre>
          <textarea
            className="w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
            placeholder='[{ "studentId": "uuid-1", "subjectId": "uuid-2", ... }]'
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setBulkModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
            <button onClick={handleBulkCreate} disabled={bulkCreateGrades.isPending || !bulkData.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Crear Notas
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Nota"
        message="¿Estas seguro de eliminar esta nota? Esta accion no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={deleteGrade.isPending}
      />
    </div>
  );
}
