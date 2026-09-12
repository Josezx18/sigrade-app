import { IsEnum, IsOptional, IsString, IsUUID, IsDate, IsNumber, Min, Max, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantType } from '@sigrade/shared-prisma';

export class AnalyticsFiltersDto {
  @ApiPropertyOptional({ enum: TenantType })
  @IsOptional()
  @IsEnum(TenantType)
  level?: TenantType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class DashboardKpisDto {
  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  activeStudents: number;

  @ApiProperty()
  totalTeachers: number;

  @ApiProperty()
  activeTeachers: number;

  @ApiProperty()
  totalCourses: number;

  @ApiProperty()
  totalSubjects: number;

  @ApiProperty()
  averageGrade: number;

  @ApiProperty()
  approvalRate: number;

  @ApiProperty()
  attendanceRate: number;

  @ApiProperty()
  dropoutRiskStudents: number;

  @ApiProperty()
  studentsWithAlerts: number;

  @ApiProperty()
  openCounselingCases: number;

  @ApiProperty()
  totalSchools?: number;

  @ApiProperty()
  totalDistricts?: number;

  @ApiProperty()
  totalRegional?: number;
}

export class GradeDistributionDto {
  @ApiProperty()
  range: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;
}

export class AttendanceTrendDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  present: number;

  @ApiProperty()
  absent: number;

  @ApiProperty()
  late: number;

  @ApiProperty()
  justified: number;

  @ApiProperty()
  rate: number;
}

export class SubjectPerformanceDto {
  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  subjectName: string;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  averageGrade: number;

  @ApiProperty()
  approvalRate: number;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  failedStudents: number;

  @ApiProperty({ type: [GradeDistributionDto] })
  distribution: GradeDistributionDto[];
}

export class TeacherPerformanceDto {
  @ApiProperty()
  teacherId: string;

  @ApiProperty()
  teacherName: string;

  @ApiProperty()
  employeeCode: string;

  @ApiProperty()
  subjects: string[];

  @ApiProperty()
  courses: string[];

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  averageGrade: number;

  @ApiProperty()
  approvalRate: number;

  @ApiProperty()
  attendanceRate: number;

  @ApiProperty()
  planningsCompleted: number;

  @ApiProperty()
  planningsTotal: number;
}

export class SchoolComparisonDto {
  @ApiProperty()
  schoolId: string;

  @ApiProperty()
  schoolName: string;

  @ApiProperty()
  schoolCode: string;

  @ApiProperty()
  district: string;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  averageGrade: number;

  @ApiProperty()
  approvalRate: number;

  @ApiProperty()
  attendanceRate: number;

  @ApiProperty()
  dropoutRisk: number;

  @ApiProperty()
  teachersCount: number;

  @ApiProperty()
  studentsPerTeacher: number;
}

export class StudentProgressDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentCode: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  course: string;

  @ApiProperty()
  overallAverage: number;

  @ApiProperty({ type: [Object] })
  subjects: {
    subjectId: string;
    subjectName: string;
    period: string;
    grade: number;
    maxScore: number;
    percentage: number;
  }[];

  @ApiProperty()
  attendanceRate: number;

  @ApiProperty()
  riskScore: number;

  @ApiProperty()
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

export class PredictiveAnalyticsDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  dropoutProbability: number;

  @ApiProperty()
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({ type: [Object] })
  riskFactors: {
    factor: string;
    weight: number;
    impact: number;
  }[];

  @ApiProperty({ type: [Object] })
  recommendations: {
    action: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
  }[];

  @ApiProperty()
  confidence: number;

  @ApiProperty()
  generatedAt: Date;
}

export class ExportRequestDto {
  @ApiProperty({ enum: ['PDF', 'EXCEL', 'CSV'] })
  @IsEnum(['PDF', 'EXCEL', 'CSV'])
  format: 'PDF' | 'EXCEL' | 'CSV';

