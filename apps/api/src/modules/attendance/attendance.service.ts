import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma, AttendanceStatus } from '@prisma/client';
import { CreateAttendanceDto, UpdateAttendanceDto, BulkCreateAttendanceDto, QrAttendanceDto, JustificationDto, MonthlyReportQueryDto, AttendanceQueryDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private normalizeStatus(status: string): AttendanceStatus {
    if (status === 'EXCUSED') return AttendanceStatus.JUSTIFIED;
    return status as AttendanceStatus;
  }

  private async resolveCourseSubject(courseId?: string, subjectId?: string): Promise<string | null> {
    if (!courseId || !subjectId) return null;
    const cs = await this.prisma.courseSubject.findFirst({ where: { courseId, subjectId } });
    return cs?.id || null;
  }

  private buildCheckInTime(date: string, hour?: number, checkInTime?: string): Date | null {
    if (checkInTime) return new Date(checkInTime);
    if (hour !== undefined) {
      const d = new Date(date);
      d.setHours(hour, 0, 0, 0);
      return d;
    }
    return null;
  }

  private mapAttendance(a: {
    id: string;
    studentId: string;
    student?: { studentCode?: string | null; firstName: string; lastName: string } | null;
    courseSubject?: { courseId?: string; course?: { name?: string } | null; subjectId?: string; subject?: { name?: string } | null } | null;
    courseSubjectId: string;
    date: Date;
    checkInTime?: Date | null;
    checkOutTime?: Date | null;
    status: string;
    justification?: string | null;
    recordedById: string;
    recordedBy?: { firstName: string; lastName: string } | null;
    createdAt: Date;
  }) {
    return {
      id: a.id,
      studentId: a.studentId,
      studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : undefined,
      studentCode: a.student?.studentCode,
      courseSubjectId: a.courseSubjectId,
      courseId: a.courseSubject?.courseId || undefined,
      courseName: a.courseSubject?.course?.name,
      subjectId: a.courseSubject?.subjectId || undefined,
      subjectName: a.courseSubject?.subject?.name,
      date: a.date,
      hour: a.checkInTime ? new Date(a.checkInTime).getHours() : undefined,
      status: a.status,
      checkInTime: a.checkInTime,
      checkOutTime: a.checkOutTime,
      justification: a.justification,
      recordedById: a.recordedById,
      recordedByName: a.recordedBy ? `${a.recordedBy.firstName} ${a.recordedBy.lastName}` : undefined,
      createdAt: a.createdAt,
      updatedAt: a.createdAt,
    };
  }

  private readonly attendanceInclude = {
    student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
    courseSubject: {
      include: {
        course: { include: { gradeLevel: { select: { id: true, name: true } } } },
        subject: { select: { id: true, code: true, name: true } },
        teacher: { select: { id: true, user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    },
    recordedBy: { select: { id: true, firstName: true, lastName: true } },
  } as const;

  async findAll(query: AttendanceQueryDto) {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {};

    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.courseSubjectId) where.courseSubjectId = filters.courseSubjectId;
    if (filters.courseId || filters.subjectId) {
      where.courseSubject = {};
      if (filters.courseId) where.courseSubject.courseId = filters.courseId;
      if (filters.subjectId) where.courseSubject.subjectId = filters.subjectId;
    }
    if (filters.status) where.status = filters.status;

    const dateFrom = filters.dateFrom || filters.startDate;
    const dateTo = filters.dateTo || filters.endDate || filters.date;
    const singleDate = filters.date && !filters.dateFrom && !filters.dateTo ? filters.date : undefined;

    if (dateFrom || dateTo || singleDate) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
      if (singleDate) {
        const d = new Date(singleDate);
        where.date.gte = new Date(d.setHours(0, 0, 0, 0));
        where.date.lte = new Date(d.setHours(23, 59, 59, 999));
      }
    }

    const [attendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: this.attendanceInclude,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data: attendances.map((a) => this.mapAttendance(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: this.attendanceInclude,
    });

    if (!attendance) throw new NotFoundException('Registro de asistencia no encontrado');
    return this.mapAttendance(attendance);
  }

  async findRawById(id: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: this.attendanceInclude,
    });
    if (!attendance) throw new NotFoundException('Registro de asistencia no encontrado');
    return attendance;
  }

  async create(dto: CreateAttendanceDto, recordedById: string) {
    let courseSubjectId = dto.courseSubjectId;
    if (!courseSubjectId && dto.courseId && dto.subjectId) {
      const resolved = await this.resolveCourseSubject(dto.courseId, dto.subjectId);
      if (resolved) courseSubjectId = resolved;
    }

    if (!courseSubjectId) throw new BadRequestException('Debe proporcionar courseSubjectId o courseId + subjectId');

    const [student, courseSubject] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: dto.studentId } }),
      this.prisma.courseSubject.findUnique({ where: { id: courseSubjectId } }),
    ]);

    if (!student) throw new NotFoundException('Estudiante no encontrado');
    if (!courseSubject) throw new NotFoundException('Asignatura del curso no encontrada');

    const date = new Date(dto.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const existing = await this.prisma.attendance.findFirst({
      where: { studentId: dto.studentId, courseSubjectId, date: { gte: startOfDay, lte: endOfDay } },
    });

    if (existing) throw new ConflictException('Ya existe un registro de asistencia para este estudiante en esta fecha y asignatura');

    const status = this.normalizeStatus(dto.status);
    const checkInTime = this.buildCheckInTime(dto.date, dto.hour, dto.checkInTime);

    const attendance = await this.prisma.attendance.create({
      data: {
        studentId: dto.studentId,
        courseSubjectId,
        date: new Date(dto.date),
        status,
        checkInTime,
        checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
        justification: dto.justification,
        recordedById,
      },
    });

    return this.mapAttendance(await this.findRawById(attendance.id));
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id } });
    if (!attendance) throw new NotFoundException('Registro de asistencia no encontrado');

    const data: Prisma.AttendanceUpdateInput = {};
    if (dto.status) data.status = this.normalizeStatus(dto.status);
    if (dto.checkInTime !== undefined) data.checkInTime = dto.checkInTime ? new Date(dto.checkInTime) : null;
    if (dto.checkOutTime !== undefined) data.checkOutTime = dto.checkOutTime ? new Date(dto.checkOutTime) : null;
    if (dto.justification !== undefined) data.justification = dto.justification;

    const updated = await this.prisma.attendance.update({ where: { id }, data });
    return this.mapAttendance(await this.findRawById(updated.id));
  }

  async delete(id: string) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id } });
    if (!attendance) throw new NotFoundException('Registro de asistencia no encontrado');
    await this.prisma.attendance.delete({ where: { id } });
    return { message: 'Registro de asistencia eliminado correctamente' };
  }

  async bulkCreate(dto: BulkCreateAttendanceDto, recordedById: string) {
    let courseSubjectId = dto.courseSubjectId;
    if (!courseSubjectId && dto.courseId) {
      const firstWithSubject = dto.attendances.find(a => a.subjectId);
      if (firstWithSubject?.subjectId) {
        const resolved = await this.resolveCourseSubject(dto.courseId, firstWithSubject.subjectId);
        if (resolved) courseSubjectId = resolved;
      }
    }

    if (!courseSubjectId && dto.attendances.length > 0) {
      const first = dto.attendances[0];
      if (first.courseId && first.subjectId) {
        const resolved = await this.resolveCourseSubject(first.courseId, first.subjectId);
        if (resolved) courseSubjectId = resolved;
      }
    }

    if (!courseSubjectId) throw new BadRequestException('No se pudo resolver courseSubjectId');

    const courseSubject = await this.prisma.courseSubject.findUnique({ where: { id: courseSubjectId } });
    if (!courseSubject) throw new NotFoundException('Asignatura del curso no encontrada');

    const date = new Date(dto.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const results = { created: 0, updated: 0, errors: [] as Array<{ index: number; error: string; data: Record<string, unknown> }> };

    for (let i = 0; i < dto.attendances.length; i++) {
      const attDto = dto.attendances[i];
      try {
        const status = this.normalizeStatus(attDto.status);
        const checkInTime = this.buildCheckInTime(dto.date, attDto.hour, attDto.checkInTime);

        const existing = await this.prisma.attendance.findFirst({
          where: { studentId: attDto.studentId, courseSubjectId, date: { gte: startOfDay, lte: endOfDay } },
        });

        if (existing) {
          await this.prisma.attendance.update({
            where: { id: existing.id },
            data: { status, checkInTime, checkOutTime: attDto.checkOutTime ? new Date(attDto.checkOutTime) : null, justification: attDto.justification, recordedById },
          });
          results.updated++;
        } else {
          await this.prisma.attendance.create({
            data: { studentId: attDto.studentId, courseSubjectId, date: new Date(dto.date), status, checkInTime, checkOutTime: attDto.checkOutTime ? new Date(attDto.checkOutTime) : null, justification: attDto.justification, recordedById },
          });
          results.created++;
        }
      } catch (error: unknown) {
        results.errors.push({ index: i, error: error instanceof Error ? error.message : String(error), data: attDto as unknown as Record<string, unknown> });
      }
    }

    return results;
  }

  async qrCheckIn(dto: QrAttendanceDto, recordedById: string) {
    const [courseSubject, student] = await Promise.all([
      this.prisma.courseSubject.findUnique({ where: { id: dto.courseSubjectId } }),
      this.prisma.student.findUnique({ where: { id: dto.studentId } }),
    ]);

    if (!courseSubject) throw new NotFoundException('Asignatura del curso no encontrada');
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    const date = new Date(dto.timestamp);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const isValidQr = await this.validateQrCode(dto.qrCode, dto.courseSubjectId);
    if (!isValidQr) throw new BadRequestException('Código QR inválido o expirado');

    let attendance = await this.prisma.attendance.findFirst({
      where: { studentId: dto.studentId, courseSubjectId: dto.courseSubjectId, date: { gte: startOfDay, lte: endOfDay } },
    });

    const status = this.determineStatusByTime(dto.timestamp);

    if (attendance) {
      attendance = await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: { status, checkInTime: new Date(dto.timestamp), recordedById },
      });
    } else {
      attendance = await this.prisma.attendance.create({
        data: { studentId: dto.studentId, courseSubjectId: dto.courseSubjectId, date: new Date(dto.timestamp), status, checkInTime: new Date(dto.timestamp), recordedById },
      });
    }

    return this.mapAttendance(await this.findRawById(attendance.id));
  }

  private async validateQrCode(qrCode: string, courseSubjectId?: string): Promise<boolean> {
    if (!qrCode || qrCode.length < 10) return false;
    try {
      const qrData = JSON.parse(Buffer.from(qrCode, 'base64').toString('utf-8'));
      const isValid = qrData.courseSubjectId === courseSubjectId
        && qrData.expiresAt > Date.now()
        && qrData.signature === 'sigrade-qr';
      return isValid;
    } catch {
      return false;
    }
  }

  private determineStatusByTime(timestamp: string): AttendanceStatus {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    const classStart = 8 * 60;
    const tolerance = 15;

    if (timeInMinutes <= classStart + tolerance) return AttendanceStatus.PRESENT;
    if (timeInMinutes <= classStart + 60) return AttendanceStatus.LATE;
    return AttendanceStatus.ABSENT;
  }

  async submitJustification(dto: JustificationDto, userId: string) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id: dto.attendanceId } });
    if (!attendance) throw new NotFoundException('Registro de asistencia no encontrado');

    if (attendance.status === AttendanceStatus.JUSTIFIED) throw new BadRequestException('La asistencia ya está justificada');

    const updated = await this.prisma.attendance.update({
      where: { id: dto.attendanceId },
      data: { status: AttendanceStatus.JUSTIFIED, justification: dto.justification, recordedById: userId },
    });

    return this.mapAttendance(await this.findRawById(updated.id));
  }

  async getStudentAttendanceSummary(studentId: string, courseSubjectId: string, startDate: Date, endDate: Date) {
    const attendances = await this.prisma.attendance.findMany({
      where: { studentId, courseSubjectId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });

    const student = await this.prisma.student.findUnique({ where: { id: studentId }, select: { id: true, studentCode: true, firstName: true, lastName: true } });
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    const counts = { present: 0, absent: 0, late: 0, justified: 0, earlyLeave: 0 };
    attendances.forEach(a => { const k = a.status === 'EARLY_LEAVE' ? 'earlyLeave' : a.status.toLowerCase() as keyof typeof counts; counts[k]++; });

    const totalClasses = attendances.length;
    const attendanceRate = totalClasses > 0 ? ((counts.present + counts.late + counts.justified) / totalClasses) * 100 : 0;

    return {
      studentId: student.id,
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      totalClasses,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      justified: counts.justified,
      earlyLeave: counts.earlyLeave,
      attendanceRate: Number(attendanceRate.toFixed(2)),
      attendances: attendances.map(a => ({ id: a.id, date: a.date, status: a.status, checkInTime: a.checkInTime, checkOutTime: a.checkOutTime, justification: a.justification })),
    };
  }

  async generateMonthlyReport(query: MonthlyReportQueryDto) {
    const { courseId, year, month, studentId } = query;

    const course = await this.prisma.course.findUnique({ where: { id: courseId }, include: { gradeLevel: true } });
    if (!course) throw new NotFoundException('Curso no encontrado');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const courseSubjects = await this.prisma.courseSubject.findMany({ where: { courseId } });
    const courseSubjectIds = courseSubjects.map(cs => cs.id);

    const enrollments = await this.prisma.studentCourse.findMany({
      where: { courseId, schoolYear: { startDate: { lte: endDate }, endDate: { gte: startDate } }, status: 'ACTIVE' },
      include: { student: { select: { id: true, studentCode: true, firstName: true, lastName: true } } },
    });

    let filteredEnrollments = enrollments;
    if (studentId) filteredEnrollments = enrollments.filter(e => e.studentId === studentId);

    const studentsData = await Promise.all(
      filteredEnrollments.map(async (enrollment) => {
        const attendances = await this.prisma.attendance.findMany({
          where: { studentId: enrollment.studentId, courseSubjectId: { in: courseSubjectIds }, date: { gte: startDate, lte: endDate } },
        });

        const counts = { present: 0, absent: 0, late: 0, justified: 0, earlyLeave: 0 };
        attendances.forEach(a => { const k = a.status === 'EARLY_LEAVE' ? 'earlyLeave' : a.status.toLowerCase() as keyof typeof counts; counts[k]++; });

        const totalClasses = attendances.length;
        const attendanceRate = totalClasses > 0 ? ((counts.present + counts.late + counts.justified) / totalClasses) * 100 : 0;

        return {
          studentId: enrollment.student.id,
          studentCode: enrollment.student.studentCode,
          firstName: enrollment.student.firstName,
          lastName: enrollment.student.lastName,
          totalClasses,
          present: counts.present,
          absent: counts.absent,
          late: counts.late,
          justified: counts.justified,
          earlyLeave: counts.earlyLeave,
          attendanceRate: Number(attendanceRate.toFixed(2)),
          attendances: attendances.map(a => ({ id: a.id, date: a.date, status: a.status, checkInTime: a.checkInTime, checkOutTime: a.checkOutTime, justification: a.justification })),
        };
      })
    );

    const totalStudents = studentsData.length;
    const averageAttendanceRate = totalStudents > 0 ? studentsData.reduce((a, b) => a + b.attendanceRate, 0) / totalStudents : 0;
    const totalAbsences = studentsData.reduce((a, b) => a + b.absent, 0);
    const totalJustified = studentsData.reduce((a, b) => a + b.justified, 0);
    const criticalCases = studentsData.filter(s => s.attendanceRate < 75).map(s => ({ studentId: s.studentId, studentName: `${s.firstName} ${s.lastName}`, attendanceRate: s.attendanceRate }));

    const schoolDays = this.calculateSchoolDays(startDate, endDate);

    return {
      courseId: course.id,
      courseName: course.name,
      gradeLevel: course.gradeLevel.name,
      year,
      month,
      totalSchoolDays: schoolDays,
      students: studentsData,
      summary: { totalStudents, averageAttendanceRate: Number(averageAttendanceRate.toFixed(2)), totalAbsences, totalJustified, criticalCases },
    };
  }

  private calculateSchoolDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day >= 1 && day <= 5) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  async getStatistics(filters: AttendanceQueryDto) {
    const where: Prisma.AttendanceWhereInput = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.courseSubjectId) where.courseSubjectId = filters.courseSubjectId;
    if (filters.courseId || filters.subjectId) {
      where.courseSubject = {};
      if (filters.courseId) where.courseSubject.courseId = filters.courseId;
      if (filters.subjectId) where.courseSubject.subjectId = filters.subjectId;
    }
    if (filters.status) where.status = filters.status;

    const dateFrom = filters.dateFrom || filters.startDate;
    const dateTo = filters.dateTo || filters.endDate || filters.date;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const attendances = await this.prisma.attendance.findMany({ where, select: { status: true, studentId: true, date: true } });

    const byStatus: Record<AttendanceStatus, number> = {
      PRESENT: 0, ABSENT: 0, LATE: 0, JUSTIFIED: 0, EARLY_LEAVE: 0,
    };
    attendances.forEach(a => { byStatus[a.status]++; });

    const totalRecords = attendances.length;
    const attendanceRate = totalRecords > 0 ? ((byStatus.PRESENT + byStatus.LATE + byStatus.JUSTIFIED) / totalRecords) * 100 : 0;

    const byStudentMap = new Map<string, { present: number; total: number; name: string }>();
    for (const a of attendances) {
      const key = a.studentId;
      if (!byStudentMap.has(key)) byStudentMap.set(key, { present: 0, total: 0, name: '' });
      const entry = byStudentMap.get(key);
      if (!entry) continue;
      entry.total++;
      if (a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'JUSTIFIED') entry.present++;
    }
    const byStudent = Array.from(byStudentMap.entries()).map(([studentId, data]) => ({
      studentId,
      studentName: data.name || studentId,
      rate: data.total > 0 ? Number(((data.present / data.total) * 100).toFixed(2)) : 0,
    }));

    const byDateMap = new Map<string, { present: number; absent: number }>();
    for (const a of attendances) {
      const dateKey = a.date.toISOString().split('T')[0];
      if (!byDateMap.has(dateKey)) byDateMap.set(dateKey, { present: 0, absent: 0 });
      const entry = byDateMap.get(dateKey);
      if (!entry) continue;
      if (a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'JUSTIFIED') entry.present++;
      else entry.absent++;
    }
    const byDate = Array.from(byDateMap.entries()).map(([date, data]) => ({
      date,
      present: data.present,
      absent: data.absent,
      rate: data.present + data.absent > 0 ? Number((data.present / (data.present + data.absent) * 100).toFixed(2)) : 0,
    }));

    return { totalRecords, byStatus, attendanceRate: Number(attendanceRate.toFixed(2)), byStudent, byDate };
  }
}
