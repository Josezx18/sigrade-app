import { useState, useEffect } from 'react';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useBulkDeleteStudents } from '../../hooks/useStudents';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { toast } from '../../hooks/useToast';
import { Student, StudentCreateDTO, StudentUpdateDTO, StudentFilters } from '../../services/studentApi';
import { PaginatedResponse } from '../../lib/types';

const statusBadge: Record<string, { label: string; variant: 'success' | 'danger' | 'info' | 'warning' }> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  INACTIVE: { label: 'Inactivo', variant: 'danger' },
  GRADUATED: { label: 'Graduado', variant: 'info' },
  TRANSFERRED: { label: 'Transferido', variant: 'warning' },
};

const emptyForm: StudentCreateDTO = {
  firstName: '',
  lastName: '',
  dni: '',
  email: '',
  birthDate: '',
  gender: 'M',
  gradeId: '',
  enrollmentDate: new Date().toISOString().split('T')[0],
};

const MOCK_STUDENTS: Student[] = [
  { id: 'stu-001', studentCode: 'S001', firstName: 'Carlos', lastName: 'López', dni: '12345678', email: 'carlos.lopez@email.com', phone: '999111000', birthDate: '2010-05-12', gender: 'M', gradeId: 'g-1', gradeName: '1° Primaria', section: 'A', enrollmentDate: '2025-03-01', status: 'ACTIVE', address: 'Av. Principal 123', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-002', studentCode: 'S002', firstName: 'María', lastName: 'García', dni: '23456789', email: 'maria.garcia@email.com', phone: '999111001', birthDate: '2011-08-22', gender: 'F', gradeId: 'g-2', gradeName: '2° Primaria', section: 'B', enrollmentDate: '2025-03-01', status: 'ACTIVE', address: 'Calle Los Olivos 456', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-003', studentCode: 'S003', firstName: 'José', lastName: 'Martínez', dni: '34567890', email: 'jose.martinez@email.com', birthDate: '2010-11-03', gender: 'M', gradeId: 'g-3', gradeName: '3° Primaria', section: 'A', enrollmentDate: '2025-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-004', studentCode: 'S004', firstName: 'Ana', lastName: 'Rodríguez', dni: '45678901', email: 'ana.rodriguez@email.com', birthDate: '2012-02-14', gender: 'F', gradeId: 'g-1', gradeName: '1° Primaria', section: 'A', enrollmentDate: '2025-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-005', studentCode: 'S005', firstName: 'Luis', lastName: 'Fernández', dni: '56789012', email: 'luis.fernandez@email.com', birthDate: '2011-07-19', gender: 'M', gradeId: 'g-4', gradeName: '4° Primaria', section: 'B', enrollmentDate: '2024-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-006', studentCode: 'S006', firstName: 'Sofía', lastName: 'Torres', dni: '67890123', email: 'sofia.torres@email.com', birthDate: '2010-09-30', gender: 'F', gradeId: 'g-3', gradeName: '3° Primaria', section: 'A', enrollmentDate: '2025-03-01', status: 'INACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-007', studentCode: 'S007', firstName: 'Diego', lastName: 'Ramírez', dni: '78901234', email: 'diego.ramirez@email.com', birthDate: '2012-12-25', gender: 'M', gradeId: 'g-2', gradeName: '2° Primaria', section: 'A', enrollmentDate: '2025-03-01', status: 'GRADUATED', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-008', studentCode: 'S008', firstName: 'Valentina', lastName: 'Díaz', dni: '89012345', email: 'valentina.diaz@email.com', birthDate: '2011-04-17', gender: 'F', gradeId: 'g-5', gradeName: '5° Primaria', section: 'B', enrollmentDate: '2024-03-01', status: 'TRANSFERRED', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-009', studentCode: 'S009', firstName: 'Andrés', lastName: 'Vargas', dni: '90123456', email: 'andres.vargas@email.com', birthDate: '2010-01-08', gender: 'M', gradeId: 'g-6', gradeName: '6° Primaria', section: 'A', enrollmentDate: '2025-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-010', studentCode: 'S010', firstName: 'Camila', lastName: 'Mendoza', dni: '01234567', email: 'camila.mendoza@email.com', birthDate: '2012-06-21', gender: 'F', gradeId: 'g-1', gradeName: '1° Primaria', section: 'B', enrollmentDate: '2025-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

const MOCK_STUDENTS_RESPONSE: PaginatedResponse<Student> = {
  data: MOCK_STUDENTS,
  total: 10,
  page: 1,
  limit: 10,
  totalPages: 1,
};

export function Students() {
  const [filters, setFilters] = useState<StudentFilters>({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const { data, isLoading } = useStudents(filters);
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const bulkDeleteStudents = useBulkDeleteStudents();

  const resolvedData = data ?? (isLoading ? undefined : MOCK_STUDENTS_RESPONSE);
  const students = resolvedData?.data ?? [];
  const total = resolvedData?.total ?? 0;
  const totalPages = resolvedData?.totalPages ?? 1;

  const handleSearch = (value: string) => {
    setSearch(value);
    setFilters((prev) => ({ ...prev, search: value || undefined, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCreate = async (formData: StudentCreateDTO) => {
    try {
      await createStudent.mutateAsync(formData);
      toast({ title: 'Estudiante creado', variant: 'success' });
      setShowModal(false);
    } catch {
      toast({ title: 'Error al crear estudiante', variant: 'danger' });
    }
  };

  const handleUpdate = async (formData: StudentUpdateDTO) => {
    if (!editingStudent) return;
    try {
      await updateStudent.mutateAsync({ id: editingStudent.id, data: formData });
      toast({ title: 'Estudiante actualizado', variant: 'success' });
      setShowModal(false);
      setEditingStudent(null);
    } catch {
      toast({ title: 'Error al actualizar estudiante', variant: 'danger' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStudent.mutateAsync(deleteId);
      toast({ title: 'Estudiante eliminado', variant: 'success' });
      setDeleteId(null);
    } catch {
      toast({ title: 'Error al eliminar estudiante', variant: 'danger' });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteStudents.mutateAsync(Array.from(selectedIds));
      toast({ title: `${selectedIds.size} estudiantes eliminados`, variant: 'success' });
      setSelectedIds(new Set());
      setShowBulkDelete(false);
    } catch {
      toast({ title: 'Error al eliminar estudiantes', variant: 'danger' });
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
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de estudiantes y matrículas</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo Estudiante
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <SearchInput value={search} onChange={handleSearch} placeholder="Buscar por nombre, DNI, email..." />
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
      ) : students.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title="No hay estudiantes"
              description="No se encontraron estudiantes con los filtros actuales."
              action={
                <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  + Nuevo Estudiante
                </button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Listado de Estudiantes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={students.length > 0 && selectedIds.size === students.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Género</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(student.id)}
                          onChange={() => toggleSelect(student.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        {student.gradeName && <div className="text-xs text-gray-500">{student.gradeName}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.dni}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.gender === 'M' ? 'Masculino' : 'Femenino'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadge[student.status].variant}>
                          {statusBadge[student.status].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setEditingStudent(student); setShowModal(true); }}
                          className="text-sm text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteId(student.id)}
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

      <StudentFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingStudent(null); }}
        onSubmit={editingStudent ? handleUpdate : handleCreate}
        student={editingStudent}
        loading={createStudent.isPending || updateStudent.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar estudiante"
        message="¿Está seguro de eliminar este estudiante? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={deleteStudent.isPending}
      />

      <ConfirmDialog
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title="Eliminar estudiantes seleccionados"
        message={`¿Está seguro de eliminar ${selectedIds.size} estudiantes? Esta acción no se puede deshacer.`}
        confirmText="Eliminar todos"
        variant="danger"
        loading={bulkDeleteStudents.isPending}
      />
    </div>
  );
}

function StudentFormModal({
  isOpen,
  onClose,
  onSubmit,
  student,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentCreateDTO) => void | Promise<void>;
  student: Student | null;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<StudentCreateDTO>(emptyForm);

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        dni: student.dni,
        email: student.email,
        phone: student.phone,
        birthDate: student.birthDate.split('T')[0],
        gender: student.gender,
        gradeId: student.gradeId,
        enrollmentDate: student.enrollmentDate.split('T')[0],
        address: student.address,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
      });
    } else {
      setFormData(emptyForm);
    }
  }, [student, isOpen]);

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
      title={student ? 'Editar Estudiante' : 'Nuevo Estudiante'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Género *</label>
            <select
              value={formData.gender}
              onChange={(e) => updateField('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento *</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => updateField('birthDate', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Matrícula *</label>
            <input
              type="date"
              value={formData.enrollmentDate}
              onChange={(e) => updateField('enrollmentDate', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input
            type="text"
            value={formData.address || ''}
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Información del Padre/Madre/Tutor</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Tutor</label>
              <input
                type="text"
                value={formData.parentName || ''}
                onChange={(e) => updateField('parentName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono del Tutor</label>
              <input
                type="text"
                value={formData.parentPhone || ''}
                onChange={(e) => updateField('parentPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
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
            {loading ? 'Guardando...' : student ? 'Actualizar' : 'Crear Estudiante'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