  @ApiProperty({ enum: ['DASHBOARD', 'GRADES', 'ATTENDANCE', 'TEACHER_PERFORMANCE', 'SCHOOL_COMPARISON', 'STUDENT_PROGRESS', 'PREDICTIVE', 'AUDIT_LOG'] })
  @IsEnum(['DASHBOARD', 'GRADES', 'ATTENDANCE', 'TEACHER_PERFORMANCE', 'SCHOOL_COMPARISON', 'STUDENT_PROGRESS', 'PREDICTIVE', 'AUDIT_LOG'])
  reportType: 'DASHBOARD' | 'GRADES' | 'ATTENDANCE' | 'TEACHER_PERFORMANCE' | 'SCHOOL_COMPARISON' | 'STUDENT_PROGRESS' | 'PREDICTIVE' | 'AUDIT_LOG';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  schoolIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  teacherIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  subjectIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}

export class ExportResponseDto {
  @ApiProperty()
  reportId: string;

  @ApiProperty()
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class ReportStatusDto {
  @ApiProperty()
  reportId: string;

  @ApiProperty()
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @ApiProperty()
  progress: number;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  error?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardKpisDto })
  kpis: DashboardKpisDto;

  @ApiProperty({ type: [GradeDistributionDto] })
  gradeDistribution: GradeDistributionDto[];

  @ApiProperty({ type: [AttendanceTrendDto] })
  attendanceTrends: AttendanceTrendDto[];

  @ApiProperty({ type: [SubjectPerformanceDto] })
  subjectPerformance: SubjectPerformanceDto[];

  @ApiProperty({ type: [TeacherPerformanceDto] })
  topTeachers: TeacherPerformanceDto[];

  @ApiProperty({ type: [SchoolComparisonDto] })
  schoolComparison?: SchoolComparisonDto[];

  @ApiProperty({ type: [Object] })
  alertsSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    byType: { type: string; count: number }[];
  };

  @ApiProperty({ type: [Object] })
  recentActivity: {
    id: string;
    type: string;
    description: string;
    user: string;
    timestamp: Date;
  }[];
}

export class NationalDashboardDto extends DashboardResponseDto {
  @ApiProperty({ type: [Object] })
  regionalComparison: {
    regionalId: string;
    regionalCode: string;
    regionalName: string;
    totalStudents: number;
    averageGrade: number;
    approvalRate: number;
    attendanceRate: number;
    schoolsCount: number;
  }[];

  @ApiProperty({ type: [Object] })
  districtRanking: {
    districtId: string;
    districtName: string;
    regionalId: string;
    score: number;
    rank: number;
  }[];
}

export class RegionalDashboardDto extends DashboardResponseDto {
  @ApiProperty({ type: [Object] })
  districtComparison: {
    districtId: string;
    districtName: string;
    totalStudents: number;
    averageGrade: number;
    approvalRate: number;
    attendanceRate: number;
    schoolsCount: number;
  }[];

  @ApiProperty({ type: [Object] })
  schoolRanking: {
    schoolId: string;
    schoolName: string;
    districtId: string;
    score: number;
    rank: number;
  }[];
}

export class DistrictDashboardDto extends DashboardResponseDto {
  @ApiProperty({ type: [Object] })
  schoolComparison: SchoolComparisonDto[];

  @ApiProperty({ type: [Object] })
  teacherRanking: TeacherPerformanceDto[];
}

export class SchoolDashboardDto extends DashboardResponseDto {
  @ApiProperty({ type: [TeacherPerformanceDto] })
  teacherPerformance: TeacherPerformanceDto[];

  @ApiProperty({ type: [StudentProgressDto] })
  studentsAtRisk: StudentProgressDto[];

  @ApiProperty({ type: [SubjectPerformanceDto] })
  subjectDetails: SubjectPerformanceDto[];
}

export class TeacherDashboardDto {
  @ApiProperty()
  teacherId: string;

  @ApiProperty()
  teacherName: string;

  @ApiProperty({ type: [Object] })
  courses: {
    courseId: string;
    courseName: string;
    subject: string;
    studentsCount: number;
    averageGrade: number;
    approvalRate: number;
    attendanceRate: number;
    planningsProgress: number;
  }[];

  @ApiProperty({ type: [StudentProgressDto] })
  students: StudentProgressDto[];

  @ApiProperty()
  workload: {
    totalHours: number;
    plannedHours: number;
    executedHours: number;
  };
}