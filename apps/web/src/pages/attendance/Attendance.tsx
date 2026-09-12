import { useState } from 'react';
import { Plus, UserCheck } from 'lucide-react';
import { useAttendanceRecords, useCreateAttendance, useUpdateAttendance, useDeleteAttendance, useBulkCreateAttendance } from '../../hooks/useAttendance';
import { AttendanceRecord, AttendanceCreateDTO, AttendanceFilters } from '../../services/attendanceApi';
import { PaginatedResponse } from '../../lib/types';
import { toast } from '../../hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const STATUS_VARIANTS: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LATE: 'warning',
  EXCUSED: 'info',
};

const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Tardanza',
  EXCUSED: 'Justificado',
};

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-001', studentId: 'stu-001', studentName: 'Carlos López', courseId: 'crs-1', subjectId: 'sub-1', subjectName: 'Matemáticas', date: '2025-04-01', status: 'PRESENT', createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'att-002', studentId: 'stu-002', studentName: 'María García', courseId: 'crs-1', subjectId: 'sub-1', subjectName: 'Matemáticas', date: '2025-04-01', status: 'PRESENT', createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'att-003', studentId: 'stu-003', studentName: 'José Martínez', courseId: 'crs-1', subjectId: 'sub-1', subjectName: 'Matemáticas', date: '2025-04-01', status: 'ABSENT', justification: 'Enfermedad', createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'att-004', studentId: 'stu-004', studentName: 'Ana Rodríguez', courseId: 'crs-1', subjectId: 'sub-2', subjectName: 'Lengua', date: '2025-04-01', status: 'LATE', hour: 1, createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'att-005', studentId: 'stu-005', studentName: 'Luis Fernández', courseId: 'crs-1', subjectId: 'sub-2', subjectName: 'Lengua', date: '2025-04-01', status: 'PRESENT', createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'att-006', studentId: 'stu-006', studentName: 'Sofía Torres', courseId: 'crs-1', subjectId: 'sub-1', subjectName: 'Matemáticas', date: '2025-04-01', status: 'EXCUSED', justification: 'Cita médica', createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'att-007', studentId: 'stu-007', studentName: 'Diego Ramírez', courseId: 'crs-2', subjectId: 'sub-3', subjectName: 'Inglés', date: '2025-04-02', status: 'PRESENT', createdAt: '2025-04-02', updatedAt: '2025-04-02' },
  { id: 'att-008', studentId: 'stu-009', studentName: 'Andrés Vargas', courseId: 'crs-2', subjectId: 'sub-3', subjectName: 'Inglés', date: '2025-04-02', status: 'PRESENT', createdAt: '2025-04-02', updatedAt: '2025-04-02' },
];

