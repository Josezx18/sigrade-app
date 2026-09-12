import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma } from '@prisma/client';
import {
  CreateSchoolYearDto,
  UpdateSchoolYearDto,
  CreateAcademicPeriodDto,
  UpdateAcademicPeriodDto,
  CreateGradeLevelDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateCourseDto,
  UpdateCourseDto,
  AssignSubjectToCourseDto,
  CreateScheduleDto,
} from './dto/academic.dto';

@Injectable()
export class AcademicService {
  constructor(private prisma: PrismaService) {}

  // ==================== SCHOOL YEARS ====================

  async findSchoolYears(tenantId: string) {
    return this.prisma.schoolYear.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findSchoolYearById(id: string) {
    const entity = await this.prisma.schoolYear.findUnique({
      where: { id },
      include: { academicPeriods: { orderBy: { ordinal: 'asc' } } },
    });
    if (!entity) throw new NotFoundException('Año escolar no encontrado');
    return entity;
  }

  async createSchoolYear(tenantId: string, dto: CreateSchoolYearDto) {
    const data: Prisma.SchoolYearCreateInput = {
      name: dto.name,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      isActive: dto.isActive,
      tenant: { connect: { id: tenantId } },
    };
    return this.prisma.schoolYear.create({ data });
  }

  async updateSchoolYear(id: string, dto: UpdateSchoolYearDto) {
    await this.findSchoolYearById(id);
    const data: Prisma.SchoolYearUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return this.prisma.schoolYear.update({ where: { id }, data });
  }

  async deleteSchoolYear(id: string) {
    await this.findSchoolYearById(id);
    return this.prisma.schoolYear.delete({ where: { id } });
  }

  // ==================== PERIODS ====================

  async findPeriods(schoolYearId: string) {
    return this.prisma.academicPeriod.findMany({
      where: { schoolYearId },
      orderBy: { ordinal: 'asc' },
    });
  }

  async createPeriod(schoolYearId: string, dto: CreateAcademicPeriodDto) {
    await this.findSchoolYearById(schoolYearId);
    const data: Prisma.AcademicPeriodCreateInput = {
      name: dto.name,
      ordinal: dto.ordinal,
      code: `P${dto.ordinal}-${schoolYearId.slice(0, 8)}`,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      schoolYear: { connect: { id: schoolYearId } },
    };
    return this.prisma.academicPeriod.create({ data });
  }

  async updatePeriod(id: string, dto: UpdateAcademicPeriodDto) {
    const entity = await this.prisma.academicPeriod.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Período no encontrado');
    const data: Prisma.AcademicPeriodUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.ordinal !== undefined) data.ordinal = dto.ordinal;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    return this.prisma.academicPeriod.update({ where: { id }, data });
  }

  async deletePeriod(id: string) {
    const entity = await this.prisma.academicPeriod.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Período no encontrado');
    return this.prisma.academicPeriod.delete({ where: { id } });
  }

  // ==================== GRADE LEVELS ====================

  async findGradeLevels(tenantId: string) {
    return this.prisma.gradeLevel.findMany({
      where: { tenantId },
      orderBy: { ordinal: 'asc' },
    });
  }

  async createGradeLevel(tenantId: string, dto: CreateGradeLevelDto) {
    const data: Prisma.GradeLevelCreateInput = {
      name: dto.name,
      ordinal: dto.ordinal,
      educationLevel: dto.educationLevel,
      tenant: { connect: { id: tenantId } },
    };
    return this.prisma.gradeLevel.create({ data });
  }

  async deleteGradeLevel(id: string) {
    const entity = await this.prisma.gradeLevel.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Nivel de grado no encontrado');
    return this.prisma.gradeLevel.delete({ where: { id } });
  }

  // ==================== SUBJECTS ====================

