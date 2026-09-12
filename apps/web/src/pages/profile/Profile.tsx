import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function Profile() {
  const { user } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (res.ok) {
        setMessage('Contraseña actualizada correctamente');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        setMessage(err.message || 'Error al cambiar contraseña');
      }
    } catch {
      setMessage('Error de conexión');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Mi Perfil</h1>
          <p className="text-secondary-600">Configuración de cuenta y preferencias</p>
        </div>
      </div>

      <Card>
        <div className="card-header">
          <h3 className="card-title">Información Personal</h3>
        </div>
        <div className="card-content">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Nombre</label>
              <p className="text-secondary-900">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <label className="label">Email</label>
              <p className="text-secondary-900">{user?.email}</p>
            </div>
            <div>
              <label className="label">DNI</label>
              <p className="text-secondary-900">{user?.dni}</p>
            </div>
            <div>
              <label className="label">Roles</label>
              <p className="text-secondary-900">{user?.roles?.join(', ')}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="card-header">
          <h3 className="card-title">Configuración</h3>
        </div>
        <div className="card-content space-y-3">
          <Button variant="outline" className="w-full" onClick={() => setShowPasswordForm(!showPasswordForm)}>
            {showPasswordForm ? 'Cancelar' : 'Cambiar contraseña'}
          </Button>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-3 pt-2 border-t">
              <Input
                type="password"
                placeholder="Contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <Input
                type="password"
                placeholder="Confirmar nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" className="w-full">
                Actualizar contraseña
              </Button>
            </form>
          )}

          {message && (
            <p className={`text-sm ${message.includes('actualizada') ? 'text-success-600' : 'text-destructive'}`}>
              {message}
            </p>
          )}

          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/profile/notifications'}>
            Notificaciones
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/profile/preferences'}>
            Preferencias
          </Button>
        </div>
      </Card>
    </div>
  );
}