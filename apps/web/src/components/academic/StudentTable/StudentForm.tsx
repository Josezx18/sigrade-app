import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/Select';
import { User, Mail, Calendar, Phone, MapPin, IdCard } from 'lucide-react';

const studentSchema = z.object({
  firstName: z.string().min(1, 'Nombre es requerido').max(50),
  lastName: z.string().min(1, 'Apellido es requerido').max(50),
  dni: z.string().min(8, 'DNI debe tener al menos 8 caracteres').max(20),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  birthDate: z.string().min(1, 'Fecha de nacimiento es requerida'),
  gender: z.enum(['M', 'F']),
  address: z.string().optional(),
  gradeId: z.string().min(1, 'Grado es requerido'),
  section: z.string().optional(),
  enrollmentDate: z.string().min(1, 'Fecha de ingreso es requerida'),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email('Email inválido').optional().or(z.literal('')),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StudentFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<StudentFormData> | null;
  title?: string;
  submitLabel?: string;
}

export function StudentForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  initialData = null,
  title = 'Nuevo Estudiante',
  submitLabel = 'Guardar',
}: StudentFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dni: '',
      email: '',
      phone: '',
      birthDate: '',
      gender: 'M',
      address: '',
      gradeId: '',
      section: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      ...initialData,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as keyof StudentFormData, value as StudentFormData[keyof StudentFormData], { shouldValidate: true });
        }
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        dni: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: 'M',
        address: '',
        gradeId: '',
        section: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        parentName: '',
        parentPhone: '',
        parentEmail: '',
      });
    }
  }, [initialData, setValue, reset]);

  const handleFormSubmit = async (data: StudentFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="lg"
      showCloseButton={true}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nombre"
            placeholder="Juan"
            error={errors.firstName?.message}
            {...register('firstName')}
            leftIcon={<User className="h-5 w-5" />}
            disabled={isLoading}
          />
          <Input
            label="Apellido"
            placeholder="Pérez"
            error={errors.lastName?.message}
            {...register('lastName')}
            leftIcon={<User className="h-5 w-5" />}
            disabled={isLoading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="DNI"
            placeholder="12345678"
            error={errors.dni?.message}
            {...register('dni')}
            leftIcon={<IdCard className="h-5 w-5" />}
            disabled={isLoading}
          />
          <Input
            label="Email"
            type="email"
            placeholder="juan.perez@email.com"
            error={errors.email?.message}
            {...register('email')}
            leftIcon={<Mail className="h-5 w-5" />}
            disabled={isLoading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="Teléfono"
            type="tel"
            placeholder="809-555-0123"
            error={errors.phone?.message}
            {...register('phone')}
            leftIcon={<Phone className="h-5 w-5" />}
            disabled={isLoading}
          />
          <div>
            <label className="label">Fecha de Nacimiento</label>
            <Input
              type="date"
              error={errors.birthDate?.message}
              {...register('birthDate')}
              leftIcon={<Calendar className="h-5 w-5" />}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="label">Género</label>
            <Select
              value={''}
              onValueChange={(value: string) => setValue('gender', value as 'M' | 'F')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Dirección"
            placeholder="Calle Principal #123, Ensanche Naco"
            error={errors.address?.message}
            {...register('address')}
            leftIcon={<MapPin className="h-5 w-5" />}
            disabled={isLoading}
          />
          <div>
            <label className="label">Grado</label>
            <Select
              value={''}
              onValueChange={(value: string) => setValue('gradeId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar grado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1er Grado</SelectItem>
                <SelectItem value="2">2do Grado</SelectItem>
                <SelectItem value="3">3er Grado</SelectItem>
                <SelectItem value="4">4to Grado</SelectItem>
                <SelectItem value="5">5to Grado</SelectItem>
                <SelectItem value="6">6to Grado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Sección</label>
            <Select
              value={''}
              onValueChange={(value: string) => setValue('section', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sección" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label">Fecha de Ingreso</label>
            <Input
              type="date"
              error={errors.enrollmentDate?.message}
              {...register('enrollmentDate')}
              leftIcon={<Calendar className="h-5 w-5" />}
              disabled={isLoading}
            />
          </div>
          <div className="md:col-span-3">
            <label className="label">Datos del Padre/Madre/Tutor</label>
          </div>
          <Input
            label="Nombre del Tutor"
            placeholder="María Pérez"
            error={errors.parentName?.message}
            {...register('parentName')}
            leftIcon={<User className="h-5 w-5" />}
            disabled={isLoading}
          />
          <Input
            label="Teléfono del Tutor"
            type="tel"
            placeholder="809-555-0456"
            error={errors.parentPhone?.message}
            {...register('parentPhone')}
            leftIcon={<Phone className="h-5 w-5" />}
            disabled={isLoading}
          />
          <Input
            label="Email del Tutor"
            type="email"
            placeholder="maria.perez@email.com"
            error={errors.parentEmail?.message}
            {...register('parentEmail')}
            leftIcon={<Mail className="h-5 w-5" />}
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}