import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  title: string;
  description: string;
  time: Date;
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'info', title: 'Nuevo estudiante asignado', description: 'María García ha sido asignada a tu curso de Matemáticas.', time: new Date(Date.now() - 5 * 60 * 1000), read: false },
  { id: '2', type: 'warning', title: 'Planificación pendiente', description: 'Tienes 3 planificaciones por revisar esta semana.', time: new Date(Date.now() - 2 * 60 * 60 * 1000), read: false },
  { id: '3', type: 'success', title: 'Asistencia registrada', description: 'Se registró la asistencia del día de hoy correctamente.', time: new Date(Date.now() - 4 * 60 * 60 * 1000), read: true },
  { id: '4', type: 'danger', title: 'Calificaciones atrasadas', description: 'El período de carga de calificaciones vence en 2 días.', time: new Date(Date.now() - 24 * 60 * 60 * 1000), read: false },
  { id: '5', type: 'info', title: 'Reporte disponible', description: 'El reporte de rendimiento académico mensual ya está listo.', time: new Date(Date.now() - 48 * 60 * 60 * 1000), read: true },
];

const typeIcons: Record<Notification['type'], React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  danger: XCircle,
};

const typeStyles: Record<Notification['type'], string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  success: 'text-green-500',
  danger: 'text-red-500',
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHours < 24) return `hace ${diffHours} horas`;
  if (diffDays === 1) return 'ayer';
  return `hace ${diffDays} días`;
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-card text-card-foreground shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] text-muted-foreground">{unreadCount} sin leer</span>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {mockNotifications.slice(0, 5).map((notif) => {
              const Icon = typeIcons[notif.type];
              return (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50 cursor-pointer',
                    !notif.read && 'bg-primary/5'
                  )}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <Icon className={cn('w-4 h-4', typeStyles[notif.type])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.description}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{formatRelativeTime(notif.time)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            to="/notificaciones"
            className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-primary border-t hover:bg-accent/50 transition-colors rounded-b-xl"
          >
            Ver todas
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
