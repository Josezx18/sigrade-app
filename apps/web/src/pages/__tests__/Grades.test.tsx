import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Grades from '../grades/Grades';

vi.mock('../../hooks/useGrades', () => ({
  useGrades: () => ({
    data: { data: [], total: 0, page: 1, limit: 10, totalPages: 1 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateGrade: () => ({ mutateAsync: vi.fn() }),
  useUpdateGrade: () => ({ mutateAsync: vi.fn() }),
  useDeleteGrade: () => ({ mutateAsync: vi.fn() }),
  useBulkCreateGrades: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../hooks/useToast', () => ({
  toast: vi.fn(),
}));

describe('Grades page', () => {
  it('renders the page title', () => {
    render(<Grades />);
    expect(screen.getByText('Calificaciones')).toBeDefined();
  });
});
