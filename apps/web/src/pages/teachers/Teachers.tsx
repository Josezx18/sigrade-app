import { useState, useEffect } from 'react';
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '../../hooks/useTeachers';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { toast } from '../../hooks/useToast';
import { Teacher, TeacherCreateDTO, TeacherUpdateDTO, TeacherFilters } from '../../services/teacherApi';
import { PaginatedResponse } from '../../lib/types';

const contractTypeLabels: Record<string, string> = {
  PERMANENT: 'Permanente',
  TEMPORARY: 'Temporal',
  PART_TIME: 'Medio Tiempo',
  INTERIM: 'Interino',
};

const emptyForm: TeacherCreateDTO = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dni: '',
  degree: '',
  specialization: '',
  hireDate: new Date().toISOString().split('T')[0],
  contractType: 'PERMANENT',
};

const MOCK_TEACHERS: Teacher[] = [
  { id: 'tch-001', userId: 'u-001', employeeCode: 'T001', firstName: 'Roberto', lastName: 'Gómez', email: 'roberto.gomez@school.edu', phone: '999888001', degree: 'Lic. Matemáticas', specialization: 'Álgebra', hireDate: '2020-03-15', contractType: 'PERMANENT', isActive: true, subjects: [{ id: 'sub-1', name: 'Matemáticas' }], createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'tch-002', userId: 'u-002', employeeCode: 'T002', firstName: 'Laura', lastName: 'Herrera', email: 'laura.herrera@school.edu', phone: '999888002', degree: 'Lic. Lengua', specialization: 'Literatura', hireDate: '2021-06-01', contractType: 'PERMANENT', isActive: true, subjects: [{ id: 'sub-2', name: 'Lengua' }], createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'tch-003', userId: 'u-003', employeeCode: 'T003', firstName: 'Pedro', lastName: 'Sánchez', email: 'pedro.sanchez@school.edu', phone: '999888003', degree: 'Lic. Ciencias', specialization: 'Biología', hireDate: '2022-02-20', contractType: 'TEMPORARY', isActive: true, subjects: [{ id: 'sub-4', name: 'Biología' }], createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'tch-004', userId: 'u-004', employeeCode: 'T004', firstName: 'Carmen', lastName: 'Vega', email: 'carmen.vega@school.edu', degree: 'Lic. Historia', specialization: 'Historia Universal', hireDate: '2023-08-15', contractType: 'PART_TIME', isActive: true, subjects: [{ id: 'sub-5', name: 'Historia' }], createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'tch-005', userId: 'u-005', employeeCode: 'T005', firstName: 'Miguel', lastName: 'Ríos', email: 'miguel.rios@school.edu', phone: '999888005', degree: 'Lic. Física', specialization: 'Física', hireDate: '2024-01-10', contractType: 'INTERIM', isActive: false, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'tch-006', userId: 'u-006', employeeCode: 'T006', firstName: 'Diana', lastName: 'Paredes', email: 'diana.paredes@school.edu', degree: 'Lic. Inglés', specialization: 'Inglés Avanzado', hireDate: '2021-11-05', contractType: 'PERMANENT', isActive: true, subjects: [{ id: 'sub-3', name: 'Inglés' }], createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

const MOCK_TEACHERS_RESPONSE: PaginatedResponse<Teacher> = {
  data: MOCK_TEACHERS,
  total: 6,
  page: 1,
  limit: 10,
  totalPages: 1,
};

export function Teachers() {
  const [filters, setFilters] = useState<TeacherFilters>({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const { data, isLoading, isError } = useTeachers(filters);
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const resolvedData = data ?? (isLoading ? undefined : MOCK_TEACHERS_RESPONSE);
  const teachers = resolvedData?.data ?? [];
  const total = resolvedData?.total ?? 0;
  const totalPages = resolvedData?.totalPages ?? 1;

  const handleSearch = (value: string) => {
    setSearch(value);
    setFilters((prev) => ({ ...prev, search: value || undefined, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCreate = async (formData: TeacherCreateDTO) => {
    try {
      await createTeacher.mutateAsync(formData);
      toast({ title: 'Docente creado', variant: 'success' });
      setShowModal(false);
    } catch {
      toast({ title: 'Error al crear docente', variant: 'danger' });
    }
  };

  const handleUpdate = async (formData: TeacherUpdateDTO) => {
    if (!editingTeacher) return;
    try {
      await updateTeacher.mutateAsync({ id: editingTeacher.id, data: formData });
      toast({ title: 'Docente actualizado', variant: 'success' });
      setShowModal(false);
      setEditingTeacher(null);
    } catch {
      toast({ title: 'Error al actualizar docente', variant: 'danger' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTeacher.mutateAsync(deleteId);
      toast({ title: 'Docente eliminado', variant: 'success' });
      setDeleteId(null);
    } catch {
      toast({ title: 'Error al eliminar docente', variant: 'danger' });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteTeacher.mutateAsync(id)));
      toast({ title: `${selectedIds.size} docentes eliminados`, variant: 'success' });
      setSelectedIds(new Set());
      setShowBulkDelete(false);
    } catch {
      toast({ title: 'Error al eliminar docentes', variant: 'danger' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === teachers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(teachers.map((t) => t.id)));
    }
  };

  const openCreateModal = () => {
    setEditingTeacher(null);
    setShowModal(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Docentes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de docentes y asignaciones</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo Docente
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <SearchInput value={search} onChange={handleSearch} placeholder="Buscar por nombre, email, código..." />
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={() => setShowBulkDelete(true)}
            className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Eliminar {selectedIds.size} seleccionados
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError && !resolvedData ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Error al cargar docentes</h3>
              <p className="text-sm text-gray-500 mb-4">Ocurrió un error al obtener la lista de docentes. Intente nuevamente.</p>
              <button
                onClick={() => setFilters({ ...filters })}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </CardContent>
        </Card>
      ) : teachers.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              }
              title="No hay docentes"
              description="No se encontraron docentes con los filtros actuales."
              action={
                <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  + Nuevo Docente
                </button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Listado de Docentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={teachers.length > 0 && selectedIds.size === teachers.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialización</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Contrato</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(teacher.id)}
                          onChange={() => toggleSelect(teacher.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{teacher.degree}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{teacher.employeeCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{teacher.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{teacher.specialization}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {contractTypeLabels[teacher.contractType] || teacher.contractType}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={teacher.isActive ? 'success' : 'danger'}>
                          {teacher.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditModal(teacher)}
                          className="text-sm text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteId(teacher.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={filters.page ?? 1}
              totalPages={totalPages}
              total={total}
              limit={filters.limit ?? 10}
              onPageChange={handlePageChange}
            />
          </CardContent>
        </Card>
      )}

      <TeacherFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingTeacher(null); }}
        onSubmit={editingTeacher ? handleUpdate : handleCreate}
        teacher={editingTeacher}
        loading={createTeacher.isPending || updateTeacher.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar docente"
        message="¿Está seguro de eliminar este docente? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={deleteTeacher.isPending}
      />

      <ConfirmDialog
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title="Eliminar docentes seleccionados"
        message={`¿Está seguro de eliminar ${selectedIds.size} docentes? Esta acción no se puede deshacer.`}
        confirmText="Eliminar todos"
        variant="danger"
        loading={deleteTeacher.isPending}
      />
    </div>
  );
}

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeacherCreateDTO) => void | Promise<void>;
  teacher: Teacher | null;
  loading: boolean;
}

function TeacherFormModal({ isOpen, onClose, onSubmit, teacher, loading }: TeacherFormModalProps) {
  const [formData, setFormData] = useState<TeacherCreateDTO>(emptyForm);

  useEffect(() => {
    if (teacher) {
      setFormData({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        dni: '',
        email: teacher.email,
        phone: teacher.phone ?? '',
        degree: teacher.degree,
        specialization: teacher.specialization,
        hireDate: teacher.hireDate.split('T')[0],
        contractType: teacher.contractType,
      });
    } else {
      setFormData(emptyForm);
    }
  }, [teacher, isOpen]);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={teacher ? 'Editar Docente' : 'Nuevo Docente'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
            <input
              type="text"
              value={formData.dni}
              onChange={(e) => updateField('dni', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={formData.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título/Grado *</label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => updateField('degree', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialización *</label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => updateField('specialization', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Contratación *</label>
            <input
              type="date"
              value={formData.hireDate}
              onChange={(e) => updateField('hireDate', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato *</label>
            <select
              value={formData.contractType}
              onChange={(e) => updateField('contractType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="PERMANENT">Permanente</option>
              <option value="TEMPORARY">Temporal</option>
              <option value="PART_TIME">Medio Tiempo</option>
              <option value="INTERIM">Interino</option>
            </select>
          </div>
        </div>

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
            {loading ? 'Guardando...' : teacher ? 'Actualizar' : 'Crear Docente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
