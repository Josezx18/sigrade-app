import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { OwnerPrismaService } from '@sigrade/shared-prisma';
import { RedisService } from './redis.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import { LoginDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

interface ValidatedUser {
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
  isActive: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: OwnerPrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<ValidatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: { select: { type: true, tenantId: true } },
        teacher: { select: { id: true } },
        student: { select: { id: true } },
        counselor: { select: { id: true } },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dni: user.dni,
      tenantId: user.tenantId,
      roles: user.roles.map((r) => r.type),
      teacherId: user.teacher?.id,
      studentId: user.student?.id,
      counselorId: user.counselor?.id,
      isActive: user.isActive,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user);
    await this.updateLastLogin(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dni: user.dni,
        tenantId: user.tenantId,
        roles: user.roles,
        teacherId: user.teacherId,
        studentId: user.studentId,
        counselorId: user.counselorId,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const isBlacklisted = await this.redisService.isRefreshTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          roles: { select: { type: true, tenantId: true } },
          teacher: { select: { id: true } },
          student: { select: { id: true } },
          counselor: { select: { id: true } },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }

      const tokens = await this.generateTokens({
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        roles: user.roles.map((r) => r.type),
        teacherId: user.teacher?.id,
        studentId: user.student?.id,
        counselorId: user.counselor?.id,
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
      const seconds = this.parseExpiresIn(refreshExpiresIn);
      await this.redisService.blacklistRefreshToken(refreshToken, seconds);
    }
    await this.redisService.removeAllSessions(userId);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new ConflictException('Las contraseñas no coinciden');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    await this.redisService.removeAllSessions(userId);

    return { message: 'Contraseña actualizada correctamente' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      return { message: 'Si el email existe, recibirás instrucciones para restablecer la contraseña' };
    }

    const token = crypto.randomUUID();
    const expiresIn = 3600; // 1 hour
    await this.redisService.set(`pwdreset:${token}`, user.id, expiresIn);

    const resetUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:4200')}/reset-password?token=${token}`;

    await this.emailService.send({
      to: user.email,
      subject: 'Restablece tu contraseña - SIGRADE',
      text: `Has solicitado restablecer tu contraseña.\n\nHaz clic en este enlace: ${resetUrl}\n\nEste enlace expira en 1 hora.\n\nSi no solicitaste esto, ignora este mensaje.`,
      html: `
        <h2>Restablece tu contraseña</h2>
        <p>Has solicitado restablecer tu contraseña en SIGRADE.</p>
        <p><a href="${resetUrl}" style="padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">Restablecer contraseña</a></p>
        <p style="color:#666;font-size:14px;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
      `,
    });

    return { message: 'Si el email existe, recibirás instrucciones para restablecer la contraseña' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new ConflictException('Las contraseñas no coinciden');
    }

    const userId = await this.redisService.get(`pwdreset:${resetPasswordDto.token}`);
    if (!userId) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    await this.redisService.del(`pwdreset:${resetPasswordDto.token}`);
    await this.redisService.removeAllSessions(userId);

    return { message: 'Contraseña restablecida correctamente' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dni: true,
        phone: true,
        avatar: true,
        tenantId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        roles: {
          select: { type: true, tenantId: true, scope: true },
        },
        teacher: { select: { id: true, employeeCode: true } },
        student: { select: { id: true, studentCode: true } },
        counselor: { select: { id: true, employeeCode: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  private async generateTokens(user: { id: string; email: string; tenantId: string; roles: string[]; teacherId?: string; studentId?: string; counselorId?: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    return { accessToken, refreshToken };
  }

  private async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 604800;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 604800;
    }
  }
}
