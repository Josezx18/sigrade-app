import { Card, CardContent } from '../ui/Card';
import { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
}

const colorMap = {
  primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
  success: { bg: 'bg-success-100', text: 'text-success-600' },
  warning: { bg: 'bg-warning-100', text: 'text-warning-600' },
  danger: { bg: 'bg-danger-100', text: 'text-danger-600' },
  info: { bg: 'bg-blue-100', text: 'text-blue-600' },
};

export function StatsCard({ label, value, icon, color, subtitle }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
