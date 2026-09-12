-- ============================================================
-- SIGRADE - RLS Policies
-- Execute AFTER `prisma migrate deploy`
-- Usage: psql $DATABASE_URL -f prisma/apply-rls.sql
--
-- Diseño multi-tenant (jerarquía MINERD):
--   El tenant se fija por sesión con el GUC `app.current_tenant_id`
--   (texto con el id del tenant), que la API establece llamando a
--   `set_current_tenant(tenantId)` (ver PrismaService.setTenantContext).
--
-- Nota de hardening para producción:
--   El rol que ejecuta las migraciones (owner de las tablas) BYPASSA
--   RLS por defecto. Para que el aislamiento sea efectivo de verdad,
--   la API debe conectarse con el rol NO-owner `sigrade_app` (aquí se
--   proveen sus permisos) y las tablas deben pasar a `FORCE ROW LEVEL
--   SECURITY`. Antes de activar FORCE hay que adaptar: (1) el seed a
--   fijar tenant por inserción, y (2) las consultas bootstrap del login
--   con funciones SECURITY DEFINER. Ese endurecimiento queda fuera del
--   alcance actual y se conserva como práctica recomendada.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear rol de aplicación (no-owner) si no existe.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sigrade_app') THEN
    CREATE ROLE sigrade_app LOGIN PASSWORD 'sigrade_app_dev';
  END IF;
END
$$;

-- RLS helper functions
-- The GUC is set as TRANSACTION-LOCAL (is_local = true, SET LOCAL semantics):
-- it auto-reverts at commit/rollback, so a connection returned to the pool can
-- never carry a stale tenant context into the next transaction or a background
-- job. Every request still re-sets it explicitly at the start.
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTE: tenant id columns are TEXT (Prisma `String`), so this helper returns
-- text to be comparable in the policies below. The GUC itself is text.
-- The DROP is required: a prior (stale, uuid-returning) version of this
-- function can linger in the DB and `CREATE OR REPLACE` cannot change its
-- return type, which would otherwise break every policy with
-- "operator does not exist: text = uuid".
DROP FUNCTION IF EXISTS current_tenant_id() CASCADE;

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS text AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id');
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE IF EXISTS "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "school_years" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "academic_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "grade_levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "subjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "course_subjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "teachers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "teacher_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "student_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "plannings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "planning_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "grades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "evidences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "evidence_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "attendances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "risk_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "counseling_cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "counseling_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "interventions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "counselors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "school_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "notifications" ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotentes)

DROP POLICY IF EXISTS tenant_isolation ON "tenants";
CREATE POLICY tenant_isolation ON "tenants"
    USING ("id" = current_tenant_id() OR "parentId" = current_tenant_id());

DROP POLICY IF EXISTS user_tenant_isolation ON "users";
CREATE POLICY user_tenant_isolation ON "users"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS role_tenant_isolation ON "roles";
CREATE POLICY role_tenant_isolation ON "roles"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS school_year_tenant_isolation ON "school_years";
CREATE POLICY school_year_tenant_isolation ON "school_years"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS academic_period_tenant_isolation ON "academic_periods";
CREATE POLICY academic_period_tenant_isolation ON "academic_periods"
    USING ("schoolYearId" IN (SELECT "id" FROM "school_years" WHERE "tenantId" = current_tenant_id()));

