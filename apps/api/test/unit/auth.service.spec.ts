import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../../src/modules/auth/auth.service';
import { RedisService } from '../../src/modules/auth/redis.service';
import { EmailService } from '../../src/modules/email/email.service';
import { OwnerPrismaService } from '@sigrade/shared-prisma';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    };
    return map[key];
  }),
};

const mockRedisService = {
  isRefreshTokenBlacklisted: jest.fn().mockResolvedValue(false),
  blacklistRefreshToken: jest.fn(),
  removeAllSessions: jest.fn(),
  storeSession: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockEmailService = {
  send: jest.fn().mockResolvedValue(true),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof mockPrisma;
  let jwtService: typeof mockJwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: OwnerPrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(OwnerPrismaService);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        dni: '40212345678',
        passwordHash,
        isActive: true,
        tenantId: 'tenant-1',
        roles: [{ type: 'TEACHER', tenantId: 'tenant-1' }],
        teacher: { id: 'teacher-1' },
        student: null,
        counselor: null,
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          roles: { select: { type: true, tenantId: true } },
          teacher: { select: { id: true } },
          student: { select: { id: true } },
          counselor: { select: { id: true } },
        },
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        dni: '40212345678',
        tenantId: 'tenant-1',
        roles: ['TEACHER'],
        teacherId: 'teacher-1',
        studentId: undefined,
        counselorId: undefined,
        isActive: true,
      });
    });

    it('should return null when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        isActive: false,
        roles: [],
      });

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        isActive: true,
        roles: [],
      });

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens and user data', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        dni: '40212345678',
        isActive: true,
        tenantId: 'tenant-1',
        roles: [{ type: 'TEACHER', tenantId: 'tenant-1' }],
        teacher: { id: 'teacher-1' },
        student: null,
        counselor: null,
        passwordHash,
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          dni: '40212345678',
          tenantId: 'tenant-1',
          roles: ['TEACHER'],
          teacherId: 'teacher-1',
          studentId: undefined,
          counselorId: undefined,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-access-token',
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens when refresh token is valid', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        tenantId: 'tenant-1',
        roles: [{ type: 'TEACHER', tenantId: 'tenant-1' }],
        teacher: { id: 'teacher-1' },
        student: null,
        counselor: null,
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshTokens('valid-refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-refresh-secret',
      });
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-access-token',
      });
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'nonexistent-user' });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('should update password when current password is correct', async () => {
      const currentHash = await bcrypt.hash('oldPassword1', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: currentHash,
      });
      prisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.changePassword('user-1', {
        currentPassword: 'oldPassword1',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });

      expect(result).toEqual({ message: 'Contraseña actualizada correctamente' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: expect.any(String) },
      });
    });

    it('should throw ConflictException when passwords do not match', async () => {
      await expect(
        service.changePassword('user-1', {
          currentPassword: 'old',
          newPassword: 'new1',
          confirmPassword: 'new2',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', {
          currentPassword: 'old',
          newPassword: 'NewPass123!',
          confirmPassword: 'NewPass123!',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      const currentHash = await bcrypt.hash('correctOld', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: currentHash,
      });

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrongOld',
          newPassword: 'NewPass123!',
          confirmPassword: 'NewPass123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should return success message when email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(result).toEqual({
        message: 'Si el email existe, recibirás instrucciones para restablecer la contraseña',
      });
    });

    it('should return success message even when email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'unknown@example.com' });

      expect(result).toEqual({
        message: 'Si el email existe, recibirás instrucciones para restablecer la contraseña',
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password when passwords match', async () => {
      jest.spyOn(mockRedisService, 'get').mockResolvedValue('user-1');
      prisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });

      expect(result).toEqual({ message: 'Contraseña restablecida correctamente' });
    });

    it('should throw ConflictException when passwords do not match', async () => {
      await expect(
        service.resetPassword({
          token: 'token',
          newPassword: 'Pass1!',
          confirmPassword: 'Pass2!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        dni: '40212345678',
        phone: '8091234567',
        avatar: null,
        tenantId: 'tenant-1',
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        roles: [{ type: 'TEACHER', tenantId: 'tenant-1', scope: {} }],
        teacher: { id: 'teacher-1', employeeCode: 'EMP001' },
        student: null,
        counselor: null,
      };
      prisma.user.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
