import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { AuthService } from '../../src/modules/auth/auth.service';
import { LoginDto, RefreshTokenDto, LogoutDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from '../../src/modules/auth/dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockService = {
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call service.login with dto', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'pass123' };
      const expected = { accessToken: 'token', refreshToken: 'rtoken', user: { id: 'u-1', email: 'test@test.com', firstName: 'T', lastName: 'U', dni: '000', tenantId: 't-1', roles: [], teacherId: undefined, studentId: undefined, counselorId: undefined } };
      service.login.mockResolvedValue(expected as never);

      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('refresh', () => {
    it('should call service.refreshTokens', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'rtoken' };
      service.refreshTokens.mockResolvedValue({ accessToken: 'new-token', refreshToken: 'new-rtoken' } as never);

      const result = await controller.refresh(dto);

      expect(service.refreshTokens).toHaveBeenCalledWith('rtoken');
      expect(result.accessToken).toBe('new-token');
    });
  });

  describe('logout', () => {
    it('should call service.logout', async () => {
      const dto: LogoutDto = { refreshToken: 'rtoken' };
      service.logout.mockResolvedValue(undefined as never);

      await controller.logout('u-1', dto);

      expect(service.logout).toHaveBeenCalledWith('u-1', 'rtoken');
    });
  });

  describe('getProfile', () => {
    it('should call service.getProfile', async () => {
      service.getProfile.mockResolvedValue({ id: 'u-1', email: 'test@test.com' } as never);

      const result = await controller.getProfile('u-1');

      expect(service.getProfile).toHaveBeenCalledWith('u-1');
      expect(result).toEqual({ id: 'u-1', email: 'test@test.com' });
    });
  });

  describe('changePassword', () => {
    it('should call service.changePassword with dto', async () => {
      const dto: ChangePasswordDto = { currentPassword: 'old', newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' };
      service.changePassword.mockResolvedValue({ message: 'Password changed' } as never);

      const result = await controller.changePassword('u-1', dto);

      expect(service.changePassword).toHaveBeenCalledWith('u-1', dto);
    });
  });

  describe('forgotPassword', () => {
    it('should call service.forgotPassword', async () => {
      const dto: ForgotPasswordDto = { email: 'test@test.com' };
      service.forgotPassword.mockResolvedValue(undefined as never);

      await controller.forgotPassword(dto);

      expect(service.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPassword', () => {
    it('should call service.resetPassword with dto', async () => {
      const dto: ResetPasswordDto = { token: 'reset-token', newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' };
      service.resetPassword.mockResolvedValue({ message: 'Password reset' } as never);

      const result = await controller.resetPassword(dto);

      expect(service.resetPassword).toHaveBeenCalledWith(dto);
    });
  });
});
