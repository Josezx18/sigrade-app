import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AlertTriangle, Heart, Users, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RiskAlert {
  id: string;
  severity: string;
  type: string;
  description: string;
  studentName?: string;
  createdAt: string;
  status: string;
}

interface CounselingCase {
  id: string;
  title: string;
  studentName?: string;
  status: string;
  priority: string;
  createdAt: string;
}

const MOCK_ALERTS: RiskAlert[] = [
  { id: 'a1', severity: 'CRITICAL', type: 'DROPOUT_RISK', description: 'Factor socioeconómico identificado — riesgo de deserción inminente', studentName: 'José Rodríguez', createdAt: '2026-07-13T10:30:00Z', status: 'PENDING' },
  { id: 'a2', severity: 'HIGH', type: 'ACADEMIC_FAILURE', description: 'Calificaciones por debajo de 60 en los últimos 3 exámenes', studentName: 'Diego Ramírez', createdAt: '2026-07-12T08:15:00Z', status: 'IN_REVIEW' },
  { id: 'a3', severity: 'HIGH', type: 'CHRONIC_ABSENCE', description: 'Ha faltado a 12 clases en el último mes sin justificación', studentName: 'Valentina López', createdAt: '2026-07-11T14:00:00Z', status: 'PENDING' },
  { id: 'a4', severity: 'MEDIUM', type: 'BEHAVIORAL', description: 'Reportes de interrupciones constantes durante la clase', studentName: 'Mateo Herrera', createdAt: '2026-07-10T09:45:00Z', status: 'INTERVENTION' },
  { id: 'a5', severity: 'MEDIUM', type: 'SOCIOEMOTIONAL', description: 'Muestra signos de ansiedad y aislamiento social', studentName: 'Camila Rojas', createdAt: '2026-07-09T11:20:00Z', status: 'IN_REVIEW' },
];

const MOCK_CASES: CounselingCase[] = [
  { id: 'c1', title: 'Apoyo académico integral — Matemáticas', studentName: 'Carlos Mendoza', status: 'IN_PROGRESS', priority: 'HIGH', createdAt: '2026-07-08T09:00:00Z' },
  { id: 'c2', title: 'Intervención por ausentismo crónico', studentName: 'Diego Ramírez', status: 'OPEN', priority: 'CRITICAL', createdAt: '2026-07-07T10:30:00Z' },
  { id: 'c3', title: 'Orientación vocacional — intereses científicos', studentName: 'Ana López', status: 'OPEN', priority: 'LOW', createdAt: '2026-07-06T08:00:00Z' },
];

const MOCK_STATS = { totalAlerts: 5, openCases: 3, criticalAlerts: 2, studentsInFollowUp: 8 };

export function CounselorDashboard() {
  const { user } = useAuth();

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['counselor', 'risk-alerts'],
    queryFn: () => api.get('/counseling/risk-alerts').then(r => r.data as { data: RiskAlert[] }),
  });

  const { data: cases, isLoading: loadingCases } = useQuery({
    queryKey: ['counselor', 'cases'],
    queryFn: () => api.get('/counseling/cases').then(r => r.data as { data: CounselingCase[] }),
  });

  const { data: stats } = useQuery({
    queryKey: ['counselor', 'stats'],
    queryFn: () => api.get('/counseling/stats').then(r => r.data as {
      totalAlerts: number;
      openCases: number;
      criticalAlerts: number;
      studentsInFollowUp: number;
    }),
  });

  const alertsData = alerts?.data ?? MOCK_ALERTS;
  const casesData = cases?.data ?? MOCK_CASES;
  const statsData = stats ?? MOCK_STATS;
  const criticalAlertsList = alertsData.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  const openCasesList = casesData.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS');

  if (loadingAlerts || loadingCases) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de Orientación</h1>
        <p className="text-muted-foreground">Bienvenido(a), {user?.firstName} — Gestión de alertas de riesgo y casos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Alertas Activas" value={alertsData.length} icon={<AlertTriangle className="w-5 h-5" />} color="danger" />
        <StatsCard label="Alertas Críticas" value={criticalAlertsList.length} icon={<Activity className="w-5 h-5" />} color="danger" />
        <StatsCard label="Casos Abiertos" value={openCasesList.length} icon={<Heart className="w-5 h-5" />} color="warning" />
        <StatsCard label="Estudiantes en Seguimiento" value={statsData.studentsInFollowUp} icon={<Users className="w-5 h-5" />} color="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Alertas de Riesgo Recientes</CardTitle>
            <Link to="/counseling" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {criticalAlertsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay alertas activas</p>
            ) : (
              <div className="space-y-2">
                {criticalAlertsList.slice(0, 5).map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-danger-50 border border-danger-200">
                    <AlertTriangle className="w-5 h-5 text-danger-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-danger-800">{alert.studentName ?? 'Estudiante'}</p>
                      <p className="text-xs text-danger-600">{alert.description}</p>
                      <p className="text-[10px] text-danger-400 mt-1">{new Date(alert.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Casos Recientes</CardTitle>
            <Link to="/counseling" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {openCasesList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay casos abiertos</p>
            ) : (
              <div className="space-y-2">
                {openCasesList.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-warning-50 border border-warning-200">
                    <Heart className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-warning-800">{c.title}</p>
                      <p className="text-xs text-warning-600">{c.studentName ?? 'Estudiante'}</p>
                      <p className="text-[10px] text-warning-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link to="/counseling" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-lg bg-danger-100 text-danger-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">Gestionar Alertas</span>
            </Link>
            <Link to="/counseling" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-lg bg-warning-100 text-warning-600 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">Abrir Caso</span>
            </Link>
            <Link to="/students" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-lg bg-info-100 text-info-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">Consultar Estudiantes</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
