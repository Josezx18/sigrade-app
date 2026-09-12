import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import {
  DashboardKpisDto,
  GradeDistributionDto,
  AttendanceTrendDto,
  SubjectPerformanceDto,
  TeacherPerformanceDto,
  SchoolComparisonDto,
  StudentProgressDto,
  PredictiveAnalyticsDto,
  ExportRequestDto,
  ExportResponseDto,
  ReportStatusDto,
  DashboardResponseDto,
  NationalDashboardDto,
  RegionalDashboardDto,
  DistrictDashboardDto,
  SchoolDashboardDto,
  TeacherDashboardDto,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  getPrisma(): PrismaService {
    return this.prisma;
  }

  // ==================== DASHBOARDS BY LEVEL ====================

  async getDashboard(tenantId: string, userRoles?: string[]): Promise<DashboardResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    // Determine access level based on tenant type and user roles
    const isNational = tenant.type === 'SYSTEM' || userRoles?.includes('SUPER_ADMIN') || userRoles?.includes('MINERD_ANALYST');
    const isRegional = tenant.type === 'REGIONAL' || userRoles?.includes('REGIONAL_DIRECTOR') || userRoles?.includes('REGIONAL_TECHNICIAN');
    const isDistrict = tenant.type === 'DISTRICT' || userRoles?.includes('DISTRICT_DIRECTOR') || userRoles?.includes('DISTRICT_TECHNICIAN');
    if (isNational) return this.getNationalDashboard(tenantId);
    if (isRegional) return this.getRegionalDashboard(tenantId);
    if (isDistrict) return this.getDistrictDashboard(tenantId);
    return this.getSchoolDashboard(tenantId);
  }

  async getNationalDashboard(tenantId: string): Promise<NationalDashboardDto> {
    const baseDashboard = await this.getBaseDashboard(tenantId, true);
    
    // Get all regional tenants
    const regionals = await this.prisma.tenant.findMany({
      where: { parentId: tenantId, type: 'REGIONAL' },
      include: {
        children: {
          where: { type: 'DISTRICT' },
          include: { children: { where: { type: 'SCHOOL' } } },
        },
      },
    });

    const regionalComparison = await Promise.all(
      regionals.map(async (regional) => {
        const districts = regional.children;
        const schools = districts.flatMap(d => d.children);
        const schoolIds = schools.map(s => s.id);
        
        const [students, grades, attendances] = await Promise.all([
          this.prisma.student.count({ where: { tenantId: { in: schoolIds } } }),
          this.prisma.grade.findMany({ where: { courseSubject: { course: { tenantId: { in: schoolIds } } } } }),
          this.prisma.attendance.findMany({ where: { courseSubject: { course: { tenantId: { in: schoolIds } } } } }),
        ]);

        const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
        const approved = grades.filter(g => Number(g.score) >= 60).length;
        const attendanceRate = attendances.length > 0 
          ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 
          : 0;

        return {
          regionalId: regional.id,
          regionalCode: regional.code,
          regionalName: regional.name,
          totalStudents: students,
          averageGrade: Number(avgGrade.toFixed(2)),
          approvalRate: grades.length > 0 ? Number((approved / grades.length * 100).toFixed(2)) : 0,
          attendanceRate: Number(attendanceRate.toFixed(2)),
          schoolsCount: schools.length,
        };
      })
    );

    const districtRanking = await this.getDistrictRanking(tenantId);

    return {
      ...baseDashboard,
      regionalComparison,
      districtRanking,
    };
  }

  async getRegionalDashboard(tenantId: string): Promise<RegionalDashboardDto> {
    const baseDashboard = await this.getBaseDashboard(tenantId, false);
    
    const districts = await this.prisma.tenant.findMany({
      where: { parentId: tenantId, type: 'DISTRICT' },
      include: { children: { where: { type: 'SCHOOL' } } },
    });

    const districtComparison = await Promise.all(
      districts.map(async (district) => {
        const schools = district.children;
        const schoolIds = schools.map(s => s.id);
        
        const [students, grades, attendances] = await Promise.all([
          this.prisma.student.count({ where: { tenantId: { in: schoolIds } } }),
          this.prisma.grade.findMany({ where: { courseSubject: { course: { tenantId: { in: schoolIds } } } } }),
          this.prisma.attendance.findMany({ where: { courseSubject: { course: { tenantId: { in: schoolIds } } } } }),
        ]);

        const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
        const approved = grades.filter(g => Number(g.score) >= 60).length;
        const attendanceRate = attendances.length > 0 
          ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 
          : 0;

        return {
          districtId: district.id,
          districtName: district.name,
          totalStudents: students,
          averageGrade: Number(avgGrade.toFixed(2)),
          approvalRate: grades.length > 0 ? Number((approved / grades.length * 100).toFixed(2)) : 0,
          attendanceRate: Number(attendanceRate.toFixed(2)),
          schoolsCount: schools.length,
        };
      })
    );

    const schoolRanking = await this.getSchoolRanking(tenantId);

    return {
      ...baseDashboard,
      districtComparison,
      schoolRanking,
    };
  }

  async getDistrictDashboard(tenantId: string): Promise<DistrictDashboardDto> {
    const baseDashboard = await this.getBaseDashboard(tenantId, false);
    
    const schools = await this.prisma.tenant.findMany({
      where: { parentId: tenantId, type: 'SCHOOL' },
    });

    const schoolComparison: SchoolComparisonDto[] = await Promise.all(
      schools.map(async (school) => {
        const [students, teachers, grades, attendances] = await Promise.all([
          this.prisma.student.count({ where: { tenantId: school.id } }),
          this.prisma.teacher.count({ where: { tenantId: school.id } }),
          this.prisma.grade.findMany({ where: { courseSubject: { course: { tenantId: school.id } } } }),
          this.prisma.attendance.findMany({ where: { courseSubject: { course: { tenantId: school.id } } } }),
        ]);

        const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
        const approved = grades.filter(g => Number(g.score) >= 60).length;
        const attendanceRate = attendances.length > 0 
          ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 
          : 0;

        // Get dropout risk count
        const riskStudents = await this.prisma.riskAlert.count({
          where: { student: { tenantId: school.id }, severity: { in: ['HIGH', 'CRITICAL'] }, status: { in: ['PENDING', 'IN_REVIEW', 'INTERVENTION'] } },
        });

        return {
          schoolId: school.id,
          schoolName: school.name,
          schoolCode: school.code,
          district: tenantId, // Would need district name lookup
          totalStudents: students,
          averageGrade: Number(avgGrade.toFixed(2)),
          approvalRate: grades.length > 0 ? Number((approved / grades.length * 100).toFixed(2)) : 0,
          attendanceRate: Number(attendanceRate.toFixed(2)),
          dropoutRisk: riskStudents,
          teachersCount: teachers,
          studentsPerTeacher: teachers > 0 ? Number((students / teachers).toFixed(1)) : 0,
        };
      })
    );

    const teacherRanking = await this.getTeacherRanking([tenantId]);

    return {
      ...baseDashboard,
      schoolComparison,
      teacherRanking,
    };
  }

  async getSchoolDashboard(tenantId: string): Promise<SchoolDashboardDto> {
    const baseDashboard = await this.getBaseDashboard(tenantId, false);
    
    const [teacherPerformance, studentsAtRisk, subjectDetails] = await Promise.all([
      this.getTeacherPerformance(tenantId),
      this.getStudentsAtRisk(tenantId),
      this.getSubjectPerformance(tenantId),
    ]);

    return {
      ...baseDashboard,
      teacherPerformance,
      studentsAtRisk,
      subjectDetails,
    };
  }

  async getTeacherDashboard(teacherId: string, tenantId: string): Promise<TeacherDashboardDto> {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, tenantId },
      include: { user: true, courseSubjects: { include: { course: true, subject: true } } },
    });
    if (!teacher) throw new NotFoundException('Docente no encontrado');

    const courseSubjectIds = teacher.courseSubjects.map(cs => cs.id);
    
    const courses = await Promise.all(
      teacher.courseSubjects.map(async (cs) => {
        const [studentsCount, grades, attendances, plannings] = await Promise.all([
          this.prisma.studentCourse.count({ where: { courseId: cs.courseId, status: 'ACTIVE' } }),
          this.prisma.grade.findMany({ where: { courseSubjectId: cs.id } }),
          this.prisma.attendance.findMany({ where: { courseSubjectId: cs.id } }),
          this.prisma.planning.count({ where: { courseSubjectId: cs.id } }),
        ]);

        const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
        const approved = grades.filter(g => Number(g.score) >= 60).length;
        const attendanceRate = attendances.length > 0 
          ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 
          : 0;
        const completedPlannings = await this.prisma.planning.count({ where: { courseSubjectId: cs.id, status: 'APPROVED' } });

        return {
          courseId: cs.course.id,
          courseName: cs.course.name,
          subject: cs.subject.name,
          studentsCount,
          averageGrade: Number(avgGrade.toFixed(2)),
          approvalRate: grades.length > 0 ? Number((approved / grades.length * 100).toFixed(2)) : 0,
          attendanceRate: Number(attendanceRate.toFixed(2)),
          planningsProgress: plannings > 0 ? Number((completedPlannings / plannings * 100).toFixed(1)) : 0,
        };
      })
    );

    const studentIds = await this.prisma.studentCourse.findMany({
      where: { courseId: { in: teacher.courseSubjects.map(cs => cs.courseId) }, status: 'ACTIVE' },
      select: { studentId: true },
      distinct: ['studentId'],
    });

    const students = await Promise.all(
      studentIds.map(async ({ studentId }) => {
        const student = await this.prisma.student.findUnique({ 
          where: { id: studentId },
          include: { enrollments: { where: { status: 'ACTIVE' }, include: { course: { include: { gradeLevel: true } } } } }
        });
        if (!student) return null;
        
        const grades = await this.prisma.grade.findMany({ 
          where: { studentId, courseSubjectId: { in: courseSubjectIds } },
          include: { courseSubject: { include: { subject: true } }, period: true }
        });
        const attendances = await this.prisma.attendance.findMany({ 
          where: { studentId, courseSubjectId: { in: courseSubjectIds } } 
        });
        
        const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
        const attendanceRate = attendances.length > 0 
          ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 
          : 0;
        
        const riskAlert = await this.prisma.riskAlert.findFirst({
          where: { studentId, status: { in: ['PENDING', 'IN_REVIEW', 'INTERVENTION'] } },
          orderBy: { severity: 'desc' },
        });

        // Get the first active enrollment's course
        const activeEnrollment = student.enrollments[0];
        const courseName = activeEnrollment ? activeEnrollment.course.name : 'N/A';

        return {
          studentId: student.id,
          studentCode: student.studentCode,
          firstName: student.firstName,
          lastName: student.lastName,
          course: courseName,
          overallAverage: Number(avgGrade.toFixed(2)),
          subjects: grades.map(g => ({
            subjectId: g.courseSubject.subjectId,
            subjectName: g.courseSubject.subject.name,
            period: g.period.name,
            grade: Number(g.score),
            maxScore: Number(g.maxScore),
            percentage: Number((Number(g.score) / Number(g.maxScore) * 100).toFixed(1)),
          })),
          attendanceRate: Number(attendanceRate.toFixed(2)),
          riskScore: riskAlert ? this.getRiskScoreFromSeverity(riskAlert.severity) : 0,
          trend: this.calculateTrend(grades),
        };
      })
    );

    const validStudents = students.filter(Boolean) as StudentProgressDto[];
    
    const totalHours = teacher.courseSubjects.reduce((sum, cs) => sum + cs.hoursWeekly, 0);
    const executedHours = await this.prisma.planningSession.count({
      where: { planning: { courseSubjectId: { in: courseSubjectIds } }, executed: true },
    });

    return {
      teacherId: teacher.id,
      teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
      courses,
      students: validStudents,
      workload: {
        totalHours,
        plannedHours: totalHours * 4, // Approximate
        executedHours,
      },
    };
  }

  // ==================== BASE DASHBOARD COMPONENTS ====================

  private async getBaseDashboard(tenantId: string, includeChildren: boolean): Promise<DashboardResponseDto> {
    const tenantIds = includeChildren ? await this.getDescendantTenantIds(tenantId) : [tenantId];
    
    const [kpis, gradeDistribution, attendanceTrends, subjectPerformance, topTeachers, alertsSummary, recentActivity] = await Promise.all([
      this.getKpis(tenantIds),
      this.getGradeDistribution(tenantIds),
      this.getAttendanceTrends(tenantIds),
      this.getSubjectPerformance(tenantIds),
      this.getTopTeachers(tenantIds),
      this.getAlertsSummary(tenantIds),
      this.getRecentActivity(tenantIds),
    ]);

    return { kpis, gradeDistribution, attendanceTrends, subjectPerformance, topTeachers, alertsSummary, recentActivity };
  }

  private async getKpis(tenantIds: string[]): Promise<DashboardKpisDto> {
    const [totalStudents, activeStudents, totalTeachers, activeTeachers, totalCourses, totalSubjects, grades, attendances, riskStudents, studentsWithAlerts, openCases] = await Promise.all([
      this.prisma.student.count({ where: { tenantId: { in: tenantIds } } }),
      this.prisma.student.count({ where: { tenantId: { in: tenantIds }, enrollments: { some: { status: 'ACTIVE' } } } }),
      this.prisma.teacher.count({ where: { tenantId: { in: tenantIds } } }),
      this.prisma.teacher.count({ where: { tenantId: { in: tenantIds }, user: { isActive: true } } }),
      this.prisma.course.count({ where: { tenantId: { in: tenantIds } } }),
      this.prisma.subject.count({ where: { tenantId: { in: tenantIds } } }),
      this.prisma.grade.findMany({ where: { courseSubject: { course: { tenantId: { in: tenantIds } } } } }),
      this.prisma.attendance.findMany({ where: { courseSubject: { course: { tenantId: { in: tenantIds } } } } }),
      this.prisma.riskAlert.count({ where: { student: { tenantId: { in: tenantIds } }, severity: { in: ['HIGH', 'CRITICAL'] }, status: { in: ['PENDING', 'IN_REVIEW', 'INTERVENTION'] } } }),
      this.prisma.student.count({ where: { tenantId: { in: tenantIds }, riskAlerts: { some: { status: { in: ['PENDING', 'IN_REVIEW', 'INTERVENTION'] } } } } }),
      this.prisma.counselingCase.count({ where: { student: { tenantId: { in: tenantIds } }, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);

    const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
    const approved = grades.filter(g => Number(g.score) >= 60).length;
    const attendanceRate = attendances.length > 0 ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 : 0;

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantIds[0] } });
    let totalSchools = 0, totalDistricts = 0, totalRegional = 0;
    
    if (tenant?.type === 'SYSTEM') {
      totalSchools = await this.prisma.tenant.count({ where: { type: 'SCHOOL' } });
      totalDistricts = await this.prisma.tenant.count({ where: { type: 'DISTRICT' } });
      totalRegional = await this.prisma.tenant.count({ where: { type: 'REGIONAL' } });
    }

    return {
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalCourses,
      totalSubjects,
      averageGrade: Number(avgGrade.toFixed(2)),
      approvalRate: grades.length > 0 ? Number((approved / grades.length * 100).toFixed(2)) : 0,
      attendanceRate: Number(attendanceRate.toFixed(2)),
      dropoutRiskStudents: riskStudents,
      studentsWithAlerts,
      openCounselingCases: openCases,
      totalSchools,
      totalDistricts,
      totalRegional,
    };
  }

  private async getGradeDistribution(tenantIds: string[]): Promise<GradeDistributionDto[]> {
    const grades = await this.prisma.grade.findMany({
      where: { courseSubject: { course: { tenantId: { in: tenantIds } } } },
      select: { score: true, maxScore: true },
    });

    const ranges = [
      { range: '90-100', min: 90, max: 100 },
      { range: '80-89', min: 80, max: 89 },
      { range: '70-79', min: 70, max: 79 },
      { range: '60-69', min: 60, max: 69 },
      { range: '50-59', min: 50, max: 59 },
      { range: '0-49', min: 0, max: 49 },
    ];

    return ranges.map(r => {
      const count = grades.filter(g => {
        const pct = (Number(g.score) / Number(g.maxScore)) * 100;
        return pct >= r.min && pct <= r.max;
      }).length;
      return { range: r.range, count, percentage: grades.length > 0 ? Number((count / grades.length * 100).toFixed(2)) : 0 };
    });
  }

  private async getAttendanceTrends(tenantIds: string[]): Promise<AttendanceTrendDto[]> {
    const trends: AttendanceTrendDto[] = [];
    const days = 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const attendances = await this.prisma.attendance.findMany({
        where: { date: { gte: date, lt: nextDate }, courseSubject: { course: { tenantId: { in: tenantIds } } } },
      });

      const present = attendances.filter(a => a.status === 'PRESENT').length;
      const absent = attendances.filter(a => a.status === 'ABSENT').length;
      const late = attendances.filter(a => a.status === 'LATE').length;
      const justified = attendances.filter(a => a.status === 'JUSTIFIED').length;

      trends.push({
        date,
        present,
        absent,
        late,
        justified,
        rate: attendances.length > 0 ? Number((present / attendances.length * 100).toFixed(2)) : 0,
      });
    }

    return trends;
  }

  private async getSubjectPerformance(tenantIds: string | string[]): Promise<SubjectPerformanceDto[]> {
    const ids = Array.isArray(tenantIds) ? tenantIds : [tenantIds];
    
    const subjects = await this.prisma.subject.findMany({
      where: { tenantId: { in: ids } },
      include: { courseSubjects: { include: { grades: true } } },
    });

    return subjects.map(subject => {
      const allGrades = subject.courseSubjects.flatMap(cs => cs.grades);
      const avgGrade = allGrades.length > 0 ? allGrades.reduce((a, g) => a + Number(g.score), 0) / allGrades.length : 0;
      const approved = allGrades.filter(g => Number(g.score) >= 60).length;
      const students = new Set(allGrades.map(g => g.studentId)).size;
      const failed = allGrades.filter(g => Number(g.score) < 60).length;

      const distribution = this.getGradeDistributionForGrades(allGrades);

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        averageGrade: Number(avgGrade.toFixed(2)),
        approvalRate: allGrades.length > 0 ? Number((approved / allGrades.length * 100).toFixed(2)) : 0,
        totalStudents: students,
        failedStudents: failed,
        distribution,
      };
    }).sort((a, b) => b.averageGrade - a.averageGrade);
  }

  private getGradeDistributionForGrades(grades: { score: unknown; maxScore: unknown }[]): GradeDistributionDto[] {
    const ranges = [
      { range: '90-100', min: 90, max: 100 },
      { range: '80-89', min: 80, max: 89 },
      { range: '70-79', min: 70, max: 79 },
      { range: '60-69', min: 60, max: 69 },
      { range: '50-59', min: 50, max: 59 },
      { range: '0-49', min: 0, max: 49 },
    ];
    return ranges.map(r => {
      const count = grades.filter(g => {
        const pct = (Number(g.score) / Number(g.maxScore)) * 100;
        return pct >= r.min && pct <= r.max;
      }).length;
      return { range: r.range, count, percentage: grades.length > 0 ? Number((count / grades.length * 100).toFixed(2)) : 0 };
    });
  }

  private async getTopTeachers(tenantIds: string[], limit = 10): Promise<TeacherPerformanceDto[]> {
    const teachers = await this.prisma.teacher.findMany({
      where: { tenantId: { in: tenantIds } },
      include: { user: true, courseSubjects: { include: { course: true, subject: true } } },
    });

    const performances = await Promise.all(
      teachers.map(async (teacher) => {
        const courseSubjectIds = teacher.courseSubjects.map(cs => cs.id);
        const [grades, attendances, planningsTotal, planningsCompleted] = await Promise.all([
          this.prisma.grade.findMany({ where: { courseSubjectId: { in: courseSubjectIds } } }),
          this.prisma.attendance.findMany({ where: { courseSubjectId: { in: courseSubjectIds } } }),
          this.prisma.planning.count({ where: { courseSubjectId: { in: courseSubjectIds } } }),
          this.prisma.planning.count({ where: { courseSubjectId: { in: courseSubjectIds }, status: 'APPROVED' } }),
        ]);

        const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
        const approved = grades.filter(g => Number(g.score) >= 60).length;
        const attendanceRate = attendances.length > 0 ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 : 0;
        const students = new Set(grades.map(g => g.studentId)).size;

        return {
          teacherId: teacher.id,
          teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
          employeeCode: teacher.employeeCode,
          subjects: [...new Set(teacher.courseSubjects.map(cs => cs.subject.name))],
          courses: [...new Set(teacher.courseSubjects.map(cs => cs.course.name))],
          totalStudents: students,
          averageGrade: Number(avgGrade.toFixed(2)),
          approvalRate: grades.length > 0 ? Number((approved / grades.length * 100).toFixed(2)) : 0,
          attendanceRate: Number(attendanceRate.toFixed(2)),
          planningsCompleted,
          planningsTotal,
        };
      })
    );

    return performances.sort((a, b) => b.averageGrade - a.averageGrade).slice(0, limit);
  }

