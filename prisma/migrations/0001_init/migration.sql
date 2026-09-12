-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('SYSTEM', 'REGIONAL', 'DISTRICT', 'SCHOOL');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('SUPER_ADMIN', 'MINERD_ANALYST', 'REGIONAL_DIRECTOR', 'REGIONAL_TECHNICIAN', 'DISTRICT_DIRECTOR', 'DISTRICT_TECHNICIAN', 'SCHOOL_DIRECTOR', 'VICE_DIRECTOR', 'COORDINATOR', 'TEACHER', 'COUNSELOR', 'PSYCHOLOGIST', 'SECRETARY', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('INICIAL', 'PRIMARIA', 'SECUNDARIA');

-- CreateEnum
CREATE TYPE "SubjectArea" AS ENUM ('CIENCIAS_NATURALES', 'MATEMATICAS', 'LENGUA_ESPAÑOLA', 'CIENCIAS_SOCIALES', 'INGLES', 'FRANCES', 'EDUCACION_FISICA', 'EDUCACION_ARTISTICA', 'EDUCACION_TECNOLOGICA', 'FORMACION_INTEGRAL_HUMANA_RELIGIOSA', 'ORIENTACION_ACADEMICA');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('NOMBRADO', 'CONTRATADO', 'INTERINO');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED');

-- CreateEnum
CREATE TYPE "PlanningStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GradeType" AS ENUM ('EXAM', 'PROJECT', 'HOMEWORK', 'PARTICIPATION', 'LAB', 'QUIZ', 'ORAL', 'PORTFOLIO', 'OTHER');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED', 'EARLY_LEAVE');

-- CreateEnum
CREATE TYPE "RiskType" AS ENUM ('ACADEMIC_FAILURE', 'CHRONIC_ABSENCE', 'BEHAVIORAL', 'SOCIOEMOTIONAL', 'DROPOUT_RISK', 'LEARNING_DIFFICULTY');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'INTERVENTION', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CounselingType" AS ENUM ('ACADEMIC_SUPPORT', 'BEHAVIORAL', 'FAMILY', 'PSYCHOLOGICAL', 'CAREER_GUIDANCE', 'CRISIS');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'REFERRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PASSWORD_CHANGE', 'PERMISSION_CHANGE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MEETING', 'EVALUATION', 'HOLIDAY', 'ACTIVITY', 'DEADLINE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'DANGER');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TenantType" NOT NULL,
    "parentId" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "tenantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "type" "RoleType" NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "school_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "educationLevel" "EducationLevel" NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "grade_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevelId" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "tutorId" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "educationLevel" "EducationLevel" NOT NULL,
    "area" "SubjectArea" NOT NULL,
    "requiresLab" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_subjects" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "hoursWeekly" INTEGER NOT NULL,

    CONSTRAINT "course_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseSubjectId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "classroom" TEXT,
    "schoolYearId" TEXT NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "degree" TEXT,
    "specialization" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "hoursWeekly" INTEGER NOT NULL,
    "schoolYearId" TEXT NOT NULL,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "studentCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "emergencyContact" JSONB NOT NULL,
    "medicalInfo" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_courses" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "periodId" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "student_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plannings" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "courseSubjectId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "unitNumber" INTEGER NOT NULL,
    "unitTitle" TEXT NOT NULL,
    "competencies" TEXT[],
    "objectives" TEXT[],
    "content" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "resources" TEXT[],
    "assessment" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PlanningStatus" NOT NULL DEFAULT 'DRAFT',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "embedding" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plannings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_sessions" (
    "id" TEXT NOT NULL,
    "planningId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "topic" TEXT NOT NULL,
    "activities" JSONB NOT NULL,
    "homework" TEXT,
    "resources" TEXT[],
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" TIMESTAMP(3),
    "observations" TEXT,

    CONSTRAINT "planning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseSubjectId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "activityId" TEXT,
    "type" "GradeType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxScore" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "score" DECIMAL(65,30) NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedById" TEXT NOT NULL,
    "aiAssisted" BOOLEAN NOT NULL DEFAULT false,
    "aiAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "GradeType" NOT NULL DEFAULT 'HOMEWORK',
    "maxScore" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "weight" DECIMAL(3,2) NOT NULL DEFAULT 1,
    "courseSubjectId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "instructions" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidences" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "isGraded" BOOLEAN NOT NULL DEFAULT false,
    "score" DECIMAL(5,2),
    "feedback" TEXT,
    "gradedById" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_files" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT,
    "sessionId" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "url" TEXT,
    "uploadedById" TEXT NOT NULL,
    "aiAnalyzed" BOOLEAN NOT NULL DEFAULT false,
    "aiAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseSubjectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "justification" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_alerts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "RiskType" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "indicators" JSONB NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_cases" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "type" "CounselingType" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "counseling_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_notes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counseling_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "responsibleId" TEXT NOT NULL,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counselors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "specialization" TEXT,
    "licenseNumber" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "counselors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "description" TEXT,
    "courseId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE INDEX "tenants_parentId_idx" ON "tenants"("parentId");

-- CreateIndex
CREATE INDEX "tenants_type_idx" ON "tenants"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_dni_key" ON "users"("dni");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_dni_idx" ON "users"("dni");

-- CreateIndex
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId");

-- CreateIndex
CREATE INDEX "roles_type_idx" ON "roles"("type");

-- CreateIndex
CREATE UNIQUE INDEX "roles_userId_tenantId_type_key" ON "roles"("userId", "tenantId", "type");

-- CreateIndex
CREATE INDEX "school_years_tenantId_idx" ON "school_years"("tenantId");

-- CreateIndex
CREATE INDEX "school_years_isActive_idx" ON "school_years"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "school_years_tenantId_name_key" ON "school_years"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "academic_periods_code_key" ON "academic_periods"("code");

-- CreateIndex
CREATE INDEX "academic_periods_schoolYearId_idx" ON "academic_periods"("schoolYearId");

-- CreateIndex
CREATE INDEX "academic_periods_isActive_idx" ON "academic_periods"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "academic_periods_schoolYearId_ordinal_key" ON "academic_periods"("schoolYearId", "ordinal");

-- CreateIndex
CREATE INDEX "grade_levels_tenantId_idx" ON "grade_levels"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "grade_levels_tenantId_ordinal_key" ON "grade_levels"("tenantId", "ordinal");

-- CreateIndex
CREATE INDEX "courses_schoolYearId_idx" ON "courses"("schoolYearId");

-- CreateIndex
CREATE INDEX "courses_gradeLevelId_idx" ON "courses"("gradeLevelId");

-- CreateIndex
CREATE INDEX "courses_tenantId_idx" ON "courses"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_schoolYearId_name_gradeLevelId_key" ON "courses"("schoolYearId", "name", "gradeLevelId");

-- CreateIndex
CREATE INDEX "subjects_tenantId_idx" ON "subjects"("tenantId");

-- CreateIndex
CREATE INDEX "subjects_educationLevel_idx" ON "subjects"("educationLevel");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_tenantId_code_key" ON "subjects"("tenantId", "code");

-- CreateIndex
CREATE INDEX "course_subjects_courseId_idx" ON "course_subjects"("courseId");

-- CreateIndex
CREATE INDEX "course_subjects_subjectId_idx" ON "course_subjects"("subjectId");

-- CreateIndex
CREATE INDEX "course_subjects_teacherId_idx" ON "course_subjects"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "course_subjects_courseId_subjectId_key" ON "course_subjects"("courseId", "subjectId");

-- CreateIndex
CREATE INDEX "schedules_courseId_idx" ON "schedules"("courseId");

-- CreateIndex
CREATE INDEX "schedules_courseSubjectId_idx" ON "schedules"("courseSubjectId");

-- CreateIndex
CREATE INDEX "schedules_schoolYearId_idx" ON "schedules"("schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_employeeCode_key" ON "teachers"("employeeCode");

-- CreateIndex
CREATE INDEX "teachers_tenantId_idx" ON "teachers"("tenantId");

-- CreateIndex
CREATE INDEX "teachers_employeeCode_idx" ON "teachers"("employeeCode");

-- CreateIndex
CREATE INDEX "teacher_assignments_teacherId_idx" ON "teacher_assignments"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_assignments_courseId_idx" ON "teacher_assignments"("courseId");

-- CreateIndex
CREATE INDEX "teacher_assignments_schoolYearId_idx" ON "teacher_assignments"("schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignments_teacherId_courseId_subjectId_schoolYear_key" ON "teacher_assignments"("teacherId", "courseId", "subjectId", "schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentCode_key" ON "students"("studentCode");

-- CreateIndex
CREATE INDEX "students_tenantId_idx" ON "students"("tenantId");

-- CreateIndex
CREATE INDEX "students_studentCode_idx" ON "students"("studentCode");

-- CreateIndex
CREATE INDEX "students_userId_idx" ON "students"("userId");

-- CreateIndex
CREATE INDEX "student_courses_studentId_idx" ON "student_courses"("studentId");

-- CreateIndex
CREATE INDEX "student_courses_courseId_idx" ON "student_courses"("courseId");

-- CreateIndex
CREATE INDEX "student_courses_schoolYearId_idx" ON "student_courses"("schoolYearId");

-- CreateIndex
CREATE INDEX "student_courses_periodId_idx" ON "student_courses"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "student_courses_studentId_courseId_schoolYearId_key" ON "student_courses"("studentId", "courseId", "schoolYearId");

-- CreateIndex
CREATE INDEX "plannings_teacherId_idx" ON "plannings"("teacherId");

-- CreateIndex
CREATE INDEX "plannings_courseSubjectId_idx" ON "plannings"("courseSubjectId");

-- CreateIndex
CREATE INDEX "plannings_periodId_idx" ON "plannings"("periodId");

-- CreateIndex
CREATE INDEX "plannings_status_idx" ON "plannings"("status");

-- CreateIndex
CREATE INDEX "planning_sessions_planningId_idx" ON "planning_sessions"("planningId");

-- CreateIndex
CREATE INDEX "planning_sessions_date_idx" ON "planning_sessions"("date");

-- CreateIndex
CREATE INDEX "planning_sessions_executed_idx" ON "planning_sessions"("executed");

-- CreateIndex
CREATE INDEX "grades_studentId_idx" ON "grades"("studentId");

-- CreateIndex
CREATE INDEX "grades_courseSubjectId_idx" ON "grades"("courseSubjectId");

-- CreateIndex
CREATE INDEX "grades_periodId_idx" ON "grades"("periodId");

-- CreateIndex
CREATE INDEX "grades_activityId_idx" ON "grades"("activityId");

-- CreateIndex
CREATE INDEX "grades_gradedById_idx" ON "grades"("gradedById");

-- CreateIndex
CREATE INDEX "activities_courseSubjectId_idx" ON "activities"("courseSubjectId");

-- CreateIndex
CREATE INDEX "activities_periodId_idx" ON "activities"("periodId");

-- CreateIndex
CREATE INDEX "activities_teacherId_idx" ON "activities"("teacherId");

-- CreateIndex
CREATE INDEX "evidences_activityId_idx" ON "evidences"("activityId");

-- CreateIndex
CREATE INDEX "evidences_studentId_idx" ON "evidences"("studentId");

-- CreateIndex
CREATE INDEX "evidences_gradedById_idx" ON "evidences"("gradedById");

-- CreateIndex
CREATE INDEX "evidence_files_gradeId_idx" ON "evidence_files"("gradeId");

-- CreateIndex
CREATE INDEX "evidence_files_sessionId_idx" ON "evidence_files"("sessionId");

-- CreateIndex
CREATE INDEX "evidence_files_uploadedById_idx" ON "evidence_files"("uploadedById");

-- CreateIndex
CREATE INDEX "attendances_studentId_idx" ON "attendances"("studentId");

-- CreateIndex
CREATE INDEX "attendances_courseSubjectId_idx" ON "attendances"("courseSubjectId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "attendances_recordedById_idx" ON "attendances"("recordedById");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_studentId_courseSubjectId_date_key" ON "attendances"("studentId", "courseSubjectId", "date");

-- CreateIndex
CREATE INDEX "risk_alerts_studentId_idx" ON "risk_alerts"("studentId");

-- CreateIndex
CREATE INDEX "risk_alerts_type_idx" ON "risk_alerts"("type");

-- CreateIndex
CREATE INDEX "risk_alerts_severity_idx" ON "risk_alerts"("severity");

-- CreateIndex
CREATE INDEX "risk_alerts_status_idx" ON "risk_alerts"("status");

-- CreateIndex
CREATE INDEX "risk_alerts_assignedToId_idx" ON "risk_alerts"("assignedToId");

-- CreateIndex
CREATE INDEX "counseling_cases_studentId_idx" ON "counseling_cases"("studentId");

-- CreateIndex
CREATE INDEX "counseling_cases_counselorId_idx" ON "counseling_cases"("counselorId");

-- CreateIndex
CREATE INDEX "counseling_cases_status_idx" ON "counseling_cases"("status");

-- CreateIndex
CREATE INDEX "counseling_notes_caseId_idx" ON "counseling_notes"("caseId");

-- CreateIndex
CREATE INDEX "interventions_caseId_idx" ON "interventions"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "counselors_userId_key" ON "counselors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "counselors_employeeCode_key" ON "counselors"("employeeCode");

-- CreateIndex
CREATE INDEX "counselors_tenantId_idx" ON "counselors"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "school_events_tenantId_idx" ON "school_events"("tenantId");

-- CreateIndex
CREATE INDEX "school_events_date_idx" ON "school_events"("date");

-- CreateIndex
CREATE INDEX "school_events_courseId_idx" ON "school_events"("courseId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_years" ADD CONSTRAINT "school_years_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_periods_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_levels" ADD CONSTRAINT "grade_levels_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "grade_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_subjects" ADD CONSTRAINT "course_subjects_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_subjects" ADD CONSTRAINT "course_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_subjects" ADD CONSTRAINT "course_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_courseSubjectId_fkey" FOREIGN KEY ("courseSubjectId") REFERENCES "course_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "academic_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plannings" ADD CONSTRAINT "plannings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plannings" ADD CONSTRAINT "plannings_courseSubjectId_fkey" FOREIGN KEY ("courseSubjectId") REFERENCES "course_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plannings" ADD CONSTRAINT "plannings_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_sessions" ADD CONSTRAINT "planning_sessions_planningId_fkey" FOREIGN KEY ("planningId") REFERENCES "plannings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_courseSubjectId_fkey" FOREIGN KEY ("courseSubjectId") REFERENCES "course_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_courseSubjectId_fkey" FOREIGN KEY ("courseSubjectId") REFERENCES "course_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "planning_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_courseSubjectId_fkey" FOREIGN KEY ("courseSubjectId") REFERENCES "course_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_cases" ADD CONSTRAINT "counseling_cases_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_cases" ADD CONSTRAINT "counseling_cases_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_notes" ADD CONSTRAINT "counseling_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "counseling_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_notes" ADD CONSTRAINT "counseling_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "counseling_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselors" ADD CONSTRAINT "counselors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselors" ADD CONSTRAINT "counselors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
