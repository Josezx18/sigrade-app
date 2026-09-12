import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';
import { useSchoolEvents, useCreateSchoolEvent, useDeleteSchoolEvent } from '../../hooks/api/useSchoolEvents';
import type { SchoolEvent, EventQuery } from '../../services/schoolEventsApi';

type EventType = 'REUNION' | 'EVALUACION' | 'FESTIVO' | 'ACTIVIDAD' | 'PLAZO';

type CreateEventDTO = {
  title: string;
  type: EventType;
  startDate: string;
  endDate: string;
  description: string;
  time: string;
};

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; badgeVariant: 'info' | 'danger' | 'success' | 'warning' }> = {
  REUNION: { label: 'Reunión', color: 'bg-blue-500', badgeVariant: 'info' },
  EVALUACION: { label: 'Evaluación', color: 'bg-red-500', badgeVariant: 'danger' },
  FESTIVO: { label: 'Festivo', color: 'bg-green-500', badgeVariant: 'success' },
  ACTIVIDAD: { label: 'Actividad', color: 'bg-yellow-500', badgeVariant: 'warning' },
  PLAZO: { label: 'Plazo', color: 'bg-orange-500', badgeVariant: 'warning' },
};

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function SchoolCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CreateEventDTO>>({
    type: 'REUNION',
    startDate: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const query: EventQuery = {
    dateFrom: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    dateTo: `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`,
  };
  const { data: eventsData, isLoading, error } = useSchoolEvents(query);
  const events = useMemo(() => eventsData?.data ?? [], [eventsData]);
  const createEvent = useCreateSchoolEvent();
  const deleteEvent = useDeleteSchoolEvent();

  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; date: string; isCurrentMonth: boolean }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(year, month, -firstDayOfWeek + i + 1);
      days.push({
        day: prevDate.getDate(),
        date: `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: true,
      });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        day: nextDate.getDate(),
        date: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }
    return days;
  }, [year, month, daysInMonth, firstDayOfWeek]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => e.startDate.startsWith(selectedDate));
  }, [events, selectedDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, SchoolEvent[]>();
    events.forEach((e) => {
      const dateKey = e.startDate.split('T')[0];
      const existing = map.get(dateKey) || [];
      existing.push(e);
      map.set(dateKey, existing);
    });
    return map;
  }, [events]);

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.startDate) return;
    createEvent.mutate({
      title: newEvent.title,
      type: newEvent.type || 'REUNION',
      startDate: newEvent.startDate,
      endDate: newEvent.startDate,
      description: newEvent.description,
      allDay: !newEvent.time,
    });
    setShowAddModal(false);
    setNewEvent({ type: 'REUNION', startDate: '' });
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent.mutate(id);
    setShowDeleteConfirm(null);
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-DO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEventType = (type: string): EventType => {
    if (type in EVENT_TYPE_CONFIG) return type as EventType;
    return 'ACTIVIDAD';
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>Error al cargar eventos: {(error as Error).message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario Escolar</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de eventos y fechas importantes</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Agregar Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                  {MONTHS[month]} {year}
                </h2>
                <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((dayInfo) => {
                const dateKey = dayInfo.date;
                const dayEvents = eventsByDate.get(dateKey) || [];
                const isToday = dayInfo.date === todayStr;
                const isSelected = dayInfo.date === selectedDate;

                return (
                  <button
                    key={dayInfo.date}
                    onClick={() => handleDayClick(dayInfo.date)}
                    className={cn(
                      'relative min-h-[90px] p-2 border border-gray-100 text-sm transition-colors text-left',
                      dayInfo.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                      isSelected && 'ring-2 ring-primary-500 ring-inset',
                      'hover:bg-gray-50'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs',
                        isToday && 'bg-primary-600 text-white font-semibold',
                        !isToday && dayInfo.isCurrentMonth && 'text-gray-900',
                        !isToday && !dayInfo.isCurrentMonth && 'text-gray-400'
                      )}
                    >
                      {dayInfo.day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            'w-2 h-2 rounded-full mx-0.5 inline-block',
                            EVENT_TYPE_CONFIG[getEventType(event.type)].color
                          )}
                          title={event.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-gray-500">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="mt-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Leyenda</h3>
              <div className="flex flex-wrap gap-4">
                {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', config.color)} />
                    <span className="text-xs text-gray-600">{config.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="xl:col-span-1">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {selectedDate ? (
                <span className="capitalize">{formatDateDisplay(selectedDate)}</span>
              ) : (
                'Selecciona un día'
              )}
            </h3>
            {selectedDate && (
              <div className="space-y-3">
                {selectedDateEvents.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay eventos este día</p>
                ) : (
                  selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2.5 h-2.5 rounded-full', EVENT_TYPE_CONFIG[getEventType(event.type)].color)} />
                          <span className="text-sm font-medium text-gray-900">{event.title}</span>
                        </div>
                        <button
                          onClick={() => setShowDeleteConfirm(event.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                      <Badge variant={EVENT_TYPE_CONFIG[getEventType(event.type)].badgeVariant} className="mb-1">
                        {EVENT_TYPE_CONFIG[getEventType(event.type)].label}
                      </Badge>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        title="Agregar Evento"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Título *"
            value={newEvent.title || ''}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Nombre del evento"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo *</label>
            <Select
              value={newEvent.type}
              onValueChange={(value) => setNewEvent((prev) => ({ ...prev, type: value as EventType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REUNION">Reunión</SelectItem>
                <SelectItem value="EVALUACION">Evaluación</SelectItem>
                <SelectItem value="FESTIVO">Festivo</SelectItem>
                <SelectItem value="ACTIVIDAD">Actividad</SelectItem>
                <SelectItem value="PLAZO">Plazo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Fecha *"
            type="date"
            value={newEvent.startDate || ''}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, startDate: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddEvent} disabled={!newEvent.title || !newEvent.startDate}>
              Agregar Evento
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!showDeleteConfirm}
        onOpenChange={() => setShowDeleteConfirm(null)}
        title="Eliminar Evento"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">¿Está seguro de eliminar este evento? Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => showDeleteConfirm && handleDeleteEvent(showDeleteConfirm)}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
