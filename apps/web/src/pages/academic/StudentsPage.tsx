import * as React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { studentApi, Student, StudentCreateDTO, StudentUpdateDTO, StudentFilters } from '../../services/studentApi';
import { PaginatedResponse } from '../../lib/types';
import { StudentTable } from '../../components/academic/StudentTable/StudentTable';
import { StudentForm } from '../../components/academic/StudentTable/StudentForm';
import { AlertModal, ConfirmModal } from '../../components/ui/Modal';

const MOCK_STUDENTS_PAGE: Student[] = [
  { id: 'stu-001', studentCode: 'S001', firstName: 'Carlos', lastName: 'López', dni: '12345678', email: 'carlos.lopez@email.com', phone: '999111000', birthDate: '2010-05-12', gender: 'M', gradeId: 'g-1', gradeName: '1° Primaria', section: 'A', enrollmentDate: '2025-03-01', status: 'ACTIVE', address: 'Av. Principal 123', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-002', studentCode: 'S002', firstName: 'María', lastName: 'García', dni: '23456789', email: 'maria.garcia@email.com', phone: '999111001', birthDate: '2011-08-22', gender: 'F', gradeId: 'g-2', gradeName: '2° Primaria', section: 'B', enrollmentDate: '2025-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-003', studentCode: 'S003', firstName: 'José', lastName: 'Martínez', dni: '34567890', email: 'jose.martinez@email.com', birthDate: '2010-11-03', gender: 'M', gradeId: 'g-3', gradeName: '3° Primaria', section: 'A', enrollmentDate: '2025-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-004', studentCode: 'S004', firstName: 'Ana', lastName: 'Rodríguez', dni: '45678901', email: 'ana.rodriguez@email.com', birthDate: '2012-02-14', gender: 'F', gradeId: 'g-1', gradeName: '1° Primaria', section: 'A', enrollmentDate: '2025-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-005', studentCode: 'S005', firstName: 'Luis', lastName: 'Fernández', dni: '56789012', email: 'luis.fernandez@email.com', birthDate: '2011-07-19', gender: 'M', gradeId: 'g-4', gradeName: '4° Primaria', section: 'B', enrollmentDate: '2024-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-006', studentCode: 'S006', firstName: 'Valentina', lastName: 'Díaz', dni: '89012345', email: 'valentina.diaz@email.com', birthDate: '2011-04-17', gender: 'F', gradeId: 'g-5', gradeName: '5° Primaria', section: 'B', enrollmentDate: '2024-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-007', studentCode: 'S007', firstName: 'Andrés', lastName: 'Vargas', dni: '90123456', email: 'andres.vargas@email.com', birthDate: '2010-01-08', gender: 'M', gradeId: 'g-6', gradeName: '6° Primaria', section: 'A', enrollmentDate: '2025-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'stu-008', studentCode: 'S008', firstName: 'Camila', lastName: 'Mendoza', dni: '01234567', email: 'camila.mendoza@email.com', birthDate: '2012-06-21', gender: 'F', gradeId: 'g-1', gradeName: '1° Primaria', section: 'B', enrollmentDate: '2025-03-01', status: 'ACTIVE', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

const MOCK_STUDENTS_PAGE_RESPONSE: PaginatedResponse<Student> = {
  data: MOCK_STUDENTS_PAGE,
  total: 8,
  page: 1,
  limit: 10,
  totalPages: 1,
};

export function StudentsPage() {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(25);
  const [search, setSearch] = React.useState('');
  const [gradeFilter, setGradeFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ student: Student } | null>(null);
  const [alert, setAlert] = React.useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const filters: StudentFilters = React.useMemo(() => ({
    search: search || undefined,
    gradeId: gradeFilter || undefined,
    status: statusFilter || undefined,
    page,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }), [search, gradeFilter, statusFilter, page, limit]);

  const { data: studentsResponse, isLoading, refetch } = useQuery<PaginatedResponse<Student>>({

    queryKey: ['students', filters],
    queryFn: () => studentApi.list(filters),
    placeholderData: (previous) => previous,
  });

  const createMutation = useMutation({
    mutationFn: (data: StudentCreateDTO) => studentApi.create(data),
    onSuccess: () => {
      refetch();
      setAlert({ message: 'Estudiante creado exitosamente', variant: 'success' });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setAlert({ message: err.response?.data?.message || 'Error al crear estudiante', variant: 'danger' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentUpdateDTO }) => studentApi.update(id, data),
    onSuccess: () => {
      refetch();
      setAlert({ message: 'Estudiante actualizado exitosamente', variant: 'success' });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setAlert({ message: err.response?.data?.message || 'Error al actualizar estudiante', variant: 'danger' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentApi.delete(id),
    onSuccess: () => {
      refetch();
      setDeleteConfirm(null);
      setAlert({ message: 'Estudiante eliminado exitosamente', variant: 'success' });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setDeleteConfirm(null);
      setAlert({ message: err.response?.data?.message || 'Error al eliminar estudiante', variant: 'danger' });
    },
  });

  const handleCreate = () => {
    setFormMode('create');
    setSelectedStudent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (student: Student) => {
    setFormMode('edit');
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleDelete = (student: Student) => {
    setDeleteConfirm({ student });
  };

  const handleView = (student: Student) => {
    // TODO: Navigate to student detail page
    console.log('View student:', student);
  };

  const handleFormSubmit = async (data: StudentCreateDTO | StudentUpdateDTO) => {
    if (formMode === 'create') {
      await createMutation.mutateAsync(data as StudentCreateDTO);
    } else if (selectedStudent) {
      await updateMutation.mutateAsync({ id: selectedStudent.id, data });
    }
    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.student.id);
    }
  };

  const handleExport = () => {
    studentApi.export(filters).then((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estudiantes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Estudiantes</h1>
        <p className="text-secondary-500 mt-1">Gestión de estudiantes del centro educativo</p>
      </div>

      {alert && (
        <AlertModal
          open={true}
          onOpenChange={() => setAlert(null)}
          title={alert.variant === 'success' ? 'Éxito' : 'Error'}
          message={alert.message}
          variant={alert.variant}
          confirmText="Entendido"
          onConfirm={() => setAlert(null)}
        />
      )}

      <StudentTable
        students={studentsResponse?.data ?? (!isLoading ? MOCK_STUDENTS_PAGE_RESPONSE.data : [])}
        total={studentsResponse?.total ?? (!isLoading ? MOCK_STUDENTS_PAGE_RESPONSE.total : 0)}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit: number) => { setLimit(newLimit); setPage(1); }}
        onSearch={setSearch}
        onFilterChange={(filters: { gradeId?: string; status?: string }) => {
          if (filters.gradeId !== undefined) setGradeFilter(filters.gradeId);
          if (filters.status !== undefined) setStatusFilter(filters.status);
          setPage(1);
        }}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onExport={handleExport}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <StudentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={formMode === 'create' ? 'Nuevo Estudiante' : 'Editar Estudiante'}
        submitLabel={formMode === 'create' ? 'Crear' : 'Actualizar'}
        initialData={formMode === 'edit' && selectedStudent ? {
          firstName: selectedStudent.firstName,
          lastName: selectedStudent.lastName,
          dni: selectedStudent.dni,
          email: selectedStudent.email,
          phone: selectedStudent.phone,
          birthDate: selectedStudent.birthDate.split('T')[0],
          gender: selectedStudent.gender,
          address: selectedStudent.address,
          gradeId: selectedStudent.gradeId,
          section: selectedStudent.section,
          enrollmentDate: selectedStudent.enrollmentDate.split('T')[0],
          parentName: selectedStudent.parentName,
          parentPhone: selectedStudent.parentPhone,
          parentEmail: selectedStudent.parentEmail,
        } : null}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {deleteConfirm && (
        <ConfirmModal
          open={true}
          onOpenChange={() => setDeleteConfirm(null)}
          title="Confirmar eliminación"
          message={`¿Estás seguro de que quieres eliminar al estudiante ${deleteConfirm.student.firstName} ${deleteConfirm.student.lastName}?`}
          variant="danger"
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}