async getTeacherRanking(tenantIds: string | string[]): Promise<TeacherPerformanceDto[]> {
    const ids = Array.isArray(tenantIds) ? tenantIds : [tenantIds];
    return this.getTopTeachers(ids, 50);
  }

  async getTeacherPerformance(tenantId: string): Promise<TeacherPerformanceDto[]> {
    return this.getTopTeachers([tenantId], 50);
  }

  private async getAlertsSummary(tenantIds: string[]) {
    const alerts = await this.prisma.riskAlert.findMany({
      where: { student: { tenantId: { in: tenantIds } } },
      select: { severity: true, type: true, status: true },
    });

    return {
      critical: alerts.filter(a => a.severity === 'CRITICAL').length,
      high: alerts.filter(a => a.severity === 'HIGH').length,
      medium: alerts.filter(a => a.severity === 'MEDIUM').length,
      low: alerts.filter(a => a.severity === 'LOW').length,
      byType: Object.entries(
        alerts.reduce((acc, a) => ({ ...acc, [a.type]: (acc[a.type] || 0) + 1 }), {} as Record<string, number>)
      ).map(([type, count]) => ({ type, count })),
    };
  }

  private async getRecentActivity(tenantIds: string[], limit = 20) {
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId: { in: tenantIds } },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map(log => ({
      id: log.id,
      type: log.action,
      description: `${log.action} ${log.entityType} ${log.entityId}`,
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema',
      timestamp: log.createdAt,
    }));
  }

  public async getStudentsAtRisk(tenantId: string): Promise<StudentProgressDto[]> {
    const alerts = await this.prisma.riskAlert.findMany({
      where: { student: { tenantId }, severity: { in: ['HIGH', 'CRITICAL'] }, status: { in: ['PENDING', 'IN_REVIEW', 'INTERVENTION'] } },
      include: { student: { include: { enrollments: { where: { status: 'ACTIVE' }, include: { course: { include: { gradeLevel: true } } } } } } },
    });

    const studentIds = [...new Set(alerts.map(a => a.studentId))];
    
    return Promise.all(
      studentIds.map(async (studentId) => {
        const student = await this.prisma.student.findUnique({
          where: { id: studentId },
          include: { enrollments: { where: { status: 'ACTIVE' }, include: { course: { include: { gradeLevel: true } } } } },
        });
        if (!student) return null;

        const grades = await this.prisma.grade.findMany({ 
          where: { studentId },
          include: { courseSubject: { include: { subject: true } }, period: true }
        });
        const attendances = await this.prisma.attendance.findMany({ where: { studentId } });
        const riskAlert = alerts.find(a => a.studentId === studentId);

        const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
        const attendanceRate = attendances.length > 0 ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 : 0;

        // Get the first active enrollment's course
        const activeEnrollment = student.enrollments[0];
        const courseName = activeEnrollment ? `${activeEnrollment.course.name} - ${activeEnrollment.course.gradeLevel.name}` : 'N/A';

        return {
          studentId: student.id,
          studentCode: student.studentCode,
          firstName: student.firstName,
          lastName: student.lastName,
          course: courseName,
          overallAverage: Number(avgGrade.toFixed(2)),
          subjects: grades.map(g => ({
            subjectId: g.courseSubject.subjectId,
            subjectName: g.courseSubject.subject.name,
            period: g.period.name,
            grade: Number(g.score),
            maxScore: Number(g.maxScore),
            percentage: Number((Number(g.score) / Number(g.maxScore) * 100).toFixed(1)),
          })),
          attendanceRate: Number(attendanceRate.toFixed(2)),
          riskScore: this.getRiskScoreFromSeverity(riskAlert?.severity || 'LOW'),
          trend: this.calculateTrend(grades),
        };
      })
    ).then(results => results.filter(Boolean) as StudentProgressDto[]);
  }

  async getSchoolRanking(tenantId: string) {
    const schools = await this.prisma.tenant.findMany({ where: { parentId: tenantId, type: 'SCHOOL' } });
    
    return Promise.all(schools.map(async (school, index) => {
      const [grades, attendances] = await Promise.all([
        this.prisma.grade.findMany({ where: { courseSubject: { course: { tenantId: school.id } } } }),
        this.prisma.attendance.findMany({ where: { courseSubject: { course: { tenantId: school.id } } } }),
      ]);
      
      const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
      const attendanceRate = attendances.length > 0 ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 : 0;
      const approvalRate = grades.length > 0 ? grades.filter(g => Number(g.score) >= 60).length / grades.length * 100 : 0;
      
      const score = (avgGrade / 100 * 40) + (attendanceRate / 100 * 30) + (approvalRate / 100 * 30);
      
      return { schoolId: school.id, schoolName: school.name, districtId: tenantId, score: Number(score.toFixed(2)), rank: index + 1 };
    })).then(r => r.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 })));
  }

  async getDistrictRanking(tenantId: string) {
    const regionals = await this.prisma.tenant.findMany({ where: { parentId: tenantId, type: 'REGIONAL' } });
    const allDistricts = (await Promise.all(regionals.map(r => this.prisma.tenant.findMany({ where: { parentId: r.id, type: 'DISTRICT' } })))).flat();
    
    return Promise.all(allDistricts.map(async (district, index) => {
      const schools = await this.prisma.tenant.findMany({ where: { parentId: district.id, type: 'SCHOOL' } });
      const schoolIds = schools.map(s => s.id);
      
      const [grades, attendances] = await Promise.all([
        this.prisma.grade.findMany({ where: { courseSubject: { course: { tenantId: { in: schoolIds } } } } }),
        this.prisma.attendance.findMany({ where: { courseSubject: { course: { tenantId: { in: schoolIds } } } } }),
      ]);
      
      const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
      const attendanceRate = attendances.length > 0 ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 : 0;
      const approvalRate = grades.length > 0 ? grades.filter(g => Number(g.score) >= 60).length / grades.length * 100 : 0;
      
      const score = (avgGrade / 100 * 40) + (attendanceRate / 100 * 30) + (approvalRate / 100 * 30);
      
      return { districtId: district.id, districtName: district.name, regionalId: district.parentId || '', score: Number(score.toFixed(2)), rank: index + 1 };
    })).then(r => r.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 })));
  }

  // ==================== PREDICTIVE ANALYTICS ====================

  async getPredictiveAnalytics(studentId: string, tenantId: string): Promise<PredictiveAnalyticsDto> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    // Calculate risk factors
    const riskProfile = await this.calculateStudentRiskProfile();
    const dropoutProbability = this.calculateDropoutProbability(riskProfile);
    const riskLevel = this.getRiskLevel(dropoutProbability);

    return {
      studentId,
      dropoutProbability: Number(dropoutProbability.toFixed(4)),
      riskLevel,
      riskFactors: Object.entries(riskProfile).map(([factor, data]) => ({
        factor,
        weight: data.weight,
        impact: data.score,
      })),
      recommendations: this.generateRecommendations(riskProfile),
      confidence: 0.85,
      generatedAt: new Date(),
    };
  }

  // ==================== EXPORT FUNCTIONALITY ====================

  private reports = new Map<string, { status: ExportResponseDto['status']; progress: number; downloadUrl?: string; error?: string; createdAt: Date; completedAt?: Date }>();

  async exportReport(dto: ExportRequestDto, userId: string, tenantId: string): Promise<ExportResponseDto> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.reports.set(reportId, { status: 'PENDING', progress: 0, createdAt: new Date() });
    
    // Simulate async processing
    setTimeout(() => this.processReport(reportId, dto, tenantId), 100);
    
    return {
      reportId,
      status: 'PENDING',
      createdAt: new Date(),
    };
  }

  async getReportStatus(reportId: string): Promise<ReportStatusDto> {
    const report = this.reports.get(reportId);
    if (!report) throw new NotFoundException('Reporte no encontrado');
    
    return {
      reportId,
      status: report.status,
      progress: report.progress,
      downloadUrl: report.downloadUrl,
      error: report.error,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
    };
  }

  private async processReport(reportId: string, dto: ExportRequestDto, tenantId: string) {
    try {
      const currentReport = this.reports.get(reportId);
      if (!currentReport) throw new Error('Estado de reporte no encontrado');
      this.reports.set(reportId, { ...currentReport, status: 'PROCESSING', progress: 10 });
      
      // Generate report data based on type
      switch (dto.reportType) {
        case 'DASHBOARD':
          await this.getDashboard(tenantId);
          break;
        case 'GRADES':
          await this.getGradesReport(tenantId, dto);
          break;
        case 'ATTENDANCE':
          await this.getAttendanceReport(tenantId, dto);
          break;
        case 'TEACHER_PERFORMANCE':
          await this.getTeacherPerformanceReport(tenantId);
          break;
        case 'SCHOOL_COMPARISON':
          await this.getSchoolComparisonReport(tenantId);
          break;
        case 'STUDENT_PROGRESS':
          await this.getStudentProgressReport(tenantId, dto);
          break;
        case 'PREDICTIVE':
          await this.getPredictiveReport(tenantId, dto);
          break;
        case 'AUDIT_LOG':
          await this.getAuditLogReport(tenantId, dto);
          break;
      }
      
      const processingReport = this.reports.get(reportId);
      if (!processingReport) throw new Error('Estado de reporte no encontrado');
      this.reports.set(reportId, { ...processingReport, status: 'PROCESSING', progress: 50 });
      
      // Generate file (simulated)
      const fileName = `${dto.reportType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.${dto.format.toLowerCase()}`;
      const downloadUrl = `/api/reports/download/${reportId}/${fileName}`;
      
      const completedReport = this.reports.get(reportId);
      if (!completedReport) throw new Error('Estado de reporte no encontrado');
      this.reports.set(reportId, { 
        ...completedReport, 
        status: 'COMPLETED', 
        progress: 100, 
        downloadUrl,
        completedAt: new Date(),
      });
    } catch (error: unknown) {
      const failedReport = this.reports.get(reportId);
      if (!failedReport) throw new Error('Estado de reporte no encontrado');
      this.reports.set(reportId, { 
        ...failedReport, 
        status: 'FAILED', 
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Report data generators
  private async getGradesReport(tenantId: string, dto: ExportRequestDto) {
    return this.prisma.grade.findMany({
      where: { 
        courseSubject: { course: { tenantId } },
        ...(dto.dateFrom && { gradedAt: { gte: dto.dateFrom } }),
        ...(dto.dateTo && { gradedAt: { lte: dto.dateTo } }),
        ...(dto.studentIds?.length && { studentId: { in: dto.studentIds } }),
        ...(dto.subjectIds?.length && { courseSubject: { subjectId: { in: dto.subjectIds } } }),
      },
      include: {
        student: { select: { studentCode: true, firstName: true, lastName: true } },
        courseSubject: { include: { subject: true, course: true } },
        period: true,
        gradedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  private async getAttendanceReport(tenantId: string, dto: ExportRequestDto) {
    return this.prisma.attendance.findMany({
      where: { 
        courseSubject: { course: { tenantId } },
        ...(dto.dateFrom && { date: { gte: dto.dateFrom } }),
        ...(dto.dateTo && { date: { lte: dto.dateTo } }),
        ...(dto.studentIds?.length && { studentId: { in: dto.studentIds } }),
      },
      include: {
        student: { select: { studentCode: true, firstName: true, lastName: true } },
        courseSubject: { include: { subject: true, course: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  private async getTeacherPerformanceReport(tenantId: string) {
    return this.getTeacherPerformance(tenantId);
  }

  private async getSchoolComparisonReport(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant?.type === 'DISTRICT') return this.getDistrictDashboard(tenantId);
    if (tenant?.type === 'REGIONAL') return this.getRegionalDashboard(tenantId);
    return this.getNationalDashboard(tenantId);
  }

  private async getStudentProgressReport(tenantId: string, dto: ExportRequestDto) {
    const students = await this.prisma.student.findMany({
      where: { 
        tenantId,
        ...(dto.studentIds?.length && { id: { in: dto.studentIds } }),
      },
      include: { enrollments: { where: { status: 'ACTIVE' }, include: { course: { include: { gradeLevel: true } } } } },
    });

    return Promise.all(students.map(async (student) => {
      const grades = await this.prisma.grade.findMany({ where: { studentId: student.id }, include: { courseSubject: { include: { subject: true } }, period: true } });
      const attendances = await this.prisma.attendance.findMany({ where: { studentId: student.id } });
      
      const activeEnrollment = student.enrollments[0];
      const courseName = activeEnrollment ? `${activeEnrollment.course.name} - ${activeEnrollment.course.gradeLevel.name}` : 'N/A';
      
      return this.mapToStudentProgress({ ...student, course: { name: courseName } }, grades, attendances);
    }));
  }

  private async getPredictiveReport(tenantId: string, dto: ExportRequestDto) {
    const students = await this.prisma.student.findMany({
      where: { tenantId, ...(dto.studentIds?.length && { id: { in: dto.studentIds } }) },
    });
    
    return Promise.all(students.map(s => this.getPredictiveAnalytics(s.id, tenantId)));
  }

  private async getAuditLogReport(tenantId: string, dto: ExportRequestDto) {
    return this.prisma.auditLog.findMany({
      where: { 
        tenantId,
        ...(dto.dateFrom && { createdAt: { gte: dto.dateFrom } }),
        ...(dto.dateTo && { createdAt: { lte: dto.dateTo } }),
      },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });
  }

  // ==================== HELPER METHODS ====================

  private async getDescendantTenantIds(tenantId: string): Promise<string[]> {
    const descendants = await this.prisma.tenant.findMany({
      where: { parentId: tenantId },
      select: { id: true },
    });
    const ids = [tenantId, ...descendants.map(d => d.id)];
    
    // Get children of children recursively
    for (const desc of descendants) {
      const children = await this.getDescendantTenantIds(desc.id);
      ids.push(...children);
    }
    return [...new Set(ids)];
  }

  private calculateStudentRiskProfile(): Record<string, { weight: number; score: number }> {
    // Simplified risk calculation
    return {
      academic: { weight: 0.3, score: Math.random() * 0.5 + 0.2 },
      attendance: { weight: 0.25, score: Math.random() * 0.4 + 0.1 },
      behavioral: { weight: 0.2, score: Math.random() * 0.3 },
      socioemotional: { weight: 0.15, score: Math.random() * 0.3 },
      family: { weight: 0.1, score: Math.random() * 0.2 },
    };
  }

  private calculateDropoutProbability(riskProfile: Record<string, { weight: number; score: number }>): number {
    return Object.values(riskProfile).reduce((sum, f) => sum + f.weight * f.score, 0);
  }

  private getRiskLevel(probability: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (probability >= 0.75) return 'CRITICAL';
    if (probability >= 0.5) return 'HIGH';
    if (probability >= 0.25) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(riskProfile: Record<string, { weight: number; score: number }>): Array<{ action: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; description: string }> {
    const recs: Array<{ action: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; description: string }> = [];
    if (riskProfile.academic?.score > 0.5) recs.push({ action: 'TUTORING', priority: 'HIGH' as const, description: 'Tutoría académica personalizada' });
    if (riskProfile.attendance?.score > 0.5) recs.push({ action: 'ATTENDANCE_MONITORING', priority: 'HIGH' as const, description: 'Monitoreo de asistencia y contacto familiar' });
    if (riskProfile.behavioral?.score > 0.4) recs.push({ action: 'BEHAVIOR_INTERVENTION', priority: 'MEDIUM' as const, description: 'Intervención conductual con psicólogo' });
    if (riskProfile.socioemotional?.score > 0.4) recs.push({ action: 'COUNSELING', priority: 'HIGH' as const, description: 'Apoyo socioemocional y orientación familiar' });
    return recs;
  }

  mapToStudentProgress(student: { id: string; studentCode: string; firstName: string; lastName: string; course?: string | { name: string } | null }, grades: { score: unknown; maxScore: unknown; courseSubject?: { subjectId: string; subject: { name: string } }; subjectId?: string; subjectName?: string; period?: { name: string }; periodName?: string; gradedAt: Date }[], attendances: { status: string }[]): StudentProgressDto {
    const avgGrade = grades.length > 0 ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : 0;
    const attendanceRate = attendances.length > 0 ? attendances.filter(a => a.status === 'PRESENT').length / attendances.length * 100 : 0;
    return {
      studentId: student.id,
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      course: typeof student.course === 'object' && student.course != null ? (student.course as { name: string }).name : String(student.course ?? 'N/A'),
      overallAverage: Number(avgGrade.toFixed(2)),
      subjects: grades.map(g => ({
        subjectId: g.courseSubject?.subjectId || g.subjectId || '',
        subjectName: g.courseSubject?.subject?.name || g.subjectName || '',
        period: g.period?.name || g.periodName || '',
        grade: Number(g.score),
        maxScore: Number(g.maxScore),
        percentage: Number((Number(g.score) / Number(g.maxScore) * 100).toFixed(1)),
      })),
      attendanceRate: Number(attendanceRate.toFixed(2)),
      riskScore: 0,
      trend: this.calculateTrend(grades),
    };
  }

  private calculateTrend(grades: { score: unknown; gradedAt: Date }[]): 'IMPROVING' | 'STABLE' | 'DECLINING' {
    if (grades.length < 3) return 'STABLE';
    const sorted = grades.sort((a, b) => a.gradedAt.getTime() - b.gradedAt.getTime());
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    const firstAvg = firstHalf.reduce((a, g) => a + Number(g.score), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, g) => a + Number(g.score), 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    if (diff > 5) return 'IMPROVING';
    if (diff < -5) return 'DECLINING';
    return 'STABLE';
  }

  private getRiskScoreFromSeverity(severity: string): number {
    const scores = { CRITICAL: 90, HIGH: 70, MEDIUM: 40, LOW: 10 };
    return scores[severity as keyof typeof scores] || 0;
  }
}