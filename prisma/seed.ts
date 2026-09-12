import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDNI(): string {
  const p1 = String(randInt(1, 999)).padStart(3, '0');
  const p2 = String(randInt(1, 9999999)).padStart(7, '0');
  const p3 = randInt(1, 9);
  return `${p1}-${p2}-${p3}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function cleanDatabase() {
  await prisma.$transaction([
    prisma.evidenceFile.deleteMany(),
    prisma.evidence.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.planningSession.deleteMany(),
    prisma.planning.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.intervention.deleteMany(),
    prisma.counselingNote.deleteMany(),
    prisma.counselingCase.deleteMany(),
    prisma.riskAlert.deleteMany(),
    prisma.studentCourse.deleteMany(),
    prisma.courseSubject.deleteMany(),
    prisma.schedule.deleteMany(),
    prisma.teacherAssignment.deleteMany(),
    prisma.course.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.counselor.deleteMany(),
    prisma.student.deleteMany(),
    prisma.role.deleteMany(),
    prisma.user.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.gradeLevel.deleteMany(),
    prisma.academicPeriod.deleteMany(),
    prisma.schoolYear.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.schoolEvent.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);
}

async function main() {
  console.log('Seeding SIGRADE database...');

  await cleanDatabase();
  console.log('Cleaned existing data.');

  // ================================================================
  // 1. TENANTS (MINERD hierarchy)
  // ================================================================
  console.log('Creating tenants...');

  const minerd = await prisma.tenant.create({
    data: { code: 'MINERD', name: 'Ministerio de Educación de RD', type: 'SYSTEM', settings: {} },
  });

  const reg10 = await prisma.tenant.create({
    data: { code: 'REG-10', name: 'Regional 10 - Santo Domingo', type: 'REGIONAL', parentId: minerd.id, settings: {} },
  });
  const reg15 = await prisma.tenant.create({
    data: { code: 'REG-15', name: 'Regional 15 - Santo Domingo Oeste', type: 'REGIONAL', parentId: minerd.id, settings: {} },
  });

  const districtData = [
    { code: 'DIST-10-01', name: 'Distrito 10-01', parent: reg10 },
    { code: 'DIST-10-02', name: 'Distrito 10-02', parent: reg10 },
    { code: 'DIST-10-03', name: 'Distrito 10-03', parent: reg10 },
    { code: 'DIST-15-01', name: 'Distrito 15-01', parent: reg15 },
    { code: 'DIST-15-02', name: 'Distrito 15-02', parent: reg15 },
    { code: 'DIST-15-03', name: 'Distrito 15-03', parent: reg15 },
  ];

  const districts: any[] = [];
  for (const d of districtData) {
    const tenant = await prisma.tenant.create({
      data: { code: d.code, name: d.name, type: 'DISTRICT', parentId: d.parent.id, settings: {} },
    });
    districts.push(tenant);
  }

  const schoolDefinitions = [
    { code: 'SCH-10-01-01', name: 'Escuela Básica Juan Pablo Duarte', district: districts[0] },
    { code: 'SCH-10-01-02', name: 'Liceo Secundario Prof. Juan Bosch', district: districts[0] },
    { code: 'SCH-10-02-01', name: 'Escuela Básica República de Haití', district: districts[1] },
    { code: 'SCH-10-02-02', name: 'Liceo Secundario Estados Unidos', district: districts[1] },
    { code: 'SCH-10-03-01', name: 'Escuela Básica María Trinidad Sánchez', district: districts[2] },
    { code: 'SCH-10-03-02', name: 'Liceo Secundario Ercilia Pepín', district: districts[2] },
    { code: 'SCH-15-01-01', name: 'Escuela Básica Ramón Emilio Jiménez', district: districts[3] },
    { code: 'SCH-15-01-02', name: 'Liceo Secundario Eugenio de Jesús Marcano', district: districts[3] },
    { code: 'SCH-15-02-01', name: 'Escuela Básica José María Serra', district: districts[4] },
    { code: 'SCH-15-02-02', name: 'Liceo Secundario Mauricio Báez', district: districts[4] },
    { code: 'SCH-15-03-01', name: 'Escuela Básica Pedro Henríquez Ureña', district: districts[5] },
    { code: 'SCH-15-03-02', name: 'Liceo Secundario Salomé Ureña', district: districts[5] },
  ];

  const schools: any[] = [];
  for (const s of schoolDefinitions) {
    const tenant = await prisma.tenant.create({
      data: { code: s.code, name: s.name, type: 'SCHOOL', parentId: s.district.id, settings: {} },
    });
    schools.push(tenant);
  }

  const firstSchool = schools[0];
  const secondSchool = schools[1];
  const thirdSchool = schools[2];

  console.log(`  Created ${1 + 2 + 6 + 12} tenants.`);

  // ================================================================
  // 2. SCHOOL YEARS
  // ================================================================
  console.log('Creating school years...');

  const schoolYear2425 = await prisma.schoolYear.create({
    data: {
      name: '2024-2025',
      startDate: new Date('2024-08-19'),
      endDate: new Date('2025-06-27'),
      isActive: false,
      tenantId: firstSchool.id,
    },
  });

  const schoolYear2526 = await prisma.schoolYear.create({
    data: {
      name: '2025-2026',
      startDate: new Date('2025-08-18'),
      endDate: new Date('2026-06-26'),
      isActive: true,
      tenantId: firstSchool.id,
    },
  });

  console.log('  Created 2 school years.');

  // ================================================================
  // 3. ACADEMIC PERIODS (for 2025-2026)
  // ================================================================
  console.log('Creating academic periods...');

  const p1 = await prisma.academicPeriod.create({
    data: {
      name: 'Primer Periodo',
      code: 'P1-2025-2026',
      ordinal: 1,
      startDate: new Date('2025-08-18'),
      endDate: new Date('2025-10-31'),
      schoolYearId: schoolYear2526.id,
      isActive: true,
      order: 1,
    },
  });

  const p2 = await prisma.academicPeriod.create({
    data: {
      name: 'Segundo Periodo',
      code: 'P2-2025-2026',
      ordinal: 2,
      startDate: new Date('2025-11-03'),
      endDate: new Date('2026-02-27'),
      schoolYearId: schoolYear2526.id,
      isActive: false,
      order: 2,
    },
  });

  const p3 = await prisma.academicPeriod.create({
    data: {
      name: 'Tercer Periodo',
      code: 'P3-2025-2026',
      ordinal: 3,
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-06-26'),
      schoolYearId: schoolYear2526.id,
      isActive: false,
      order: 3,
    },
  });

  console.log('  Created 3 academic periods.');

  // ================================================================
  // 4. GRADE LEVELS
  // ================================================================
  console.log('Creating grade levels...');

  const gradeLevelsData = [
    { name: '1er Grado', ordinal: 1, level: 'PRIMARIA' as const },
    { name: '2do Grado', ordinal: 2, level: 'PRIMARIA' as const },
    { name: '3er Grado', ordinal: 3, level: 'PRIMARIA' as const },
    { name: '4to Grado', ordinal: 4, level: 'PRIMARIA' as const },
    { name: '5to Grado', ordinal: 5, level: 'PRIMARIA' as const },
    { name: '6to Grado', ordinal: 6, level: 'PRIMARIA' as const },
    { name: '1ro Secundaria', ordinal: 7, level: 'SECUNDARIA' as const },
    { name: '2do Secundaria', ordinal: 8, level: 'SECUNDARIA' as const },
    { name: '3ro Secundaria', ordinal: 9, level: 'SECUNDARIA' as const },
  ];

  const gradeLevels: any[] = [];
  for (const gl of gradeLevelsData) {
    const grade = await prisma.gradeLevel.create({
      data: { name: gl.name, ordinal: gl.ordinal, educationLevel: gl.level, tenantId: firstSchool.id },
    });
    gradeLevels.push(grade);
  }

  console.log(`  Created ${gradeLevels.length} grade levels.`);

  // ================================================================
  // 5. SUBJECTS
  // ================================================================
  console.log('Creating subjects...');

  const subjectsData = [
    { code: 'MAT-01', name: 'Matemáticas', area: 'MATEMATICAS' as const },
    { code: 'LEN-01', name: 'Lengua Española', area: 'LENGUA_ESPAÑOLA' as const },
    { code: 'CN-01', name: 'Ciencias Naturales', area: 'CIENCIAS_NATURALES' as const },
    { code: 'CS-01', name: 'Ciencias Sociales', area: 'CIENCIAS_SOCIALES' as const },
    { code: 'ING-01', name: 'Inglés', area: 'INGLES' as const },
    { code: 'EF-01', name: 'Educación Física', area: 'EDUCACION_FISICA' as const },
    { code: 'FH-01', name: 'Formación Humana', area: 'FORMACION_INTEGRAL_HUMANA_RELIGIOSA' as const },
  ];

  const subjects: any[] = [];
  for (const subj of subjectsData) {
    const subject = await prisma.subject.create({
      data: {
        code: subj.code,
        name: subj.name,
        educationLevel: 'PRIMARIA',
        area: subj.area,
        tenantId: firstSchool.id,
      },
    });
    subjects.push(subject);
  }

  console.log(`  Created ${subjects.length} subjects.`);

  // ================================================================
  // 6. USERS
  // ================================================================
  console.log('Creating users...');

  const passwords = {
    admin: await hashPassword('Admin123!'),
    regional: await hashPassword('Regional123!'),
    district: await hashPassword('District123!'),
    director: await hashPassword('Director123!'),
    vicedirector: await hashPassword('Vice123!'),
    coordinator: await hashPassword('Coord123!'),
    counselor: await hashPassword('Counselor123!'),
    teacher: await hashPassword('Teacher123!'),
    student: await hashPassword('Student123!'),
    parent: await hashPassword('Parent123!'),
    directorE2E: await hashPassword('Admin123!'),
    docenteE2E: await hashPassword('Docente123!'),
  };

  const usersData = [
    { email: 'admin@sigrade.gob.do', pwd: passwords.admin, firstName: 'Carlos', lastName: 'Mendoza', dni: '001-0000001-1', tenant: minerd, roles: ['SUPER_ADMIN' as const] },
    { email: 'regional@sigrade.gob.do', pwd: passwords.regional, firstName: 'María', lastName: 'Peña', dni: '001-0000002-2', tenant: reg10, roles: ['REGIONAL_DIRECTOR' as const] },
    { email: 'district@sigrade.gob.do', pwd: passwords.district, firstName: 'Juan', lastName: 'Ramírez', dni: '001-0000003-3', tenant: districts[0], roles: ['DISTRICT_DIRECTOR' as const] },
    { email: 'director@sigrade.gob.do', pwd: passwords.director, firstName: 'Ana', lastName: 'Castillo', dni: '001-0000004-4', tenant: firstSchool, roles: ['SCHOOL_DIRECTOR' as const] },
    { email: 'vicedirector@sigrade.gob.do', pwd: passwords.vicedirector, firstName: 'Roberto', lastName: 'Santos', dni: '001-0000005-5', tenant: firstSchool, roles: ['VICE_DIRECTOR' as const] },
    { email: 'coordinator@sigrade.gob.do', pwd: passwords.coordinator, firstName: 'Diana', lastName: 'Fernández', dni: '001-0000006-6', tenant: firstSchool, roles: ['COORDINATOR' as const] },
    { email: 'counselor@sigrade.gob.do', pwd: passwords.counselor, firstName: 'Laura', lastName: 'Vargas', dni: '001-0000007-7', tenant: firstSchool, roles: ['COUNSELOR' as const] },
    { email: 'teacher1@sigrade.gob.do', pwd: passwords.teacher, firstName: 'Pedro', lastName: 'Jiménez', dni: '001-0000008-8', tenant: firstSchool, roles: ['TEACHER' as const] },
    { email: 'teacher2@sigrade.gob.do', pwd: passwords.teacher, firstName: 'Sofía', lastName: 'Martínez', dni: '001-0000009-9', tenant: secondSchool, roles: ['TEACHER' as const] },
    { email: 'teacher3@sigrade.gob.do', pwd: passwords.teacher, firstName: 'Luis', lastName: 'García', dni: '001-0000010-0', tenant: thirdSchool, roles: ['TEACHER' as const] },
    { email: 'student@sigrade.gob.do', pwd: passwords.student, firstName: 'Esteban', lastName: 'Reyes', dni: '001-0000011-1', tenant: firstSchool, roles: ['STUDENT' as const] },
    { email: 'parent@sigrade.gob.do', pwd: passwords.parent, firstName: 'Carmen', lastName: 'Ortiz', dni: '001-0000012-2', tenant: firstSchool, roles: ['PARENT' as const] },
    { email: 'director@escuela.edu.do', pwd: passwords.directorE2E, firstName: 'Carlos', lastName: 'Director', dni: '001-0000013-3', tenant: firstSchool, roles: ['SCHOOL_DIRECTOR' as const] },
    { email: 'docente@escuela.edu.do', pwd: passwords.docenteE2E, firstName: 'Docente', lastName: 'E2E', dni: '001-0000014-4', tenant: firstSchool, roles: ['TEACHER' as const] },
  ];

  const users: any[] = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: u.pwd,
        firstName: u.firstName,
        lastName: u.lastName,
        dni: u.dni,
        phone: `809-${String(randInt(100, 9999)).padStart(4, '0')}`,
        tenantId: u.tenant.id,
      },
    });
    for (const role of u.roles) {
      await prisma.role.create({
        data: { type: role, userId: user.id, tenantId: u.tenant.id },
      });
    }
    users.push(user);
  }

  const [adminUser, regionalUser, districtUser, directorUser, vicedirectorUser, coordinatorUser, counselorUser, teacher1User, teacher2User, teacher3User, studentUser, parentUser] = users;

  console.log(`  Created ${users.length} users with roles.`);

  // ================================================================
  // 7. TEACHERS
  // ================================================================
  console.log('Creating teachers...');

  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacher1User.id,
      employeeCode: `EMP-${String(randInt(1000, 9999))}`,
      degree: 'Licenciatura en Educación Primaria',
      specialization: 'Matemáticas',
      hireDate: new Date('2020-08-15'),
      contractType: 'NOMBRADO',
      tenantId: firstSchool.id,
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacher2User.id,
      employeeCode: `EMP-${String(randInt(1000, 9999))}`,
      degree: 'Licenciatura en Lengua Española',
      specialization: 'Lingüística',
      hireDate: new Date('2021-09-01'),
      contractType: 'CONTRATADO',
      tenantId: secondSchool.id,
    },
  });

  const teacher3 = await prisma.teacher.create({
    data: {
      userId: teacher3User.id,
      employeeCode: `EMP-${String(randInt(1000, 9999))}`,
      degree: 'Licenciatura en Ciencias Naturales',
      specialization: 'Biología',
      hireDate: new Date('2022-01-10'),
      contractType: 'INTERINO',
      tenantId: thirdSchool.id,
    },
  });

  console.log('  Created 3 teachers.');

  // ================================================================
  // 8. COUNSELOR
  // ================================================================
  await prisma.counselor.create({
    data: {
      userId: counselorUser.id,
      employeeCode: `CNS-${String(randInt(1000, 9999))}`,
      specialization: 'Psicología Educativa',
      licenseNumber: `RD-PSC-${String(randInt(1000, 9999))}`,
      tenantId: firstSchool.id,
    },
  });

  // ================================================================
  // 9. COURSES (for first school, 2025-2026)
  // ================================================================
  console.log('Creating courses...');

  const courseDefinitions = [
    { name: '1ro A', gradeIdx: 0 },
    { name: '1ro B', gradeIdx: 0 },
    { name: '2do A', gradeIdx: 1 },
    { name: '2do B', gradeIdx: 1 },
    { name: '3ro A', gradeIdx: 2 },
    { name: '3ro B', gradeIdx: 2 },
    { name: '4to A', gradeIdx: 3 },
    { name: '4to B', gradeIdx: 3 },
    { name: '5to A', gradeIdx: 4 },
    { name: '5to B', gradeIdx: 4 },
    { name: '6to A', gradeIdx: 5 },
    { name: '1ro A', gradeIdx: 6 },
    { name: '2do A', gradeIdx: 7 },
    { name: '3ro A', gradeIdx: 8 },
  ];

  const courses: any[] = [];
  for (const cd of courseDefinitions) {
    const course = await prisma.course.create({
      data: {
        name: cd.name,
        gradeLevelId: gradeLevels[cd.gradeIdx].id,
        schoolYearId: schoolYear2526.id,
        tenantId: firstSchool.id,
      },
    });
    courses.push(course);
  }

  console.log(`  Created ${courses.length} courses.`);

  // ================================================================
  // 10. COURSE SUBJECTS (assign subjects to courses with teacher)
  // ================================================================
  console.log('Creating course-subject assignments...');

  const allTeachers = [teacher1, teacher2, teacher3];
  const courseSubjects: any[] = [];
  let csIndex = 0;

  for (const course of courses) {
    for (const subject of subjects) {
      const teacher = allTeachers[csIndex % allTeachers.length];
      const cs = await prisma.courseSubject.create({
        data: {
          courseId: course.id,
          subjectId: subject.id,
          teacherId: teacher.id,
          hoursWeekly: randInt(2, 5),
        },
      });
      courseSubjects.push(cs);
      csIndex++;
    }
  }

  console.log(`  Created ${courseSubjects.length} course-subject assignments.`);

  // ================================================================
  // 11. STUDENTS
  // ================================================================
  console.log('Creating students...');

  const studentsData = [
    { first: 'Carlos Alberto', last: 'Martínez Reyes', gender: 'M' as const },
    { first: 'María Fernanda', last: 'Rodríguez Pérez', gender: 'F' as const },
    { first: 'José Daniel', last: 'Hernández Castillo', gender: 'M' as const },
    { first: 'Ana Lucía', last: 'García Santos', gender: 'F' as const },
    { first: 'Luis Miguel', last: 'Torres Jiménez', gender: 'M' as const },
    { first: 'Laura Patricia', last: 'Fernández Vargas', gender: 'F' as const },
    { first: 'Andrés Felipe', last: 'Ramírez Díaz', gender: 'M' as const },
    { first: 'Sofía Isabel', last: 'López Morillo', gender: 'F' as const },
    { first: 'Diego Alejandro', last: 'Cruz Méndez', gender: 'M' as const },
    { first: 'Valentina María', last: 'Sánchez Ovalle', gender: 'F' as const },
    { first: 'Samuel Eduardo', last: 'Peña Rojas', gender: 'M' as const },
    { first: 'Gabriela Cristina', last: 'Flores Medina', gender: 'F' as const },
    { first: 'Ricardo Antonio', last: 'Castillo Vargas', gender: 'M' as const },
    { first: 'Camila Andrea', last: 'Reyes Herrera', gender: 'F' as const },
    { first: 'Fernando José', last: 'Ortiz Núñez', gender: 'M' as const },
    { first: 'Daniela Carolina', last: 'Vargas Soto', gender: 'F' as const },
    { first: 'Mario Alberto', last: 'Mendoza Guerrero', gender: 'M' as const },
    { first: 'Paula Alejandra', last: 'Guerrero Paredes', gender: 'F' as const },
    { first: 'Hugo Ernesto', last: 'Delgado Soriano', gender: 'M' as const },
    { first: 'Isabel Cristina', last: 'Castro Vargas', gender: 'F' as const },
    { first: 'Emilio Jesús', last: 'Rivas Cabrera', gender: 'M' as const },
    { first: 'Adriana Beatriz', last: 'Núñez Espinal', gender: 'F' as const },
    { first: 'Tomás David', last: 'Guzmán Ortega', gender: 'M' as const },
    { first: 'Sara Elena', last: 'Peña Figueroa', gender: 'F' as const },
  ];

  const students: any[] = [];
  for (let i = 0; i < studentsData.length; i++) {
    const sd = studentsData[i];
    const student = await prisma.student.create({
      data: {
        userId: i === 0 ? studentUser.id : undefined,
        studentCode: `STU-${String(i + 1).padStart(4, '0')}`,
        firstName: sd.first,
        lastName: sd.last,
        birthDate: new Date(randInt(2008, 2015), randInt(0, 11), randInt(1, 28)),
        gender: sd.gender,
        address: `Calle ${pick(['Duarte', 'Mella', 'Luperón', 'Colón', 'Bolívar'])} #${randInt(1, 200)}, ${pick(['Zona Colonial', 'Los Prados', 'Ensanche Ozama', 'Villa Consuelo', 'Arroyo Hondo'])}`,
        phone: `809-${String(randInt(100, 9999)).padStart(4, '0')}`,
        emergencyContact: JSON.stringify({
          name: `${pick(['Juan', 'María', 'Pedro', 'Ana', 'José'])} ${pick(['Martínez', 'Rodríguez', 'Hernández', 'García', 'López'])}`,
          phone: `809-${String(randInt(100, 9999)).padStart(4, '0')}`,
          relationship: pick(['Padre', 'Madre', 'Tutor', 'Abuelo']),
        }),
        medicalInfo: pick([null, null, null, 'Asma leve', 'Alergia al polvo', 'Diabetes tipo 1']),
        tenantId: firstSchool.id,
      },
    });
    students.push(student);
  }

  console.log(`  Created ${students.length} students.`);

  // ================================================================
  // 12. ENROLLMENTS (StudentCourse)
  // ================================================================
  console.log('Creating enrollments...');

  const courseSections = [
    { courseIdx: 0, studentRange: [0, 3] },
    { courseIdx: 1, studentRange: [4, 6] },
    { courseIdx: 2, studentRange: [7, 9] },
    { courseIdx: 3, studentRange: [10, 12] },
    { courseIdx: 4, studentRange: [13, 15] },
    { courseIdx: 5, studentRange: [16, 17] },
    { courseIdx: 6, studentRange: [18, 19] },
    { courseIdx: 7, studentRange: [20, 21] },
    { courseIdx: 8, studentRange: [22, 23] },
  ];

  const enrollments: any[] = [];
  for (const sec of courseSections) {
    for (let i = sec.studentRange[0]; i <= sec.studentRange[1]; i++) {
      const enrollment = await prisma.studentCourse.create({
        data: {
          studentId: students[i].id,
          courseId: courses[sec.courseIdx].id,
          schoolYearId: schoolYear2526.id,
          status: 'ACTIVE',
        },
      });
      enrollments.push(enrollment);
    }
  }

  console.log(`  Created ${enrollments.length} enrollments.`);

  // ================================================================
  // 13. ACTIVITIES
  // ================================================================
  console.log('Creating activities...');

  const activitiesData = [
    { name: 'Tarea: Sumas y restas', desc: 'Resolver 20 ejercicios de sumas y restas', type: 'HOMEWORK' as const, maxScore: 100, weight: 1, csIdx: 0, dueOffset: 7 },
    { name: 'Quiz: Verbos', desc: 'Evaluación de conjugación de verbos regulares', type: 'QUIZ' as const, maxScore: 50, weight: 0.5, csIdx: 1, dueOffset: 5 },
    { name: 'Examen Parcial 1', desc: 'Examen parcial de ciencias naturales', type: 'EXAM' as const, maxScore: 100, weight: 2, csIdx: 2, dueOffset: 14 },
    { name: 'Proyecto: Mapa de RD', desc: 'Crear un mapa físico de RD con regiones', type: 'PROJECT' as const, maxScore: 100, weight: 1.5, csIdx: 3, dueOffset: 21 },
  ];

  const activities: any[] = [];
  for (const ad of activitiesData) {
    const activity = await prisma.activity.create({
      data: {
        name: ad.name,
        description: ad.desc,
        type: ad.type,
        maxScore: ad.maxScore,
        weight: ad.weight,
        courseSubjectId: courseSubjects[ad.csIdx].id,
        periodId: p1.id,
        teacherId: courseSubjects[ad.csIdx].teacherId,
        dueDate: new Date(Date.now() + ad.dueOffset * 24 * 60 * 60 * 1000),
        instructions: `Realizar según las indicaciones en clase.`,
        isPublished: true,
      },
    });
    activities.push(activity);
  }

  console.log(`  Created ${activities.length} activities.`);

  // ================================================================
  // 14. GRADES
  // ================================================================
  console.log('Creating grades...');

  let gradeCount = 0;

  for (const enrollment of enrollments) {
    const studentCourseSubjects = courseSubjects.filter(cs => cs.courseId === enrollment.courseId);
    for (const cs of studentCourseSubjects) {
      const score = randInt(60, 100);
      const gradeType = pick(['EXAM', 'HOMEWORK', 'QUIZ', 'PROJECT', 'PARTICIPATION'] as const);
      await prisma.grade.create({
        data: {
          studentId: enrollment.studentId,
          courseSubjectId: cs.id,
          periodId: p1.id,
          type: gradeType,
          name: `${gradeType === 'EXAM' ? 'Examen' : gradeType === 'HOMEWORK' ? 'Tarea' : gradeType === 'QUIZ' ? 'Quiz' : gradeType === 'PROJECT' ? 'Proyecto' : 'Participación'} - P1`,
          maxScore: 100,
          score,
          weight: gradeType === 'EXAM' ? 2 : gradeType === 'PROJECT' ? 1.5 : 1,
          gradedById: directorUser.id,
        },
      });
      gradeCount++;
    }
  }

  console.log(`  Created ${gradeCount} grades.`);

  // ================================================================
  // 15. EVIDENCE
  // ================================================================
  console.log('Creating evidence records...');

  const evidenceTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'];
  let evidenceCount = 0;

  for (let i = 0; i < Math.min(activities.length, 3); i++) {
    const activity = activities[i];
    const activityStudents = students.slice(0, 5);

    for (const student of activityStudents) {
      await prisma.evidence.create({
        data: {
          activityId: activity.id,
          studentId: student.id,
          fileName: `evidencia_${student.lastName.toLowerCase()}_${activity.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          fileSize: randInt(100000, 5000000),
          mimeType: pick(evidenceTypes),
          url: `https://storage.sigrade.gob.do/evidences/${activity.id}/${student.id}_${Date.now()}.pdf`,
          description: `Evidencia de ${activity.name} presentada por ${student.firstName} ${student.lastName}`,
        },
      });
      evidenceCount++;
    }
  }

  console.log(`  Created ${evidenceCount} evidence records.`);

  // ================================================================
  // 16. ATTENDANCE
  // ================================================================
  console.log('Creating attendance records...');

  const attendanceStatuses = ['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED'] as const;
  let attendanceCount = 0;

  for (const enrollment of enrollments.slice(0, 10)) {
    const studentCourseSubjects = courseSubjects.filter(cs => cs.courseId === enrollment.courseId);
    for (const cs of studentCourseSubjects.slice(0, 3)) {
      for (let day = 0; day < 10; day++) {
        const date = new Date('2025-09-01');
        date.setDate(date.getDate() + day);
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const status = Math.random() < 0.7 ? 'PRESENT' : pick(attendanceStatuses);
        await prisma.attendance.create({
          data: {
            studentId: enrollment.studentId,
            courseSubjectId: cs.id,
            date,
            status,
            recordedById: directorUser.id,
          },
        });
        attendanceCount++;
      }
    }
  }

  console.log(`  Created ${attendanceCount} attendance records.`);

  // ================================================================
  // 17. RISK ALERTS
  // ================================================================
  console.log('Creating risk alerts...');

  const riskTypes = ['ACADEMIC_FAILURE', 'CHRONIC_ABSENCE', 'BEHAVIORAL', 'SOCIOEMOTIONAL', 'DROPOUT_RISK', 'LEARNING_DIFFICULTY'] as const;
  const riskSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
  const alertStatuses = ['PENDING', 'IN_REVIEW', 'INTERVENTION', 'RESOLVED', 'DISMISSED'] as const;

  const riskAlerts = [
    { studentIdx: 2, type: 'ACADEMIC_FAILURE' as const, severity: 'HIGH' as const, title: 'Bajo rendimiento en Matemáticas', desc: 'Calificaciones por debajo de 60 en los últimos 3 exámenes' },
    { studentIdx: 5, type: 'CHRONIC_ABSENCE' as const, severity: 'MEDIUM' as const, title: 'Inasistencias frecuentes', desc: 'Ha faltado a 12 clases en el último mes sin justificación' },
    { studentIdx: 8, type: 'BEHAVIORAL' as const, severity: 'LOW' as const, title: 'Problemas de conducta en aula', desc: 'Reportes de interrupciones constantes durante la clase' },
    { studentIdx: 12, type: 'SOCIOEMOTIONAL' as const, severity: 'MEDIUM' as const, title: 'Cambios de ánimo repentinos', desc: 'El estudiante muestra signos de ansiedad y aislamiento social' },
    { studentIdx: 16, type: 'LEARNING_DIFFICULTY' as const, severity: 'CRITICAL' as const, title: 'Dificultad severa de aprendizaje', desc: 'No ha alcanzado competencias básicas de lectoescritura' },
    { studentIdx: 20, type: 'DROPOUT_RISK' as const, severity: 'HIGH' as const, title: 'Riesgo de deserción', desc: 'Factores socioeconómicos que afectan la asistencia regular' },
  ];

  for (const ra of riskAlerts) {
    await prisma.riskAlert.create({
      data: {
        studentId: students[ra.studentIdx].id,
        type: ra.type,
        severity: ra.severity,
        title: ra.title,
        description: ra.desc,
        indicators: JSON.stringify({
          attendanceRate: randInt(30, 80),
          averageGrade: randInt(40, 70),
          behavioralReports: randInt(0, 5),
        }),
        aiGenerated: Math.random() > 0.5,
        status: pick(alertStatuses),
        assignedToId: counselorUser.id,
      },
    });
  }

  console.log(`  Created ${riskAlerts.length} risk alerts.`);

  // ================================================================
  // 18. COUNSELING CASES
  // ================================================================
  console.log('Creating counseling cases...');

  const counselingTypes = ['ACADEMIC_SUPPORT', 'BEHAVIORAL', 'FAMILY', 'PSYCHOLOGICAL', 'CAREER_GUIDANCE', 'CRISIS'] as const;
  const caseStatuses = ['OPEN', 'IN_PROGRESS', 'REFERRED', 'CLOSED'] as const;

  const case1 = await prisma.counselingCase.create({
    data: {
      studentId: students[2].id,
      counselorId: counselorUser.id,
      type: 'ACADEMIC_SUPPORT',
      status: 'IN_PROGRESS',
    },
  });

  await prisma.counselingNote.create({
    data: {
      caseId: case1.id,
      authorId: counselorUser.id,
      content: 'Primera sesión de orientación académica. El estudiante muestra interés en mejorar sus calificaciones. Se acordó un plan de estudio con apoyo en Matemáticas.',
      isPrivate: false,
    },
  });

  const case2 = await prisma.counselingCase.create({
    data: {
      studentId: students[5].id,
      counselorId: counselorUser.id,
      type: 'FAMILY',
      status: 'OPEN',
    },
  });

  await prisma.counselingNote.create({
    data: {
      caseId: case2.id,
      authorId: counselorUser.id,
      content: 'Se contactó a los padres. Situación familiar complicada. Se derivará a trabajo social.',
      isPrivate: true,
    },
  });

  const case3 = await prisma.counselingCase.create({
    data: {
      studentId: students[12].id,
      counselorId: counselorUser.id,
      type: 'PSYCHOLOGICAL',
      status: 'OPEN',
    },
  });

  await prisma.intervention.create({
    data: {
      caseId: case3.id,
      type: 'Terapia individual',
      description: 'Sesiones semanales de terapia con enfoque cognitivo-conductual',
      startDate: new Date('2025-09-15'),
      endDate: new Date('2025-12-15'),
      responsibleId: counselorUser.id,
      outcome: 'En progreso',
    },
  });

  console.log('  Created 3 counseling cases with notes and interventions.');

  // ================================================================
  // 19. PLANNING RECORDS
  // ================================================================
  console.log('Creating planning records...');

  const planning = await prisma.planning.create({
    data: {
      teacherId: teacher1.id,
      courseSubjectId: courseSubjects[0].id,
      periodId: p1.id,
      unitNumber: 1,
      unitTitle: 'Números Naturales y Operaciones Básicas',
      competencies: ['Reconoce y aplica propiedades de números naturales', 'Resuelve problemas con operaciones básicas'],
      objectives: ['Identificar números naturales hasta 1,000', 'Realizar sumas y restas con llevadas'],
      content: 'Tema 1: Numeración hasta 1,000\nTema 2: Suma con llevadas\nTema 3: Resta con préstamos',
      methodology: 'Aprendizaje basado en problemas, trabajo en grupos cooperativos',
      resources: ['Libro de texto', 'Bloques multibase', 'Fichas de trabajo', 'Ábaco'],
      assessment: 'Evaluación formativa continua, prueba escrita al final de la unidad',
      startDate: new Date('2025-08-18'),
      endDate: new Date('2025-09-19'),
      status: 'APPROVED',
    },
  });

  for (let session = 1; session <= 4; session++) {
    await prisma.planningSession.create({
      data: {
        planningId: planning.id,
        sessionNumber: session,
        date: new Date(new Date('2025-08-18').getTime() + (session - 1) * 7 * 86400000),
        topic: `Sesión ${session}: ${['Introducción a números', 'Suma con llevadas', 'Resta con préstamos', 'Evaluación'][session - 1]}`,
        activities: JSON.stringify([
          { name: 'Activación de conocimientos previos', duration: 15 },
          { name: 'Desarrollo del tema', duration: 30 },
          { name: 'Práctica guiada', duration: 20 },
          { name: 'Cierre y tarea', duration: 10 },
        ]),
        homework: session < 4 ? 'Completar ejercicios de la página 15-18' : null,
        resources: ['Pizarra', 'Fichas', 'Libro'],
        executed: session <= 3,
        executedAt: session <= 3 ? new Date(new Date('2025-08-18').getTime() + (session - 1) * 7 * 86400000 + 14 * 3600000) : null,
        observations: session <= 3 ? 'Los estudiantes participaron activamente' : null,
      },
    });
  }

  console.log('  Created 1 planning record with 4 sessions.');

  // ================================================================
  // 20. SCHOOL EVENTS
  // ================================================================
  console.log('Creating school events...');

  const eventsData = [
    { title: 'Inicio del Año Escolar 2025-2026', type: 'ACTIVITY' as const, date: new Date('2025-08-18'), description: 'Ceremonia de bienvenida y presentación de docentes' },
    { title: 'Reunión de Padres - Primer Periodo', type: 'MEETING' as const, date: new Date('2025-09-15'), description: 'Reunión informativa sobre avances del primer periodo' },
    { title: 'Día de la Independencia Nacional', type: 'HOLIDAY' as const, date: new Date('2026-02-27'), description: 'Feriado nacional' },
    { title: 'Entrega de Boletines - P1', type: 'DEADLINE' as const, date: new Date('2025-11-03'), description: 'Fecha límite para entrega de calificaciones del primer periodo' },
    { title: 'Evaluación Diagnóstica Nacional', type: 'EVALUATION' as const, date: new Date('2025-10-06'), description: 'Prueba nacional de diagnóstico para 3er grado' },
  ];

  for (const ev of eventsData) {
    await prisma.schoolEvent.create({
      data: {
        tenantId: firstSchool.id,
        title: ev.title,
        type: ev.type,
        date: ev.date,
        time: '08:00',
        description: ev.description,
        createdById: directorUser.id,
      },
    });
  }

  console.log(`  Created ${eventsData.length} school events.`);

  // ================================================================
  // 21. NOTIFICATIONS
  // ================================================================
  console.log('Creating notifications...');

  const notificationsData = [
    { userId: teacher1User.id, type: 'INFO' as const, title: 'Planificación Aprobada', desc: 'Tu planificación de Números Naturales ha sido aprobada.' },
    { userId: teacher1User.id, type: 'WARNING' as const, title: 'Recordatorio de Calificaciones', desc: 'Debes ingresar las calificaciones del examen parcial antes del viernes.' },
    { userId: directorUser.id, type: 'SUCCESS' as const, title: 'Inicio de Año Completo', desc: 'Todos los docentes han completado sus planificaciones iniciales.' },
    { userId: directorUser.id, type: 'DANGER' as const, title: 'Alerta de Asistencia', desc: '3 estudiantes superan el 15% de inasistencias.' },
    { userId: counselorUser.id, type: 'INFO' as const, title: 'Nuevo Caso Asignado', desc: 'Se ha asignado un nuevo caso de orientación académica.' },
  ];

  for (const notif of notificationsData) {
    await prisma.notification.create({
      data: {
        tenantId: firstSchool.id,
        userId: notif.userId,
        type: notif.type,
        title: notif.title,
        description: notif.desc,
      },
    });
  }

  console.log(`  Created ${notificationsData.length} notifications.`);

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log('\n========================================');
  console.log('  SEED COMPLETED SUCCESSFULLY');
  console.log('========================================');
  console.log('  Seeded Data Summary:');
  console.log(`  Tenants:              ${1 + 2 + 6 + 12}`);
  console.log(`  School Years:         2`);
  console.log(`  Academic Periods:     3`);
  console.log(`  Grade Levels:         ${gradeLevels.length}`);
  console.log(`  Subjects:             ${subjects.length}`);
  console.log(`  Courses:              ${courses.length}`);
  console.log(`  Course-Subjects:      ${courseSubjects.length}`);
  console.log(`  Users:                ${users.length}`);
  console.log(`  Teachers:             3`);
  console.log(`  Students:             ${students.length}`);
  console.log(`  Enrollments:          ${enrollments.length}`);
  console.log(`  Grades:               ${gradeCount}`);
  console.log(`  Activities:           ${activities.length}`);
  console.log(`  Evidence Records:     ${evidenceCount}`);
  console.log(`  Attendance Records:   ${attendanceCount}`);
  console.log(`  Risk Alerts:          ${riskAlerts.length}`);
  console.log(`  Counseling Cases:     3`);
  console.log(`  Plannings:            1 (with 4 sessions)`);
  console.log(`  School Events:        ${eventsData.length}`);
  console.log(`  Notifications:        ${notificationsData.length}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
