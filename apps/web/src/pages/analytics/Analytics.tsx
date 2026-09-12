import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, GraduationCap, Star, TrendingUp, BookOpen, CalendarCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { toast } from '../../hooks/useToast';

interface DashboardData {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalActiveEnrollments: number;
  averageAttendance?: number;
  averageGrade?: number;
  planningCompletionRate?: number;
  studentsAtRisk?: number;
  activeAlerts?: number;
}

interface GradeDistribution {
  label: string;
  count: number;
  percentage: number;
}

interface AttendanceTrend {
  month: string;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  averageGrade: number;
  studentCount: number;
  passingRate: number;
}

const api = axios.create({ baseURL: '/api/v1/analytics' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function getGradeBadgeColor(value: number): string {
  if (value >= 80) return 'bg-green-100 text-green-800 border-green-300';
  if (value >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

function getAttendanceBadgeColor(value: number): string {
  if (value >= 80) return 'bg-green-100 text-green-800 border-green-300';
  if (value >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

function getGradeBarColor(label: string): string {
  switch (label.toLowerCase()) {
    case 'excelente': return 'bg-green-500';
    case 'bueno': return 'bg-blue-500';
    case 'regular': return 'bg-yellow-500';
    case 'deficiente': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function getGradeDistributionColor(label: string): string {
  switch (label.toLowerCase()) {
    case 'excelente': return 'text-green-700 bg-green-50 border-green-200';
    case 'bueno': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'regular': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'deficiente': return 'text-red-700 bg-red-50 border-red-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

export default function Analytics() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrend[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = { tenantId: undefined, schoolYearId: undefined };

        const [dashboardRes, gradesRes, attendanceRes, subjectsRes] = await Promise.all([
          api.get<DashboardData>('/dashboard', { params }),
          api.get<GradeDistribution[]>('/grade-distribution', { params }),
          api.get<AttendanceTrend[]>('/attendance-trends', { params }),
          api.get<SubjectPerformance[]>('/subject-performance', { params }),
        ]);

        setDashboard(dashboardRes.data);
        setGradeDistribution(gradesRes.data);
        setAttendanceTrends(attendanceRes.data);
        setSubjectPerformance(subjectsRes.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar datos del dashboard';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'danger' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-lg font-medium text-gray-700">No se pudieron cargar los datos</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const attendanceRate = dashboard?.averageAttendance ?? 0;
  const averageGrade = dashboard?.averageGrade ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Panel de Analítica</h1>
        <Badge className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200">
          <TrendingUp className="w-4 h-4" />
          Vista general
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Estudiantes</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard?.totalStudents ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Docentes</CardTitle>
            <GraduationCap className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard?.totalTeachers ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Asistencia Promedio</CardTitle>
            <CalendarCheck className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">{attendanceRate.toFixed(1)}%</div>
              <Badge className={getAttendanceBadgeColor(attendanceRate)}>
                {attendanceRate >= 80 ? 'Excelente' : attendanceRate >= 60 ? 'Regular' : 'Bajo'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Promedio General</CardTitle>
            <Star className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">{averageGrade.toFixed(1)}</div>
              <Badge className={getGradeBadgeColor(averageGrade)}>
                {averageGrade >= 80 ? 'Excelente' : averageGrade >= 60 ? 'Regular' : 'Bajo'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribución de Calificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gradeDistribution.length === 0 ? (
              <p className="text-sm text-gray-400">Sin datos disponibles</p>
            ) : (
              gradeDistribution.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={getGradeDistributionColor(item.label)}>
                      {item.label}
                    </Badge>
                    <span className="text-sm font-medium text-gray-600">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getGradeBarColor(item.label)}`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tendencia de Asistencia Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceTrends.length === 0 ? (
              <p className="text-sm text-gray-400">Sin datos disponibles</p>
            ) : (
              <div className="flex items-end justify-between gap-2 h-40">
                {attendanceTrends.map((item) => (
                  <div key={item.month} className="flex flex-col items-center flex-1 h-full">
                    <span className="text-xs font-medium text-gray-500 mb-1">
                      {item.rate.toFixed(0)}%
                    </span>
                    <div className="relative flex-1 w-full flex items-end">
                      <div
                        className="w-full rounded-t transition-all duration-500"
                        style={{
                          height: `${Math.min(item.rate, 100)}%`,
                          backgroundColor:
                            item.rate >= 80
                              ? '#22c55e'
                              : item.rate >= 60
                              ? '#eab308'
                              : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="mt-1 text-xs text-gray-500 truncate w-full text-center">
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Rendimiento por Asignatura</CardTitle>
        </CardHeader>
        <CardContent>
          {subjectPerformance.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos disponibles</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Asignatura</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Estudiantes</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Promedio</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Tasa Aprobación</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectPerformance.map((subject) => (
                    <tr key={subject.subjectId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          {subject.subjectName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{subject.studentCount}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={getGradeBadgeColor(subject.averageGrade)}>
                          {subject.averageGrade.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                subject.passingRate >= 80
                                  ? 'bg-green-500'
                                  : subject.passingRate >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(subject.passingRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600 w-10 text-right">
                            {subject.passingRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