DROP POLICY IF EXISTS grade_level_tenant_isolation ON "grade_levels";
CREATE POLICY grade_level_tenant_isolation ON "grade_levels"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS course_tenant_isolation ON "courses";
CREATE POLICY course_tenant_isolation ON "courses"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS subject_tenant_isolation ON "subjects";
CREATE POLICY subject_tenant_isolation ON "subjects"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS course_subject_tenant_isolation ON "course_subjects";
CREATE POLICY course_subject_tenant_isolation ON "course_subjects"
    USING ("courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id()));

DROP POLICY IF EXISTS schedule_tenant_isolation ON "schedules";
CREATE POLICY schedule_tenant_isolation ON "schedules"
    USING ("courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id()));

DROP POLICY IF EXISTS teacher_tenant_isolation ON "teachers";
CREATE POLICY teacher_tenant_isolation ON "teachers"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS teacher_assignment_tenant_isolation ON "teacher_assignments";
CREATE POLICY teacher_assignment_tenant_isolation ON "teacher_assignments"
    USING ("schoolYearId" IN (SELECT "id" FROM "school_years" WHERE "tenantId" = current_tenant_id()));

DROP POLICY IF EXISTS student_tenant_isolation ON "students";
CREATE POLICY student_tenant_isolation ON "students"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS student_course_tenant_isolation ON "student_courses";
CREATE POLICY student_course_tenant_isolation ON "student_courses"
    USING ("courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id()));

DROP POLICY IF EXISTS planning_tenant_isolation ON "plannings";
CREATE POLICY planning_tenant_isolation ON "plannings"
    USING ("courseSubjectId" IN (SELECT "id" FROM "course_subjects" WHERE "courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id())));

DROP POLICY IF EXISTS planning_session_tenant_isolation ON "planning_sessions";
CREATE POLICY planning_session_tenant_isolation ON "planning_sessions"
    USING ("planningId" IN (SELECT "id" FROM "plannings" WHERE "courseSubjectId" IN (SELECT "id" FROM "course_subjects" WHERE "courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id()))));

DROP POLICY IF EXISTS grade_tenant_isolation ON "grades";
CREATE POLICY grade_tenant_isolation ON "grades"
    USING ("courseSubjectId" IN (SELECT "id" FROM "course_subjects" WHERE "courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id())));

DROP POLICY IF EXISTS activity_tenant_isolation ON "activities";
CREATE POLICY activity_tenant_isolation ON "activities"
    USING ("courseSubjectId" IN (SELECT "id" FROM "course_subjects" WHERE "courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id())));

DROP POLICY IF EXISTS evidence_tenant_isolation ON "evidences";
CREATE POLICY evidence_tenant_isolation ON "evidences"
    USING ("activityId" IN (SELECT "id" FROM "activities" WHERE "courseSubjectId" IN (SELECT "id" FROM "course_subjects" WHERE "courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id()))));

DROP POLICY IF EXISTS evidence_file_tenant_isolation ON "evidence_files";
CREATE POLICY evidence_file_tenant_isolation ON "evidence_files"
    USING (
        ("gradeId" IN (SELECT "id" FROM "grades" WHERE "courseSubjectId" IN (SELECT "id" FROM "course_subjects" WHERE "courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id()))))
        OR
        ("sessionId" IN (SELECT "id" FROM "planning_sessions" WHERE "planningId" IN (SELECT "id" FROM "plannings" WHERE "courseSubjectId" IN (SELECT "id" FROM "course_subjects" WHERE "courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id())))))
        OR
        ("gradeId" IS NULL AND "sessionId" IS NULL AND "uploadedById" IN (SELECT "id" FROM "users" WHERE "tenantId" = current_tenant_id()))
    );

DROP POLICY IF EXISTS attendance_tenant_isolation ON "attendances";
CREATE POLICY attendance_tenant_isolation ON "attendances"
    USING ("courseSubjectId" IN (SELECT "id" FROM "course_subjects" WHERE "courseId" IN (SELECT "id" FROM "courses" WHERE "tenantId" = current_tenant_id())));

DROP POLICY IF EXISTS risk_alert_tenant_isolation ON "risk_alerts";
CREATE POLICY risk_alert_tenant_isolation ON "risk_alerts"
    USING ("studentId" IN (SELECT "id" FROM "students" WHERE "tenantId" = current_tenant_id()));

DROP POLICY IF EXISTS counseling_case_tenant_isolation ON "counseling_cases";
CREATE POLICY counseling_case_tenant_isolation ON "counseling_cases"
    USING ("studentId" IN (SELECT "id" FROM "students" WHERE "tenantId" = current_tenant_id()));

DROP POLICY IF EXISTS counseling_note_tenant_isolation ON "counseling_notes";
CREATE POLICY counseling_note_tenant_isolation ON "counseling_notes"
    USING ("caseId" IN (SELECT "id" FROM "counseling_cases" WHERE "studentId" IN (SELECT "id" FROM "students" WHERE "tenantId" = current_tenant_id())));

DROP POLICY IF EXISTS intervention_tenant_isolation ON "interventions";
CREATE POLICY intervention_tenant_isolation ON "interventions"
    USING ("caseId" IN (SELECT "id" FROM "counseling_cases" WHERE "studentId" IN (SELECT "id" FROM "students" WHERE "tenantId" = current_tenant_id())));

DROP POLICY IF EXISTS counselor_tenant_isolation ON "counselors";
CREATE POLICY counselor_tenant_isolation ON "counselors"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS audit_log_tenant_isolation ON "audit_logs";
CREATE POLICY audit_log_tenant_isolation ON "audit_logs"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS school_event_tenant_isolation ON "school_events";
CREATE POLICY school_event_tenant_isolation ON "school_events"
    USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS notification_tenant_isolation ON "notifications";
CREATE POLICY notification_tenant_isolation ON "notifications"
    USING ("tenantId" = current_tenant_id());

-- Permisos para el rol de aplicación
GRANT USAGE ON SCHEMA public TO sigrade_app;
GRANT EXECUTE ON FUNCTION set_current_tenant(text) TO sigrade_app;
GRANT EXECUTE ON FUNCTION current_tenant_id() TO sigrade_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sigrade_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sigrade_app;