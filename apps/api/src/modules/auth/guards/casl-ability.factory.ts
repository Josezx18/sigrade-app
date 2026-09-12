import { Injectable } from '@nestjs/common';
// @ts-expect-error @casl/ability types not resolving under strict moduleResolution
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { User, Teacher, Student, Counselor } from '@prisma/client';
import { RoleType } from '@prisma/client';

export type AppAbility = MongoAbility<[string, string]>;

type UserWithRelations = User & {
  roles: { type: RoleType }[];
  teacher?: Teacher | null;
  student?: Student | null;
  counselor?: Counselor | null;
};

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: UserWithRelations) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    const roles = user.roles.map((r) => r.type);
    const isSuperAdmin = roles.includes(RoleType.SUPER_ADMIN);
    const isMinerdAnalyst = roles.includes(RoleType.MINERD_ANALYST);

    if (isSuperAdmin || isMinerdAnalyst) {
      can('manage', 'all');
      return build();
    }

    const regionalRoles = [RoleType.REGIONAL_DIRECTOR, RoleType.REGIONAL_TECHNICIAN] as const;
    const districtRoles = [RoleType.DISTRICT_DIRECTOR, RoleType.DISTRICT_TECHNICIAN] as const;
    const schoolRoles = [
      RoleType.SCHOOL_DIRECTOR,
      RoleType.VICE_DIRECTOR,
      RoleType.COORDINATOR,
      RoleType.TEACHER,
      RoleType.COUNSELOR,
      RoleType.PSYCHOLOGIST,
      RoleType.SECRETARY,
    ] as const;
    const studentRoles = [RoleType.STUDENT, RoleType.PARENT] as const;

    const hasRegionalRole = roles.some((r: RoleType) => (regionalRoles as readonly RoleType[]).includes(r));
    const hasDistrictRole = roles.some((r: RoleType) => (districtRoles as readonly RoleType[]).includes(r));
    const hasSchoolRole = roles.some((r: RoleType) => (schoolRoles as readonly RoleType[]).includes(r));
    const hasStudentRole = roles.some((r: RoleType) => (studentRoles as readonly RoleType[]).includes(r));

    if (hasRegionalRole) {
      can('read', 'Tenant', { type: { in: ['REGIONAL', 'DISTRICT', 'SCHOOL'] } });
      can('read', 'User', { tenantId: user.tenantId });
      can('read', 'Course', { tenantId: user.tenantId });
      can('read', 'Student', { tenantId: user.tenantId });
      can('read', 'Teacher', { tenantId: user.tenantId });
      can('read', 'Grade', { courseSubject: { course: { tenantId: user.tenantId } } });
      can('read', 'Attendance', { courseSubject: { course: { tenantId: user.tenantId } } });
      can('read', 'Planning', { courseSubject: { course: { tenantId: user.tenantId } } });
      can('read', 'RiskAlert', { student: { tenantId: user.tenantId } });
      can('read', 'CounselingCase', { student: { tenantId: user.tenantId } });
      can('read', 'Analytics', { tenantId: user.tenantId });
      can('manage', 'Report', { tenantId: user.tenantId });
    }

    if (hasDistrictRole) {
      can('read', 'Tenant', { type: { in: ['DISTRICT', 'SCHOOL'] }, parentId: user.tenantId });
      can('read', 'User', { tenantId: user.tenantId });
      can('read', 'Course', { tenantId: user.tenantId });
      can('read', 'Student', { tenantId: user.tenantId });
      can('read', 'Teacher', { tenantId: user.tenantId });
      can('read', 'Grade', { courseSubject: { course: { tenantId: user.tenantId } } });
      can('read', 'Attendance', { courseSubject: { course: { tenantId: user.tenantId } } });
      can('read', 'Planning', { courseSubject: { course: { tenantId: user.tenantId } } });
      can('read', 'RiskAlert', { student: { tenantId: user.tenantId } });
      can('read', 'CounselingCase', { student: { tenantId: user.tenantId } });
      can('manage', 'Report', { tenantId: user.tenantId });
    }

    if (hasSchoolRole) {
      can('read', 'Tenant', { id: user.tenantId });
      can('read', 'User', { tenantId: user.tenantId });

      if (roles.includes(RoleType.SCHOOL_DIRECTOR) || roles.includes(RoleType.VICE_DIRECTOR)) {
        can('manage', 'Course', { tenantId: user.tenantId });
        can('manage', 'Student', { tenantId: user.tenantId });
        can('manage', 'Teacher', { tenantId: user.tenantId });
        can('manage', 'Grade', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('manage', 'Attendance', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('manage', 'Planning', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('manage', 'RiskAlert', { student: { tenantId: user.tenantId } });
        can('manage', 'CounselingCase', { student: { tenantId: user.tenantId } });
        can('manage', 'Report', { tenantId: user.tenantId });
      }

      if (roles.includes(RoleType.COORDINATOR)) {
        can('read', 'Course', { tenantId: user.tenantId });
        can('read', 'Student', { tenantId: user.tenantId });
        can('read', 'Teacher', { tenantId: user.tenantId });
        can('read', 'Grade', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('read', 'Attendance', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('read', 'Planning', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('update', 'Planning', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('read', 'RiskAlert', { student: { tenantId: user.tenantId } });
        can('read', 'CounselingCase', { student: { tenantId: user.tenantId } });
        can('manage', 'Report', { tenantId: user.tenantId });
      }

      if (roles.includes(RoleType.TEACHER) && user.teacher) {
        can('read', 'Course', { subjects: { some: { teacherId: user.teacher.id } } });
        can('read', 'Student', { enrollments: { some: { course: { subjects: { some: { teacherId: user.teacher.id } } } } } });
        can('manage', 'Grade', { courseSubject: { teacherId: user.teacher.id } });
        can('manage', 'Attendance', { courseSubject: { teacherId: user.teacher.id } });
        can('manage', 'Planning', { teacherId: user.teacher.id });
        can('manage', 'EvidenceFile', { uploadedById: user.id });
        can('read', 'RiskAlert', { student: { tenantId: user.tenantId } });
        can('read', 'CounselingCase', { student: { tenantId: user.tenantId } });
      }

      if (roles.includes(RoleType.COUNSELOR) || roles.includes(RoleType.PSYCHOLOGIST)) {
        can('read', 'Student', { tenantId: user.tenantId });
        can('read', 'Grade', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('read', 'Attendance', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('manage', 'RiskAlert', { student: { tenantId: user.tenantId } });
        can('manage', 'CounselingCase', { counselorId: user.id });
        can('manage', 'CounselingNote', { authorId: user.id });
        can('manage', 'Intervention', { responsibleId: user.id });
      }

      if (roles.includes(RoleType.SECRETARY)) {
        can('read', 'Course', { tenantId: user.tenantId });
        can('read', 'Student', { tenantId: user.tenantId });
        can('read', 'Teacher', { tenantId: user.tenantId });
        can('manage', 'Grade', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('manage', 'Attendance', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('read', 'Planning', { courseSubject: { course: { tenantId: user.tenantId } } });
        can('manage', 'Report', { tenantId: user.tenantId });
      }
    }

    if (hasStudentRole && user.student) {
      can('read', 'Course', { students: { some: { id: user.student.id } } });
      can('read', 'Grade', { studentId: user.student.id });
      can('read', 'Attendance', { studentId: user.student.id });
      can('read', 'Planning', { courseSubject: { course: { students: { some: { id: user.student.id } } } } });
      can('read', 'RiskAlert', { studentId: user.student.id });
    }

    return build();
  }
}