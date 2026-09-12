import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, IsOptional, Matches, IsEnum } from 'class-validator';
import { RoleType } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'docente@ejemplo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe tener al menos una mayúscula, una minúscula, un número y un carácter especial',
  })
  newPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'docente@ejemplo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-from-email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe tener al menos una mayúscula, una minúscula, un número y un carácter especial',
  })
  newPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'docente@ejemplo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe tener al menos una mayúscula, una minúscula, un número y un carácter especial',
  })
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: '40212345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'La cédula debe tener 11 dígitos' })
  dni: string;

  @ApiPropertyOptional({ example: '8091234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'El teléfono debe tener 10 dígitos' })
  phone?: string;

  @ApiProperty({ enum: RoleType })
  @IsEnum(RoleType)
  role: RoleType;
}

export class LogoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    dni: string;
    tenantId: string;
    roles: string[];
    teacherId?: string;
    studentId?: string;
    counselorId?: string;
  };
}