  async findSubjects(tenantId: string, filters?: { educationLevel?: string }) {
    const where: Prisma.SubjectWhereInput = { tenantId };
    if (filters?.educationLevel) where.educationLevel = filters.educationLevel as Prisma.EnumEducationLevelFilter['equals'];
    return this.prisma.subject.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findSubjectById(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Asignatura no encontrada');
    return subject;
  }

  async createSubject(tenantId: string, dto: CreateSubjectDto) {
    const data: Prisma.SubjectCreateInput = {
      code: dto.code,
      name: dto.name,
      educationLevel: dto.educationLevel,
      area: dto.area,
      requiresLab: dto.requiresLab,
      tenant: { connect: { id: tenantId } },
    };
    return this.prisma.subject.create({ data });
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    const entity = await this.prisma.subject.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Asignatura no encontrada');
    const data: Prisma.SubjectUpdateInput = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.educationLevel !== undefined) data.educationLevel = dto.educationLevel;
    if (dto.area !== undefined) data.area = dto.area;
    if (dto.requiresLab !== undefined) data.requiresLab = dto.requiresLab;
    return this.prisma.subject.update({ where: { id }, data });
  }

  async deleteSubject(id: string) {
    const entity = await this.prisma.subject.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Asignatura no encontrada');
    return this.prisma.subject.delete({ where: { id } });
  }

  // ==================== COURSES ====================

  async findCourses(tenantId: string, filters?: { schoolYearId?: string; gradeLevelId?: string }) {
    const where: Prisma.CourseWhereInput = { tenantId };
    if (filters?.schoolYearId) where.schoolYearId = filters.schoolYearId;
    if (filters?.gradeLevelId) where.gradeLevelId = filters.gradeLevelId;
    return this.prisma.course.findMany({
      where,
      include: {
        gradeLevel: true,
        schoolYear: true,
        tutor: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        subjects: { include: { subject: true, teacher: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCourseById(id: string) {
    const entity = await this.prisma.course.findUnique({
      where: { id },
      include: {
        gradeLevel: true,
        schoolYear: true,
        tutor: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        subjects: { include: { subject: true, teacher: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } } },
        schedule: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    });
    if (!entity) throw new NotFoundException('Curso no encontrado');
    return entity;
  }

  async createCourse(tenantId: string, dto: CreateCourseDto) {
    const data: Prisma.CourseCreateInput = {
      name: dto.name,
      gradeLevel: { connect: { id: dto.gradeLevelId } },
      schoolYear: { connect: { id: dto.schoolYearId } },
      tutor: dto.tutorId ? { connect: { id: dto.tutorId } } : undefined,
      tenant: { connect: { id: tenantId } },
    };
    return this.prisma.course.create({ data });
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.findCourseById(id);
    const data: Prisma.CourseUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.tutorId !== undefined) data.tutor = { connect: { id: dto.tutorId } };
    return this.prisma.course.update({ where: { id }, data });
  }

  async deleteCourse(id: string) {
    await this.findCourseById(id);
    return this.prisma.course.delete({ where: { id } });
  }

  // ==================== COURSE-SUBJECT ASSIGNMENTS ====================

  async assignSubjectToCourse(dto: AssignSubjectToCourseDto) {
    return this.prisma.courseSubject.create({
      data: {
        course: { connect: { id: dto.courseId } },
        subject: { connect: { id: dto.subjectId } },
        teacher: { connect: { id: dto.teacherId } },
        hoursWeekly: dto.hoursWeekly,
      },
      include: {
        course: true,
        subject: true,
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
  }

  async removeSubjectFromCourse(id: string) {
    const entity = await this.prisma.courseSubject.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Asignación no encontrada');
    return this.prisma.courseSubject.delete({ where: { id } });
  }

  // ==================== SCHEDULES ====================

  async findSchedules(courseId: string) {
    return this.prisma.schedule.findMany({
      where: { courseId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createSchedule(dto: CreateScheduleDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId }, select: { schoolYearId: true } });
    if (!course) throw new NotFoundException('Curso no encontrado');
    const data: Prisma.ScheduleCreateInput = {
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      classroom: dto.classroom,
      course: { connect: { id: dto.courseId } },
      schoolYear: { connect: { id: course.schoolYearId } },
      courseSubject: dto.courseSubjectId ? { connect: { id: dto.courseSubjectId } } : undefined,
    };
    return this.prisma.schedule.create({ data });
  }

  async deleteSchedule(id: string) {
    const entity = await this.prisma.schedule.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Horario no encontrado');
    return this.prisma.schedule.delete({ where: { id } });
  }
}
