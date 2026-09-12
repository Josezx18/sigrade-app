import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Send, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePlannings, useCreatePlanning, useUpdatePlanning, useDeletePlanning, useSubmitPlanning, useApprovePlanning, useRejectPlanning } from '../../hooks/usePlanning';
import type { Planning as PlanningType, PlanningCreateDTO, PlanningFilters } from '../../services/planningApi';
import { toast } from '../../hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const statusBadge: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  DRAFT: { label: 'Borrador', variant: 'default' },
  SUBMITTED: { label: 'En revisión', variant: 'warning' },
  APPROVED: { label: 'Aprobado', variant: 'success' },
  REJECTED: { label: 'Rechazado', variant: 'danger' },
};

const emptyForm: PlanningCreateDTO = {
  teacherId: '',
  courseSubjectId: '',
  periodId: '',
  title: '',
  description: '',
  objectives: '',
  methodology: '',
  resources: '',
  totalSessions: 1,
};

export default function Planning() {
  const { user } = useAuth();
  const userRoles = user?.roles?.map(r => r.type) ?? [];
  const canApprove = userRoles.some(r => ['SCHOOL_DIRECTOR', 'VICE_DIRECTOR', 'SUPER_ADMIN'].includes(r));
  const canCreate = userRoles.some(r => ['TEACHER', 'COORDINATOR', 'SUPER_ADMIN'].includes(r));

  const [filters, setFilters] = useState<PlanningFilters>({ page: 1, limit: 10 });
  const { data, isLoading } = usePlannings(filters);
  const createPlanning = useCreatePlanning();
  const updatePlanning = useUpdatePlanning();
  const deletePlanning = useDeletePlanning();
  const submitPlanning = useSubmitPlanning();
  const approvePlanning = useApprovePlanning();
  const rejectPlanning = useRejectPlanning();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanningCreateDTO>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const plannings = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (p: PlanningType) => {
    setEditingId(p.id);
    setFormData({
      teacherId: p.teacherId,
      courseSubjectId: p.courseSubjectId,
      periodId: p.periodId,
      title: p.title,
      description: p.description ?? '',
      objectives: p.objectives ?? '',
      methodology: p.methodology ?? '',
      resources: p.resources ?? '',
      totalSessions: p.totalSessions ?? 1,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updatePlanning.mutateAsync({ id: editingId, data: formData });
        toast({ title: 'Planificación actualizada', variant: 'success' });
      } else {
        await createPlanning.mutateAsync(formData);
        toast({ title: 'Planificación creada', variant: 'success' });
      }
      setShowModal(false);
    } catch {
      toast({ title: 'Error al guardar planificación', variant: 'danger' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePlanning.mutateAsync(deleteId);
      toast({ title: 'Planificación eliminada', variant: 'success' });
      setDeleteId(null);
    } catch {
      toast({ title: 'Error al eliminar', variant: 'danger' });
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitPlanning.mutateAsync(id);
      toast({ title: 'Planificación enviada a revisión', variant: 'success' });
    } catch {
      toast({ title: 'Error al enviar', variant: 'danger' });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePlanning.mutateAsync(id);
      toast({ title: 'Planificación aprobada', variant: 'success' });
    } catch {
      toast({ title: 'Error al aprobar', variant: 'danger' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectPlanning.mutateAsync(id);
      toast({ title: 'Planificación rechazada', variant: 'success' });
    } catch {
      toast({ title: 'Error al rechazar', variant: 'danger' });
    }
  };

  const filtered = statusFilter ? plannings.filter((p) => p.status === statusFilter) : plannings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planificación Docente</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de planificaciones y sesiones de clase</p>
        </div>
        {canCreate && <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4 inline mr-1" /> Nueva Planificación
        </button>}
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="SUBMITTED">En revisión</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <Card><CardContent>
          <EmptyState title="Sin planificaciones" description="No hay planificaciones registradas."
            action={canCreate ? <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Crear planificación</button> : undefined} />
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Título</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Docente</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Asignatura</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Período</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                      <td className="px-4 py-3 text-gray-600">{p.teacher?.user?.firstName} {p.teacher?.user?.lastName}</td>
                      <td className="px-4 py-3 text-gray-600">{p.courseSubject?.subject?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.period?.name}</td>
                      <td className="px-4 py-3"><Badge variant={statusBadge[p.status]?.variant}>{statusBadge[p.status]?.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === 'DRAFT' && (
                            <>
                              <button onClick={() => openEditModal(p)} className="p-1.5 text-gray-500 hover:text-blue-600" title="Editar"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => handleSubmit(p.id)} className="p-1.5 text-gray-500 hover:text-green-600" title="Enviar a revisión"><Send className="h-4 w-4" /></button>
                              <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-gray-500 hover:text-red-600" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                            </>
                          )}
                          {p.status === 'SUBMITTED' && canApprove && (
                            <>
                              <button onClick={() => handleApprove(p.id)} className="p-1.5 text-gray-500 hover:text-green-600" title="Aprobar"><CheckCircle className="h-4 w-4" /></button>
                              <button onClick={() => handleReject(p.id)} className="p-1.5 text-gray-500 hover:text-red-600" title="Rechazar"><XCircle className="h-4 w-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && <Pagination page={filters.page ?? 1} totalPages={totalPages} total={data?.total ?? 0} limit={filters.limit ?? 10} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />}
          </CardContent>
        </Card>
      )}

      <Modal open={showModal} onOpenChange={(o) => { if (!o) { setShowModal(false); setEditingId(null); } }} title={editingId ? 'Editar Planificación' : 'Nueva Planificación'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Docente ID *</label>
              <input type="text" value={formData.teacherId} onChange={(e) => setFormData((prev) => ({ ...prev, teacherId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso-Asignatura ID *</label>
              <input type="text" value={formData.courseSubjectId} onChange={(e) => setFormData((prev) => ({ ...prev, courseSubjectId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período ID *</label>
              <input type="text" value={formData.periodId} onChange={(e) => setFormData((prev) => ({ ...prev, periodId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={formData.description ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivos</label>
            <textarea value={formData.objectives ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, objectives: e.target.value }))} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metodología</label>
              <input type="text" value={formData.methodology ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, methodology: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Sesiones</label>
              <input type="number" min={1} value={formData.totalSessions ?? 1} onChange={(e) => setFormData((prev) => ({ ...prev, totalSessions: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
            <button onClick={handleSave} disabled={createPlanning.isPending || updatePlanning.isPending}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Eliminar planificación" message="¿Está seguro de eliminar esta planificación?"
        confirmText="Eliminar" variant="danger" loading={deletePlanning.isPending} />
    </div>
  );
}
