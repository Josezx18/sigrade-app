import { useState, useMemo, useRef } from 'react';
import {
  Upload,
  Download,
  Trash2,
  Share2,
  Pencil,
  Search,
  FileText,
  Image,
  File,
  Film,
  FileSpreadsheet,
  Grid3X3,
  List,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { cn, formatBytes } from '../../lib/utils';
import { useFiles, useUploadFile, useDeleteFile } from '../../hooks/api/useFiles';
import type { FileItem } from '../../services/filesApi';
import { PaginatedResponse } from '../../lib/types';

type FileType = 'pdf' | 'image' | 'doc' | 'video' | 'spreadsheet' | 'other';

const FILE_TYPE_COLORS: Record<FileType, string> = {
  pdf: 'bg-red-100 text-red-700',
  image: 'bg-blue-100 text-blue-700',
  doc: 'bg-indigo-100 text-indigo-700',
  video: 'bg-purple-100 text-purple-700',
  spreadsheet: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

const FILE_TYPE_LABELS: Record<FileType, string> = {
  pdf: 'PDF',
  image: 'Imagen',
  doc: 'Documento',
  video: 'Video',
  spreadsheet: 'Hoja de Cálculo',
  other: 'Otro',
};

function getFileTypeIcon(type: FileType) {
  switch (type) {
    case 'pdf': return FileText;
    case 'image': return Image;
    case 'doc': return FileText;
    case 'video': return Film;
    case 'spreadsheet': return FileSpreadsheet;
    default: return File;
  }
}

function getFileTypeFromMime(mimeType: string): FileType {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('word') || mimeType.includes('document') || mimeType.startsWith('text/')) return 'doc';
  return 'other';
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Imagen' },
  { value: 'doc', label: 'Documento' },
  { value: 'video', label: 'Video' },
] as const;

const MOCK_FILES: FileItem[] = [
  { id: 'file-001', fileName: 'plan-anual-matematicas.pdf', originalName: 'Plan Anual Matemáticas.pdf', mimeType: 'application/pdf', size: 245760, bucket: 'sigrade-evidences', objectKey: '1/plan.pdf', url: '#', uploadedById: 'tch-001', createdAt: '2025-04-01', updatedAt: '2025-04-01' },
  { id: 'file-002', fileName: 'examen-parcial-lengua.docx', originalName: 'Examen Parcial Lengua.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 51200, bucket: 'sigrade-evidences', objectKey: '2/examen.docx', url: '#', uploadedById: 'tch-002', createdAt: '2025-04-02', updatedAt: '2025-04-02' },
  { id: 'file-003', fileName: 'lista-estudiantes.xlsx', originalName: 'Lista Estudiantes.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 102400, bucket: 'sigrade-evidences', objectKey: '3/lista.xlsx', url: '#', uploadedById: 'tch-001', createdAt: '2025-04-03', updatedAt: '2025-04-03' },
  { id: 'file-004', fileName: 'foto-escolar.jpg', originalName: 'Foto Escolar.jpg', mimeType: 'image/jpeg', size: 3145728, bucket: 'sigrade-evidences', objectKey: '4/foto.jpg', url: '#', uploadedById: 'tch-003', createdAt: '2025-04-04', updatedAt: '2025-04-04' },
  { id: 'file-005', fileName: 'informe-asistencia.xlsx', originalName: 'Informe Asistencia.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 204800, bucket: 'sigrade-evidences', objectKey: '5/informe.xlsx', url: '#', uploadedById: 'tch-004', createdAt: '2025-04-05', updatedAt: '2025-04-05' },
  { id: 'file-006', fileName: 'guias-ciencias.pdf', originalName: 'Guías Ciencias.pdf', mimeType: 'application/pdf', size: 524288, bucket: 'sigrade-evidences', objectKey: '6/guias.pdf', url: '#', uploadedById: 'tch-003', createdAt: '2025-04-06', updatedAt: '2025-04-06' },
];

const MOCK_FILES_RESPONSE: PaginatedResponse<FileItem> = {
  data: MOCK_FILES,
  total: 6,
  page: 1,
  limit: 20,
  totalPages: 1,
};

export function FileManager() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: filesData, isLoading, error } = useFiles();
  const resolvedData = filesData ?? (!isLoading ? MOCK_FILES_RESPONSE : undefined);
  const files = useMemo(() => resolvedData?.data ?? [], [resolvedData]);
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();

  const filteredFiles = useMemo(() => {
    let result = files;
    if (typeFilter !== 'all') {
      result = result.filter((f) => getFileTypeFromMime(f.mimeType) === typeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((f) => f.originalName.toLowerCase().includes(q));
    }
    return result;
  }, [files, typeFilter, search]);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (!target.files?.length) return;
    const file = target.files[0];
    uploadFile.mutate({ file });
    target.value = '';
  };

  const handleRename = () => {
    if (!selectedFile || !renameValue.trim()) return;
    setShowRenameModal(false);
    setSelectedFile(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteFile.mutate(deleteId);
    setDeleteId(null);
  };

  const FileIconComp = ({ type, className }: { type: FileType; className?: string }) => {
    const Icon = getFileTypeIcon(type);
    return <Icon className={cn('w-5 h-5', className)} />;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-DO');
  };

  if (isLoading) return <LoadingSpinner />;
  if (error && !resolvedData) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>Error al cargar archivos: {(error as Error).message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestor de Archivos</h1>
          <p className="text-sm text-gray-500 mt-1">Sube, organiza y comparte tus documentos</p>
        </div>
        <Button onClick={handleUpload} isLoading={uploadFile.isPending}>
          <Upload className="w-4 h-4" />
          Subir Archivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar archivos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'table' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 transition-colors border-l border-gray-300',
              viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <Card>
          <div className="p-12">
            <EmptyState
              icon={<File className="w-12 h-12" />}
              title="No hay archivos"
              description="No se encontraron archivos con los filtros actuales."
              action={
                <Button onClick={handleUpload}>
                  <Upload className="w-4 h-4" />
                  Subir Archivo
                </Button>
              }
            />
          </div>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFiles.map((file) => {
                  const fileType = getFileTypeFromMime(file.mimeType);
                  return (
                    <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg', FILE_TYPE_COLORS[fileType])}>
                            <FileIconComp type={fileType} />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[250px]">
                            {file.originalName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {FILE_TYPE_LABELS[fileType]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatBytes(file.size)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(file.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" title="Descargar">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Renombrar"
                            onClick={() => {
                              setSelectedFile(file);
                              setRenameValue(file.originalName);
                              setShowRenameModal(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Compartir"
                            onClick={() => {
                              setSelectedFile(file);
                              setShowShareModal(true);
                            }}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Eliminar"
                            onClick={() => setDeleteId(file.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFiles.map((file) => {
            const fileType = getFileTypeFromMime(file.mimeType);
            return (
              <Card key={file.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-3 rounded-xl', FILE_TYPE_COLORS[fileType])}>
                    <FileIconComp type={fileType} className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" title="Descargar">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Más opciones"
                      onClick={() => {
                        setSelectedFile(file);
                        setRenameValue(file.originalName);
                        setShowRenameModal(true);
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-900 truncate mb-1">{file.originalName}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px]">
                    {FILE_TYPE_LABELS[fileType]}
                  </Badge>
                  <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(file.createdAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={showRenameModal}
        onOpenChange={setShowRenameModal}
        title="Renombrar Archivo"
        size="sm"
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="Nuevo nombre"
        />
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowRenameModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleRename} disabled={!renameValue.trim()}>
            Renombrar
          </Button>
        </div>
      </Modal>

      <Modal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        title="Compartir Archivo"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          Compartir <span className="font-medium text-gray-900">{selectedFile?.originalName}</span>
        </p>
        <Input
          placeholder="Email del destinatario"
          label="Compartir con"
        />
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowShareModal(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setShowShareModal(false)}>
            Compartir
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar archivo"
        message="¿Está seguro de eliminar este archivo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}