const MOCK_ATTENDANCE_RESPONSE: PaginatedResponse<AttendanceRecord> = {
  data: MOCK_ATTENDANCE,
  total: 8,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const emptyForm: AttendanceCreateDTO = {
  studentId: '',
  courseId: '',
  subjectId: '',
  date: '',
  hour: undefined,
  status: 'PRESENT',
  justification: '',
};

export default function Attendance() {
  const [filters, setFilters] = useState<AttendanceFilters>({ page: 1, limit: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceRecord | null>(null);
  const [form, setForm] = useState<AttendanceCreateDTO>(emptyForm);
  const [bulkCourseId, setBulkCourseId] = useState('');
  const [bulkDate, setBulkDate] = useState('');
  const [bulkSubjectId, setBulkSubjectId] = useState('');

  const { data: apiData, isLoading, error, refetch } = useAttendanceRecords(filters);
  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();
  const deleteMutation = useDeleteAttendance();
  const bulkCreateMutation = useBulkCreateAttendance();

  const resolvedData = apiData ?? (isLoading ? undefined : MOCK_ATTENDANCE_RESPONSE);
  const records = resolvedData?.data ?? [];
  const totalPages = resolvedData?.totalPages ?? 1;
  const currentPage = resolvedData?.page ?? 1;

  const handleFilterChange = (key: keyof AttendanceFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setForm({
      studentId: record.studentId,
      courseId: record.courseId,
      subjectId: record.subjectId ?? undefined,
      date: record.date,
      hour: record.hour ?? undefined,
      status: record.status,
      justification: record.justification ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.studentId || !form.courseId || !form.date) {
      toast({ title: 'Complete los campos obligatorios', variant: 'danger' });
      return;
    }
    try {
      if (editingRecord) {
        await updateMutation.mutateAsync({ id: editingRecord.id, data: form });
        toast({ title: 'Asistencia actualizada', variant: 'success' });
      } else {
        await createMutation.mutateAsync(form);
        toast({ title: 'Asistencia registrada', variant: 'success' });
      }
      setModalOpen(false);
    } catch {
      toast({ title: 'Error al guardar asistencia', variant: 'danger' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: 'Asistencia eliminada', variant: 'success' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Error al eliminar asistencia', variant: 'danger' });
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkCourseId || !bulkDate) {
      toast({ title: 'Complete curso y fecha', variant: 'danger' });
      return;
    }
    const payload: AttendanceCreateDTO[] = [
      {
        studentId: bulkCourseId,
        courseId: bulkCourseId,
        date: bulkDate,
        subjectId: bulkSubjectId || undefined,
        status: 'PRESENT',
      },
    ];
    try {
      await bulkCreateMutation.mutateAsync(payload);
      toast({ title: 'Asistencias registradas', variant: 'success' });
      setBulkModalOpen(false);
    } catch {
      toast({ title: 'Error al registrar asistencias', variant: 'danger' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !resolvedData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-red-600 mb-4">Error al cargar las asistencias</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            Reintentar
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setBulkModalOpen(true); setBulkCourseId(''); setBulkDate(''); setBulkSubjectId(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            <UserCheck className="w-4 h-4" />
            Registro masivo
          </button>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            <Plus className="w-4 h-4" />
            Nueva asistencia
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" value={filters.date ?? ''} onChange={(e) => handleFilterChange('date', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={filters.status ?? ''} onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
              <input type="text" value={filters.courseId ?? ''} onChange={(e) => handleFilterChange('courseId', e.target.value || undefined)}
                placeholder="ID del curso"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <EmptyState
              title="No hay asistencias"
              description="No se encontraron registros con los filtros actuales."
              action={
                <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                  Registrar asistencia
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Estudiante</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Asignatura</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Hora</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Justificación</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{record.studentName ?? record.studentId}</td>
                      <td className="px-4 py-3">{record.subjectName ?? record.subjectId ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{record.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{record.hour ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANTS[record.status]}>{STATUS_LABELS[record.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate">{record.justification ?? '—'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => openEditModal(record)} className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium">Editar</button>
                        <button onClick={() => setDeleteTarget(record)} className="text-red-600 hover:text-red-800 text-sm font-medium">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination page={currentPage} totalPages={totalPages} total={resolvedData?.total ?? 0} limit={filters.limit ?? 10}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      )}

      <Modal open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditingRecord(null); } }}
        title={editingRecord ? 'Editar asistencia' : 'Nueva asistencia'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante *</label>
            <input type="text" value={form.studentId} onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
              placeholder="ID del estudiante"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
            <input type="text" value={form.courseId} onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))}
              placeholder="ID del curso"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura</label>
            <input type="text" value={form.subjectId ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
              placeholder="ID de la asignatura"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as AttendanceCreateDTO['status'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Justificación</label>
            <textarea value={form.justification ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, justification: e.target.value }))}
              placeholder="Opcional" rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => { setModalOpen(false); setEditingRecord(null); }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {editingRecord ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={bulkModalOpen} onOpenChange={(o) => { if (!o) setBulkModalOpen(false); }} title="Registro masivo de asistencias" size="lg">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
              <input type="text" value={bulkCourseId} onChange={(e) => setBulkCourseId(e.target.value)}
                placeholder="ID del curso"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura</label>
              <input type="text" value={bulkSubjectId} onChange={(e) => setBulkSubjectId(e.target.value)}
                placeholder="ID de la asignatura"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button onClick={handleBulkSubmit} disabled={bulkCreateMutation.isPending || !bulkCourseId || !bulkDate}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
              {bulkCreateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar asistencia"
        message={`¿Está seguro de eliminar la asistencia de ${deleteTarget?.studentName ?? deleteTarget?.studentId} del ${deleteTarget?.date}?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
