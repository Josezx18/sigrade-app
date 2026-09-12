import { usePeriod } from '../../hooks/usePeriod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

export function PeriodSelector() {
  const { currentPeriod, periods, isLoading, setPeriod } = usePeriod();

  if (isLoading || periods.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline">Período:</span>
      <Select
        value={currentPeriod?.id || ''}
        onValueChange={(value) => {
          const period = periods.find(p => p.id === value);
          if (period) setPeriod(period);
        }}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs border-secondary-200">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period.id} value={period.id}>
              <div className="flex items-center gap-2">
                <span>{period.name}</span>
                {period.isActive && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-success-100 text-success-700">
                    Activo
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
