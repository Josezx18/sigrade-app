import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sigrade/ui';
import { Badge } from '@sigrade/ui';
import { TrendingUp, TrendingDown, Minus, ArrowLeft, GraduationCap } from 'lucide-react';

interface SubjectDetail {
  period: string;
  score: number;
  weight: number;
  type: string;
}

interface Subject {
  id: string;
  name: string;
  average: number;
  teacher: string;
  trend: 'up' | 'down' | 'flat';
  color: string;
  breakdown?: SubjectDetail[];
}

const MOCK_GRADES: { overallAverage: number; subjects: Subject[] } = {
  overallAverage: 87.5,
  subjects: [
    {
      id: '1', name: 'Matemáticas', average: 92, teacher: 'Lic. Juan Pérez',
      trend: 'up', color: 'success',
      breakdown: [
        { period: 'P1', score: 88, weight: 25, type: 'Examen' },
        { period: 'P2', score: 94, weight: 25, type: 'Tareas' },
        { period: 'P3', score: 90, weight: 25, type: 'Examen' },
        { period: 'P4', score: 96, weight: 25, type: 'Proyecto' },
      ],
    },
    {
      id: '2', name: 'Lengua Española', average: 85, teacher: 'Lic. María García',
      trend: 'up', color: 'warning',
      breakdown: [
        { period: 'P1', score: 82, weight: 25, type: 'Examen' },
        { period: 'P2', score: 84, weight: 25, type: 'Tareas' },
        { period: 'P3', score: 86, weight: 25, type: 'Examen' },
        { period: 'P4', score: 88, weight: 25, type: 'Proyecto' },
      ],
    },
    {
      id: '3', name: 'Ciencias Sociales', average: 78, teacher: 'Lic. Carlos Rodríguez',
      trend: 'down', color: 'danger',
      breakdown: [
        { period: 'P1', score: 82, weight: 25, type: 'Examen' },
        { period: 'P2', score: 80, weight: 25, type: 'Tareas' },
        { period: 'P3', score: 76, weight: 25, type: 'Examen' },
        { period: 'P4', score: 74, weight: 25, type: 'Proyecto' },
      ],
    },
    {
      id: '4', name: 'Inglés', average: 95, teacher: 'Lic. Ana Martínez',
      trend: 'up', color: 'success',
      breakdown: [
        { period: 'P1', score: 92, weight: 25, type: 'Examen' },
        { period: 'P2', score: 94, weight: 25, type: 'Tareas' },
        { period: 'P3', score: 96, weight: 25, type: 'Examen' },
        { period: 'P4', score: 98, weight: 25, type: 'Proyecto' },
      ],
    },
    {
      id: '5', name: 'Educación Física', average: 90, teacher: 'Lic. Roberto Díaz',
      trend: 'flat', color: 'info',
      breakdown: [
        { period: 'P1', score: 90, weight: 25, type: 'Práctica' },
        { period: 'P2', score: 90, weight: 25, type: 'Práctica' },
        { period: 'P3', score: 90, weight: 25, type: 'Teoría' },
        { period: 'P4', score: 90, weight: 25, type: 'Práctica' },
      ],
    },
  ],
};

const trendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
    default: return <Minus className="w-4 h-4 text-gray-400" />;
  }
};

const badgeVariant = (color: string) => {
  switch (color) {
    case 'success': return 'success';
    case 'warning': return 'warning';
    case 'danger': return 'danger';
    default: return 'info';
  }
};

export function StudentGrades() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  if (selectedSubject) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedSubject(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a calificaciones
        </button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{selectedSubject.name}</CardTitle>
              <Badge variant={badgeVariant(selectedSubject.color)}>
                {selectedSubject.average}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{selectedSubject.teacher}</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Período</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Tipo</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Peso</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubject.breakdown?.map((detail) => (
                    <tr key={detail.period} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-2 font-medium">{detail.period}</td>
                      <td className="py-3 px-2 text-gray-600">{detail.type}</td>
                      <td className="py-3 px-2 text-right">{detail.weight}%</td>
                      <td className={`py-3 px-2 text-right font-bold ${
                        detail.score >= 90 ? 'text-green-600' : detail.score >= 80 ? 'text-blue-600' : detail.score >= 70 ? 'text-amber-600' : 'text-red-600'
                      }`}>{detail.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
        <p className="text-gray-500 mt-1">Rendimiento académico por materia</p>
      </div>

      {/* Overall GPA */}
      <Card className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">Promedio General</p>
              <p className="text-4xl font-bold mt-1">{MOCK_GRADES.overallAverage}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/20">
              <GraduationCap className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject List */}
      <div className="space-y-3">
        {MOCK_GRADES.subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => setSelectedSubject(subject)}
            className="w-full text-left"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{subject.name}</p>
                      <p className="text-sm text-gray-500">{subject.teacher}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {trendIcon(subject.trend)}
                    <span className={`text-xl font-bold ${
                      subject.average >= 90 ? 'text-green-600' : subject.average >= 80 ? 'text-blue-600' : subject.average >= 70 ? 'text-amber-600' : 'text-red-600'
                    }`}>{subject.average}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
