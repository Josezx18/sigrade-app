import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@sigrade/shared-prisma';
import { EventsGateway } from '../../src/modules/ws/events.gateway';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let jwtService: { verify: jest.Mock };

  beforeEach(async () => {
    jwtService = { verify: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: JwtService, useValue: jwtService },
        {
          provide: PrismaService,
          useValue: { runInTenantContext: jest.fn((_tenantId: unknown, work: () => unknown) => work()) },
        },
      ],
    }).compile();
    gateway = module.get<EventsGateway>(EventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should track connected clients by tenantId derived from a verified JWT', () => {
    jwtService.verify.mockReturnValue({ tenantId: 'tenant-1' });
    const mockClient = {
      id: 'client-1',
      handshake: { auth: { token: 'valid-token' }, query: {}, headers: {} },
      join: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    gateway.handleConnection(mockClient);

    expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
    gateway.handleDisconnect(mockClient);
  });

  it('should disconnect when no token is provided', () => {
    const mockClient = {
      id: 'client-2',
      handshake: { auth: {}, query: {}, headers: {} },
      join: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    gateway.handleConnection(mockClient);

    expect(mockClient.disconnect).toHaveBeenCalledWith(true);
  });

  it('should disconnect when the token is invalid', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const mockClient = {
      id: 'client-3',
      handshake: { auth: { token: 'bad' }, query: {}, headers: {} },
      join: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    gateway.handleConnection(mockClient);

    expect(mockClient.disconnect).toHaveBeenCalledWith(true);
  });

  it('should join room on subscribe', () => {
    const mockClient = {
      id: 'client-1',
      handshake: { query: {} },
      join: jest.fn(),
    } as any;

    gateway.handleSubscribe(mockClient, { room: 'planning:abc' });
    expect(mockClient.join).toHaveBeenCalledWith('planning:abc');
  });
});
