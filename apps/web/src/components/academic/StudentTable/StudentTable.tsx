import * as React from 'react';
import {
  Table,
  TableContainer,
  Column,
  TableProps,
} from '../../ui/Table';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/Select';
import { Search, Plus, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Student } from '../../../services/studentApi';

export interface StudentTableProps extends Omit<TableProps<Student>, 'data' | 'columns' | 'keyExtractor'> {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearch: (search: string) => void;
  onFilterChange: (filters: { gradeId?: string; status?: string }) => void;
  onCreate: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onView: (student: Student) => void;
  onExport: () => void;
  isLoading?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export function StudentTable({
  students,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onSearch,
  onFilterChange,
  onCreate,
  onEdit,
  onDelete,
  onView,
  onExport,
  isLoading = false,
  selectedIds = new Set(),
  onSelectionChange,
}: StudentTableProps) {
  const [search, setSearch] = React.useState('');
  const [gradeFilter, setGradeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const columns = React.useMemo<Column<Student>[]>(() => [
    {
      key: 'select',
      header: '',
      accessor: () => '',
      width: '50px',
      sortable: false,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={(e) => {
            const newSelected = new Set(selectedIds);
            if (e.target.checked) {
              newSelected.add(row.id);
            } else {
              newSelected.delete(row.id);
            }
            onSelectionChange?.(newSelected);
          }}
        />
      ),
    },
    {
      key: 'studentCode',
      header: 'Código',
      accessor: 'studentCode',
      width: '120px',
      sortable: true,
    },
    {
      key: 'name',
      header: 'Nombre',
      accessor: (row) => `${row.firstName} ${row.lastName}`,
      sortable: true,
    },
    {
      key: 'dni',
      header: 'DNI',
      accessor: 'dni',
      width: '120px',
    },
    {
      key: 'email',
      header: 'Email',
      accessor: 'email',
      width: '200px',
    },
    {
      key: 'grade',
      header: 'Grado/Sección',
      accessor: (row) => row.gradeName ? `${row.gradeName}${row.section ? ` - ${row.section}` : ''}` : 'Sin asignar',
      width: '150px',
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: 'status',
      width: '120px',
      render: (value) => {
        const statusConfig: Record<string, { label: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' }> = {
          ACTIVE: { label: 'Activo', variant: 'success' },
          INACTIVE: { label: 'Inactivo', variant: 'secondary' },
          GRADUATED: { label: 'Graduado', variant: 'primary' },
          TRANSFERRED: { label: 'Trasladado', variant: 'warning' },
        };
        const config = statusConfig[value as string] || { label: value as string, variant: 'outline' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'enrollmentDate',
      header: 'Ingreso',
      accessor: (row) => new Date(row.enrollmentDate).toLocaleDateString('es-DO'),
      width: '120px',
    },
    {
      key: 'actions',
      header: 'Acciones',
      accessor: () => '',
      width: '150px',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onView(row)} title="Ver">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(row)} title="Editar">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(row)} title="Eliminar" className="text-danger-600 hover:text-danger-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      ),
    },
  ], [selectedIds, onSelectionChange, onView, onEdit, onDelete]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearch(value);
  };

  const handleGradeChange = (value: string) => {
    setGradeFilter(value);
    onFilterChange({ gradeId: value === 'all' ? undefined : value, status: statusFilter === 'all' ? undefined : statusFilter });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onFilterChange({ gradeId: gradeFilter === 'all' ? undefined : gradeFilter, status: value === 'all' ? undefined : value });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onCreate} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Estudiante
          </Button>
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar estudiantes..."
              className="input pl-10"
            />
          </div>
          <Select value={gradeFilter} onValueChange={handleGradeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los grados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los grados</SelectItem>
              <SelectItem value="1">1er Grado</SelectItem>
              <SelectItem value="2">2do Grado</SelectItem>
              <SelectItem value="3">3er Grado</SelectItem>
              <SelectItem value="4">4to Grado</SelectItem>
              <SelectItem value="5">5to Grado</SelectItem>
              <SelectItem value="6">6to Grado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="INACTIVE">Inactivo</SelectItem>
              <SelectItem value="GRADUATED">Graduado</SelectItem>
              <SelectItem value="TRANSFERRED">Trasladado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TableContainer>
        <Table
          columns={columns}
          data={students}
          keyExtractor={(row: Student) => row.id}
          striped
          hoverable
          bordered
          loading={isLoading}
          emptyMessage="No se encontraron estudiantes"
          selectionMode={onSelectionChange ? 'multiple' : 'none'}
          selectedRows={selectedIds}
          onSelectionChange={onSelectionChange}
        />
      </TableContainer>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-secondary-600">
          Mostrando {students.length} de {total} estudiantes
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="input w-auto"
          >
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

