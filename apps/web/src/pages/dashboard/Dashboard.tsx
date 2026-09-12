import { useAuth } from '../../hooks/useAuth';
import { TeacherDashboard } from './TeacherDashboard';
import { DirectorDashboard } from './DirectorDashboard';
import { CoordinatorDashboard } from './CoordinatorDashboard';
import { DistrictDashboard } from './DistrictDashboard';
import { RegionalDashboard } from './RegionalDashboard';
import { NationalDashboard } from './NationalDashboard';
import { CounselorDashboard } from './CounselorDashboard';
import { StudentDashboard } from './StudentDashboard';

export function Dashboard() {
  const { user } = useAuth();
  const roles = user?.roles?.map(r => r.type) ?? [];

  if (roles.some(r => ['SUPER_ADMIN', 'MINERD_ANALYST'].includes(r))) return <NationalDashboard />;
  if (roles.some(r => ['REGIONAL_DIRECTOR', 'REGIONAL_TECHNICIAN'].includes(r))) return <RegionalDashboard />;
  if (roles.some(r => ['DISTRICT_DIRECTOR', 'DISTRICT_TECHNICIAN'].includes(r))) return <DistrictDashboard />;
  if (roles.some(r => ['SCHOOL_DIRECTOR', 'VICE_DIRECTOR'].includes(r))) return <DirectorDashboard />;
  if (roles.some(r => ['COORDINATOR'].includes(r))) return <CoordinatorDashboard />;
  if (roles.some(r => ['COUNSELOR', 'PSYCHOLOGIST'].includes(r))) return <CounselorDashboard />;
  if (roles.some(r => ['TEACHER'].includes(r))) return <TeacherDashboard />;
  if (roles.some(r => ['STUDENT'].includes(r))) return <StudentDashboard />;
  if (roles.some(r => ['PARENT'].includes(r))) return <StudentDashboard />;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">Bienvenido a SIGRADE</h2>
        <p className="text-muted-foreground mt-2">Seleccione una opción del menú lateral para comenzar.</p>
      </div>
    </div>
  );
}
