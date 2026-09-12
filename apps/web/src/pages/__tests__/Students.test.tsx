import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Students } from '../students/Students';

vi.mock('../../hooks/useStudents', () => ({
  useStudents: () => ({
    data: { data: [], total: 0, page: 1, limit: 10, totalPages: 1 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateStudent: () => ({ mutateAsync: vi.fn() }),
  useUpdateStudent: () => ({ mutateAsync: vi.fn() }),
  useDeleteStudent: () => ({ mutateAsync: vi.fn() }),
  useBulkDeleteStudents: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../hooks/useToast', () => ({
  toast: vi.fn(),
}));

describe('Students page', () => {
  it('renders the page title', () => {
    render(<Students />);
    expect(screen.getByText('Estudiantes')).toBeDefined();
  });

  it('renders the page subtitle', () => {
    render(<Students />);
    expect(screen.getByText('Gestión de estudiantes y matrículas')).toBeDefined();
  });
});
