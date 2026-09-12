import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Award, Calendar, 
  BookOpen, ClipboardList, BarChart3, LogOut, 
  Menu, X, GraduationCap, Heart, User, Globe, Building2,
  Brain, Download, QrCode, CalendarDays, FolderOpen, Settings,
  AlertTriangle, CaseSensitive, School, MapPin
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { PeriodSelector } from '../period/PeriodSelector';
import { NotificationsDropdown } from '../notifications/NotificationsDropdown';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const R = {
  admin: ['SUPER_ADMIN', 'MINERD_ANALYST'],
  regional: ['REGIONAL_DIRECTOR', 'REGIONAL_TECHNICIAN'],
  district: ['DISTRICT_DIRECTOR', 'DISTRICT_TECHNICIAN'],
  school: ['SCHOOL_DIRECTOR', 'VICE_DIRECTOR', 'COORDINATOR'],
  teacher: ['TEACHER'],
  counselor: ['COUNSELOR', 'PSYCHOLOGIST'],
  student: ['STUDENT'],
  parent: ['PARENT'],
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'General',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['*'] },
    ],
  },
  {
    label: 'Nivel Nacional',
    items: [
      { name: 'Panel Nacional', href: '/dashboard', icon: Globe, roles: R.admin },
      { name: 'Usuarios', href: '/config', icon: User, roles: R.admin },
    ],
  },
  {
    label: 'Nivel Regional',
    items: [
      { name: 'Panel Regional', href: '/dashboard', icon: MapPin, roles: R.regional },
      { name: 'Distritos', href: '/analytics', icon: Building2, roles: R.regional },
      { name: 'Analítica Regional', href: '/analytics', icon: BarChart3, roles: R.regional },
    ],
  },
  {
    label: 'Nivel Distrital',
    items: [
      { name: 'Panel Distrital', href: '/dashboard', icon: Building2, roles: R.district },
      { name: 'Centros', href: '/analytics', icon: School, roles: R.district },
      { name: 'Analítica Distrital', href: '/analytics', icon: BarChart3, roles: R.district },
    ],
  },
  {
    label: 'Gestión del Centro',
    items: [
      { name: 'Panel del Centro', href: '/dashboard', icon: LayoutDashboard, roles: [...R.school, ...R.counselor] },
      { name: 'Estudiantes', href: '/students', icon: Users, roles: [...R.teacher, ...R.school] },
      { name: 'Gestión Estudiantes', href: '/academico/estudiantes', icon: GraduationCap, roles: R.school },
      { name: 'Docentes', href: '/teachers', icon: GraduationCap, roles: R.school },
      { name: 'Calificaciones', href: '/grades', icon: Award, roles: [...R.teacher, ...R.school] },
      { name: 'Asistencia', href: '/attendance', icon: Calendar, roles: [...R.teacher, ...R.school] },
      { name: 'Planificación', href: '/planning', icon: ClipboardList, roles: [...R.teacher, ...R.school] },
      { name: 'Gestión Académica', href: '/academic', icon: BookOpen, roles: R.school },
    ],
  },
  {
    label: 'Orientación',
    items: [
      { name: 'Panel Orientación', href: '/dashboard', icon: Heart, roles: R.counselor },
      { name: 'Alertas de Riesgo', href: '/counseling', icon: AlertTriangle, roles: [...R.counselor, ...R.school] },
      { name: 'Casos', href: '/counseling', icon: CaseSensitive, roles: R.counselor },
    ],
  },
  {
    label: 'Analítica',
    items: [
      { name: 'Analítica', href: '/analytics', icon: BarChart3, roles: [...R.school, ...R.district, ...R.regional, ...R.admin] },
      { name: 'Reportes', href: '/export', icon: Download, roles: [...R.teacher, ...R.school, ...R.admin] },
    ],
  },
  {
    label: 'Estudiante',
    items: [
      { name: 'Mi Panel', href: '/dashboard', icon: LayoutDashboard, roles: [...R.student, ...R.parent] },
      { name: 'Mis Calificaciones', href: '/grades', icon: Award, roles: [...R.student, ...R.parent] },
      { name: 'Mi Asistencia', href: '/attendance', icon: Calendar, roles: [...R.student, ...R.parent] },
      { name: 'Calendario', href: '/calendar', icon: CalendarDays, roles: [...R.student, ...R.parent, ...R.teacher, ...R.school] },
    ],
  },
  {
    label: 'Herramientas',
    items: [
      { name: 'IA Asistente', href: '/ai', icon: Brain, roles: [...R.teacher, ...R.school] },
      { name: 'Asistencia QR', href: '/qr', icon: QrCode, roles: [...R.teacher, ...R.student] },
      { name: 'Archivos', href: '/files', icon: FolderOpen, roles: [...R.teacher, ...R.school] },
      { name: 'Configuración', href: '/config', icon: Settings, roles: [...R.admin, ...R.regional, ...R.district, ...R.school] },
    ],
  },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation = useMemo(() => {
    if (!user) return [];
    const roleTypes = user.roles.map(r => r.type);
    return navGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.roles.includes('*') || item.roles.some(role => roleTypes.includes(role))
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-muted">
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={cn(
          'sidebar',
          sidebarOpen ? 'w-64' : 'sidebar-collapsed',
          mobileMenuOpen && 'z-50 lg:hidden'
        )}
      >
        <div className={cn(
          'flex items-center bg-sidebar-primary text-sidebar-primary-foreground border-b border-sidebar-border',
          sidebarOpen ? 'h-16 justify-between px-4' : 'h-16 justify-center px-2'
        )}>
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-wide text-white">SIGRADE</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              sidebarOpen ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-sidebar-foreground hover:bg-sidebar-accent mx-auto'
            )}
            aria-label={sidebarOpen ? 'Colapsar sidebar' : 'Expandir sidebar'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-3 overflow-y-auto">
          {navigation.map((group) => (
            <div key={group.label}>
              {sidebarOpen && (
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <button
                      key={item.name}
                      onClick={() => { navigate(item.href); setMobileMenuOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-md text-sm font-medium transition-colors',
                        sidebarOpen
                          ? (isActive 
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground px-3 py-2' 
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3 py-2')
                          : 'justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2'
                      )}
                      title={sidebarOpen ? undefined : item.name}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && <span>{item.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={cn(
          'border-t border-sidebar-border p-2',
          !sidebarOpen && 'flex justify-center'
        )}>
          {sidebarOpen ? (
            <div className="px-3 py-2">
              <p className="text-[10px] text-muted-foreground">
                &copy; 2026 SIGRADE
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground text-center">&copy;</p>
          )}
        </div>
      </aside>

      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>

      <main className={cn('min-h-screen transition-all duration-300', sidebarOpen ? 'lg:ml-64' : 'lg:ml-12')}>
        <header className="header">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">
              SIGRADE
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <NotificationsDropdown />
              <PeriodSelector />
              <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md bg-accent/40">
                <div className="avatar avatar-sm">
                  {initials}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-foreground">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0].type : 'Usuario'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
