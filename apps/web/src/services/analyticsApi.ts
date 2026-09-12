import { api } from '../lib/api';

export interface DashboardKpis {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalCourses: number;
  totalSubjects: number;
  averageGrade: number;
  approvalRate: number;
  attendanceRate: number;
  dropoutRiskStudents: number;
  studentsWithAlerts: number;
  openCounselingCases: number;
  totalSchools?: number;
  totalDistricts?: number;
  totalRegional?: number;
}

export interface GradeDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
  justified: number;
  rate: number;
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  averageGrade: number;
  approvalRate: number;
  totalStudents: number;
  failedStudents: number;
  distribution: GradeDistribution[];
}

export interface TeacherPerformance {
  teacherId: string;
  teacherName: string;
  employeeCode: string;
  subjects: string[];
  courses: string[];
  totalStudents: number;
  averageGrade: number;
  approvalRate: number;
  attendanceRate: number;
  planningsCompleted: number;
  planningsTotal: number;
}

export interface SchoolComparison {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  district: string;
  totalStudents: number;
  averageGrade: number;
  approvalRate: number;
  attendanceRate: number;
  dropoutRisk: number;
  teachersCount: number;
  studentsPerTeacher: number;
}

export interface StudentProgress {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  course: string;
  overallAverage: number;
  subjects: { subjectId: string; subjectName: string; period: string; grade: number; maxScore: number; percentage: number }[];
  attendanceRate: number;
  riskScore: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

export interface AlertsSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: { type: string; count: number }[];
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: string;
}

export interface DashboardBase {
  kpis: DashboardKpis;
  gradeDistribution: GradeDistribution[];
  attendanceTrends: AttendanceTrend[];
  subjectPerformance: SubjectPerformance[];
  topTeachers: TeacherPerformance[];
  schoolComparison?: SchoolComparison[];
  alertsSummary: AlertsSummary;
  recentActivity: RecentActivity[];
}

export interface RegionalComparison {
  regionalId: string;
  regionalCode: string;
  regionalName: string;
  totalStudents: number;
  averageGrade: number;
  approvalRate: number;
  attendanceRate: number;
  schoolsCount: number;
}

export interface DistrictRanking {
  districtId: string;
  districtName: string;
  regionalId: string;
  score: number;
  rank: number;
}

export interface DistrictComparison {
  districtId: string;
  districtName: string;
  totalStudents: number;
  averageGrade: number;
  approvalRate: number;
  attendanceRate: number;
  schoolsCount: number;
}

export interface SchoolRanking {
  schoolId: string;
  schoolName: string;
  districtId: string;
  score: number;
  rank: number;
}

export interface NationalDashboardData extends DashboardBase {
  regionalComparison: RegionalComparison[];
  districtRanking: DistrictRanking[];
}

export interface RegionalDashboardData extends DashboardBase {
  districtComparison: DistrictComparison[];
  schoolRanking: SchoolRanking[];
}

export interface DistrictDashboardData extends DashboardBase {
  schoolComparison: SchoolComparison[];
  teacherRanking: TeacherPerformance[];
}

export interface SchoolDashboardData extends DashboardBase {
  teacherPerformance: TeacherPerformance[];
  studentsAtRisk: StudentProgress[];
  subjectDetails: SubjectPerformance[];
}

export interface CourseDashboard {
  courseId: string;
  courseName: string;
  subject: string;
  studentsCount: number;
  averageGrade: number;
  approvalRate: number;
  attendanceRate: number;
  planningsProgress: number;
}

export interface TeacherDashboardData {
  teacherId: string;
  teacherName: string;
  courses: CourseDashboard[];
  students: StudentProgress[];
  workload: { totalHours: number; plannedHours: number; executedHours: number };
}

export interface TeacherAssignment {
  courseId: string;
  courseName: string;
  gradeName: string;
  subjectId: string;
  subjectName: string;
}

export interface AnalyticsFilters {
  tenantId?: string;
  schoolYearId?: string;
  gradeLevelId?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PlanningStats {
  totalPlannings: number;
  byStatus: Record<string, number>;
  aiGenerated: number;
  totalSessions: number;
  executedSessions: number;
  executionRate: number;
}

export const analyticsApi = {
  getDashboard: (filters?: AnalyticsFilters) =>
    api.get<DashboardKpis>('/analytics/kpis', { params: filters }).then(r => r.data),

  getGradeDistribution: (filters?: AnalyticsFilters) =>
    api.get<GradeDistribution[]>('/analytics/grade-distribution', { params: filters }).then(r => r.data),

  getAttendanceTrends: (filters?: AnalyticsFilters) =>
    api.get<AttendanceTrend[]>('/analytics/attendance-trends', { params: filters }).then(r => r.data),

  getSubjectPerformance: (filters?: AnalyticsFilters) =>
    api.get<SubjectPerformance[]>('/analytics/subject-performance', { params: filters }).then(r => r.data),

  getTeacherDashboard: (teacherId: string) =>
    api.get<TeacherDashboardData>(`/analytics/dashboard/teacher/${teacherId}`).then(r => r.data),

  getTeacherAssignments: (teacherId: string) =>
    api.get<TeacherAssignment[]>(`/teachers/${teacherId}/assignments`).then(r => r.data),

  getPlanningStats: (teacherId: string) =>
    api.get<PlanningStats>('/planning/statistics', { params: { teacherId } }).then(r => r.data),

  getNationalDashboard: () =>
    api.get<NationalDashboardData>('/analytics/dashboard/national').then(r => r.data),

  getRegionalDashboard: () =>
    api.get<RegionalDashboardData>('/analytics/dashboard/regional').then(r => r.data),

  getDistrictDashboard: () =>
    api.get<DistrictDashboardData>('/analytics/dashboard/district').then(r => r.data),

  getSchoolDashboard: () =>
    api.get<SchoolDashboardData>('/analytics/dashboard/school').then(r => r.data),
};
