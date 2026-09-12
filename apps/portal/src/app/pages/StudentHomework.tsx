import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@sigrade/ui';
import { BookOpen, CheckCircle2, Clock, FileText, ArrowLeft } from 'lucide-react';

interface HomeworkItem {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
}

const MOCK_HOMEWORK: HomeworkItem[] = [
  { id: '1', subject: 'Matemáticas', title: 'Ecuaciones cuadráticas', description: 'Resolver 20 ejercicios del libro páginas 45-48.', dueDate: '18 Jul 2026', status: 'pending' },
  { id: '2', subject: 'Lengua Española', title: 'Ensayo literario', description: 'Escribir un ensayo sobre El Quijote (mínimo 500 palabras).', dueDate: '20 Jul 2026', status: 'pending' },
  { id: '3', subject: 'Ciencias Sociales', title: 'Mapa conceptual', description: 'Realizar un mapa conceptual de la Revolución Industrial.', dueDate: '16 Jul 2026', status: 'submitted' },
  { id: '4', subject: 'Inglés', title: 'Verb tenses worksheet', description: 'Complete the worksheet on past, present and future tenses.', dueDate: '14 Jul 2026', status: 'graded', grade: 92 },
  { id: '5', subject: 'Matemáticas', title: 'Problemas de álgebra', description: 'Resolver problemas de álgebra lineal del capítulo 3.', dueDate: '10 Jul 2026', status: 'graded', grade: 88 },
  { id: '6', subject: 'Educación Física', title: 'Informe deportivo', description: 'Escribir un informe sobre los beneficios del ejercicio físico.', dueDate: '22 Jul 2026', status: 'pending' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'info' | 'success'; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', variant: 'warning', icon: Clock },
  submitted: { label: 'Entregado', variant: 'info', icon: FileText },
  graded: { label: 'Calificado', variant: 'success', icon: CheckCircle2 },
};

type FilterType = 'all' | 'pending' | 'submitted' | 'graded';

export function StudentHomework() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selected, setSelected] = useState<HomeworkItem | null>(null);

  const filtered = filter === 'all'
    ? MOCK_HOMEWORK
    : MOCK_HOMEWORK.filter((h) => h.status === filter);

  if (selected) {
    const statusInfo = STATUS_CONFIG[selected.status];
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a tareas
        </button>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{selected.subject}</p>
                <CardTitle className="text-xl mt-1">{selected.title}</CardTitle>
              </div>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Descripción</p>
              <p className="text-sm text-gray-600 mt-1">{selected.description}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Fecha de entrega: {selected.dueDate}</span>
              </div>
              {selected.grade !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-700">Calificación:</span>
                  <span className={`font-bold text-lg ${
                    selected.grade >= 90 ? 'text-green-600' : selected.grade >= 80 ? 'text-blue-600' : 'text-amber-600'
                  }`}>{selected.grade}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
        <p className="text-gray-500 mt-1">Gestiona tus tareas y trabajos escolares</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'submitted', 'graded'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'submitted' ? 'Entregadas' : 'Calificadas'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((hw) => {
          const statusInfo = STATUS_CONFIG[hw.status];
          return (
            <button
              key={hw.id}
              onClick={() => setSelected(hw)}
              className="w-full text-left"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 ${
                        hw.status === 'pending' ? 'bg-amber-50' : hw.status === 'submitted' ? 'bg-blue-50' : 'bg-green-50'
                      }`}>
                        <statusInfo.icon className={`w-4 h-4 ${
                          hw.status === 'pending' ? 'text-amber-500' : hw.status === 'submitted' ? 'text-blue-500' : 'text-green-500'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{hw.subject}</p>
                        <p className="font-medium text-gray-900">{hw.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {hw.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hw.grade !== undefined && (
                        <span className="text-sm font-bold text-green-600">{hw.grade}</span>
                      )}
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay tareas en esta categoría</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
