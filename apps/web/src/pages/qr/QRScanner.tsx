import { useState } from 'react';
import { Camera, QrCode, Users, Calendar, Clock, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Column } from '../../components/ui/Table';
import { useAttendanceRecords, useCreateAttendance } from '../../hooks/api/useAttendance';
import type { AttendanceRecord } from '../../services/attendanceApi';

const mockCourses = [
  { id: '1', name: 'Matemáticas 6to A' },
  { id: '2', name: 'Lengua Española 6to B' },
  { id: '3', name: 'Ciencias Sociales 5to A' },
];

const mockSubjects = [
  { id: '1', name: 'Álgebra' },
  { id: '2', name: 'Geometría' },
  { id: '3', name: 'Gramática' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  PRESENT: 'success',
  LATE: 'warning',
  ABSENT: 'danger',
  EXCUSED: 'warning',
};

const statusLabel: Record<string, string> = {
  PRESENT: 'Presente',
  LATE: 'Tarde',
  ABSENT: 'Ausente',
  EXCUSED: 'Justificado',
};

export function QRScanner() {
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [qrCode, setQrCode] = useState('');

  const { data: recordsData, isLoading, error } = useAttendanceRecords({});
  const records = recordsData?.data ?? [];
  const createAttendance = useCreateAttendance();

  const handleRegister = () => {
    if (!course || !subject || !qrCode) return;
    createAttendance.mutate({
      studentId: qrCode,
      courseId: course,
      subjectId: subject,
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT',
    });
    setQrCode('');
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'studentName',
      header: 'Estudiante',
      accessor: (row) => row.studentName ?? row.studentId,
    },
    {
      key: 'subjectName',
      header: 'Curso',
      accessor: (row) => row.subjectName ?? '-',
    },
    {
      key: 'date',
      header: 'Fecha',
      accessor: (row) => new Date(row.date).toLocaleDateString('es-DO'),
    },
    {
      key: 'createdAt',
      header: 'Hora',
      accessor: (row) => new Date(row.createdAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: 'status',
      render: (value) => {
        const status = value as string;
        return (
          <Badge variant={statusVariant[status] ?? 'default'}>
            {statusLabel[status] ?? status}
          </Badge>
        );
      },
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>Error al cargar registros: {(error as Error).message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Asistencia por QR</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escanea el código QR del estudiante para registrar su asistencia.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escáner QR</CardTitle>
              <CardDescription>
                Enfoca el código QR del estudiante con tu cámara.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-border">
                <Camera className="w-12 h-12 text-muted-foreground/60 mb-3" />
                <p className="text-sm text-muted-foreground">Cámara no disponible</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Concede permisos de cámara para usar el escáner automático.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entrada manual</CardTitle>
              <CardDescription>
                Ingresa manualmente el código QR del estudiante.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={course} onValueChange={setCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Código QR"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  leftIcon={<QrCode className="w-4 h-4" />}
                />
              </div>

              <Button
                className="w-full mt-4"
                size="lg"
                onClick={handleRegister}
                disabled={!course || !subject || !qrCode || createAttendance.isPending}
                isLoading={createAttendance.isPending}
              >
                Registrar Asistencia
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escaneos recientes</CardTitle>
              <CardDescription>
                Últimos registros de asistencia por QR.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {records.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No hay registros de asistencia
                </div>
              ) : (
                <Table
                  columns={columns}
                  data={records}
                  keyExtractor={(row) => row.id}
                  compact
                  bordered={false}
                  className="border-0"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Instrucciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium">Selecciona curso y materia</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Elige el curso y la materia correspondiente a la clase.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium">Escanea o ingresa el código</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Usa la cámara para escanear el QR del estudiante o ingrésalo manualmente.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium">Confirma la asistencia</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Revisa los datos y presiona "Registrar Asistencia" para guardar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Estudiantes hoy:</span>
                  <span className="font-semibold">{records.length}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Registrados:</span>
                  <span className="font-semibold">
                    {records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Pendientes:</span>
                  <span className="font-semibold">
                    {records.filter(r => r.status === 'ABSENT' || r.status === 'EXCUSED').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
