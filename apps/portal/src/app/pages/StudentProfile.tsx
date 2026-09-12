import { Card, CardContent, CardHeader, CardTitle } from '@sigrade/ui';
import { User, BookOpen, Award, Hash, MapPin, Mail, Phone } from 'lucide-react';

const MOCK_PROFILE = {
  name: 'Carlos Andrés Martínez',
  dni: '001-1234567-8',
  studentCode: '2024-00123',
  grade: '6to',
  section: 'A',
  email: 'carlos.martinez@estudiante.edu.do',
  phone: '(809) 555-0123',
  address: 'Calle Principal #45, Santo Domingo',
};

const MOCK_PROGRESS = [
  { label: 'Cursos Completados', value: '8 / 12', percentage: 67 },
  { label: 'Créditos Acumulados', value: '96 / 144', percentage: 67 },
  { label: 'Promedio General', value: '87.5', percentage: 88 },
];

export function StudentProfile() {
  const userData = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const displayName = userData?.name || userData?.fullName || MOCK_PROFILE.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil del Estudiante</h1>
        <p className="text-gray-500 mt-1">Información personal y progreso académico</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <User className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Nombre Completo</p>
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Hash className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">DNI</p>
                  <p className="text-sm font-medium text-gray-900">{MOCK_PROFILE.dni}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Award className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Código Estudiantil</p>
                  <p className="text-sm font-medium text-gray-900">{MOCK_PROFILE.studentCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <BookOpen className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Grado / Sección</p>
                  <p className="text-sm font-medium text-gray-900">{MOCK_PROFILE.grade} - {MOCK_PROFILE.section}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Correo Electrónico</p>
                  <p className="text-sm font-medium text-gray-900">{MOCK_PROFILE.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-sm font-medium text-gray-900">{MOCK_PROFILE.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 sm:col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Dirección</p>
                  <p className="text-sm font-medium text-gray-900">{MOCK_PROFILE.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600" />
              Progreso Académico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {MOCK_PROGRESS.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
