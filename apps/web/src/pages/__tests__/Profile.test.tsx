import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Profile } from '../profile/Profile';

const mockUser = {
  id: '1',
  email: 'juan.perez@example.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  dni: '12345678',
  roles: ['ADMIN'],
  tenantId: 'tenant-1',
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Profile', () => {
  it('renders user email', () => {
    render(<Profile />);
    expect(screen.getByText('juan.perez@example.com')).toBeDefined();
  });

  it('renders user full name', () => {
    render(<Profile />);
    expect(screen.getByText('Juan Pérez')).toBeDefined();
  });

  it('renders user DNI', () => {
    render(<Profile />);
    expect(screen.getByText('12345678')).toBeDefined();
  });

  it('renders user roles', () => {
    render(<Profile />);
    expect(screen.getByText('ADMIN')).toBeDefined();
  });

  it('shows change password form when button is clicked', () => {
    render(<Profile />);
    fireEvent.click(screen.getByText('Cambiar contraseña'));
    expect(screen.getByPlaceholderText('Contraseña actual')).toBeDefined();
    expect(screen.getByPlaceholderText('Nueva contraseña')).toBeDefined();
    expect(screen.getByPlaceholderText('Confirmar nueva contraseña')).toBeDefined();
    expect(screen.getByText('Actualizar contraseña')).toBeDefined();
  });

  it('shows error when passwords do not match', () => {
    render(<Profile />);
    fireEvent.click(screen.getByText('Cambiar contraseña'));

    fireEvent.change(screen.getByPlaceholderText('Contraseña actual'), { target: { value: 'old123' } });
    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'new12345' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar nueva contraseña'), { target: { value: 'different' } });
    fireEvent.click(screen.getByText('Actualizar contraseña'));

    expect(screen.getByText('Las contraseñas no coinciden')).toBeDefined();
  });

  it('shows success message on successful password change', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'ok' }),
    } as Response);

    render(<Profile />);
    fireEvent.click(screen.getByText('Cambiar contraseña'));

    fireEvent.change(screen.getByPlaceholderText('Contraseña actual'), { target: { value: 'old123' } });
    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'new12345' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar nueva contraseña'), { target: { value: 'new12345' } });
    fireEvent.click(screen.getByText('Actualizar contraseña'));

    await screen.findByText('Contraseña actualizada correctamente');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/change-password', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ currentPassword: 'old123', newPassword: 'new12345', confirmPassword: 'new12345' }),
    }));
  });

  it('shows error message from API on failed password change', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'La contraseña actual no es correcta' }),
    } as Response);

    render(<Profile />);
    fireEvent.click(screen.getByText('Cambiar contraseña'));

    fireEvent.change(screen.getByPlaceholderText('Contraseña actual'), { target: { value: 'wrongold' } });
    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'new12345' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar nueva contraseña'), { target: { value: 'new12345' } });
    fireEvent.click(screen.getByText('Actualizar contraseña'));

    await screen.findByText('La contraseña actual no es correcta');
  });

  it('shows connection error when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(<Profile />);
    fireEvent.click(screen.getByText('Cambiar contraseña'));

    fireEvent.change(screen.getByPlaceholderText('Contraseña actual'), { target: { value: 'old123' } });
    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'new12345' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar nueva contraseña'), { target: { value: 'new12345' } });
    fireEvent.click(screen.getByText('Actualizar contraseña'));

    await screen.findByText('Error de conexión');
  });

  it('toggles password form visibility', () => {
    render(<Profile />);

    fireEvent.click(screen.getByText('Cambiar contraseña'));
    expect(screen.getByPlaceholderText('Contraseña actual')).toBeDefined();

    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByPlaceholderText('Contraseña actual')).toBeNull();
  });
});
