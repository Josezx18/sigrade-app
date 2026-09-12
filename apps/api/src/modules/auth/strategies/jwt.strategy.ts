import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { OwnerPrismaService } from '@sigrade/shared-prisma';
import { RoleType } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: RoleType[];
  teacherId?: string;
  studentId?: string;
  counselorId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: OwnerPrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Bootstrap identity lookup uses the OWNER connection (OwnerPrismaService)
    // so RLS does not hide the row before the tenant is known. The per-request
    // RLS tenant context for downstream domain data is set by
    // TenantContextInterceptor.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          where: { tenantId: payload.tenantId },
          select: { type: true },
        },
        teacher: { select: { id: true } },
        student: { select: { id: true } },
        counselor: { select: { id: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
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
}