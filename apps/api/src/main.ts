import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Security headers
  app.use(helmet());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('SIGRADE API')
    .setDescription(
      'Sistema Inteligente de Gestión del Registro Académico Digital\n\n' +
      'API RESTful del sistema de gestión académica del Ministerio de Educación de República Dominicana.\n\n' +
      '### Funcionalidades principales\n' +
      '- Gestión de la jerarquía educativa MINERD (Nacional → Regional → Distrital → Centro)\n' +
      '- Registro y control de estudiantes, docentes y personal administrativo\n' +
      '- Calificaciones con soporte de evidencias (archivos)\n' +
      '- Control de asistencia por asignatura\n' +
      '- Planificación docente y sesiones de clase\n' +
      '- Orientación y psicología con alertas de riesgo y casos\n' +
      '- Analítica educativa y dashboards\n' +
      '- Servicios de IA para asistencia inteligente',
    )
    .setVersion('1.0.0')
    .setContact(
      'Equipo SIGRADE',
      'https://www.minerd.gob.do',
      'soporte@sigrade.edu.do',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer(`http://localhost:${process.env.PORT || 3000}`, 'Servidor de desarrollo local')
    .addServer('https://api.sigrade.edu.do', 'Servidor de producción')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT obtenido de /auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Autenticación', 'Endpoints de autenticación y autorización')
    .addTag('Tenants', 'Gestión de la jerarquía MINERD (Nacional, Regional, Distrital, Centro)')
    .addTag('Académico', 'Años escolares, períodos, grados, cursos, asignaturas, horarios')
    .addTag('Docentes', 'Gestión de docentes y asignaciones')
    .addTag('Estudiantes', 'Gestión de estudiantes y matrículas')
    .addTag('Calificaciones', 'Registro y gestión de calificaciones con evidencias')
    .addTag('Asistencia', 'Control de asistencia por asignatura y hora')
    .addTag('Planificación', 'Planificación docente y sesiones de clase')
    .addTag('Counseling - Orientación y Psicología', 'Alertas de riesgo, casos de orientación y psicología')
    .addTag('Analítica y Dashboards', 'Dashboards e indicadores educativos')
    .addTag('Archivos', 'Gestión de evidencias y documentos')
    .addTag('Auditoría y Trazabilidad', 'Logs de auditoría y trazabilidad')
    .addTag('IA', 'Servicios de Inteligencia Artificial')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'SIGRADE API - Documentación',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.8/swagger-ui.min.css',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
  });

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`🚀 SIGRADE API is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();