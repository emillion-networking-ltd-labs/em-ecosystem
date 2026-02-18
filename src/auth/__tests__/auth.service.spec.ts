import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';
import { User } from '../../users/entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'uuid-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: Role.USER,
    provider: Provider.LOCAL,
    providerId: null,
    emailVerified: false,
    failedAttempts: 0,
    lockedUntil: null,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'StrongPass1!',
    };

    describe('successful registration', () => {
      beforeEach(() => {
        usersService.findByEmail.mockResolvedValue(null);
        usersService.create.mockResolvedValue(mockUser);
        usersService.updateRefreshToken.mockResolvedValue(undefined);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
        jwtService.sign
          .mockReturnValueOnce('access-token-123')
          .mockReturnValueOnce('refresh-token-456');
      });

      it('should create a new user with hashed password and return JWT pair', async () => {
        const result = await authService.register(registerDto);

        expect(result.accessToken).toBe('access-token-123');
        expect(result.refreshToken).toBe('refresh-token-456');
        expect(result.user).toBeDefined();
      });

      it('should hash the password with bcrypt using 12 rounds', async () => {
        await authService.register(registerDto);

        expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass1!', 12);
      });

      it('should call usersService.create with email and hashed password', async () => {
        await authService.register(registerDto);

        expect(usersService.create).toHaveBeenCalledWith({
          email: 'test@example.com',
          passwordHash: 'hashed-value',
        });
      });

      it('should return SafeUser without passwordHash or refreshToken', async () => {
        const result = await authService.register(registerDto);

        expect(result.user).not.toHaveProperty('passwordHash');
        expect(result.user).not.toHaveProperty('refreshToken');
        expect(result.user.email).toBe('test@example.com');
        expect(result.user.id).toBe('uuid-123');
        expect(result.user.role).toBe(Role.USER);
      });

      it('should generate access token with correct payload', async () => {
        await authService.register(registerDto);

        expect(jwtService.sign).toHaveBeenCalledWith(
          {
            sub: 'uuid-123',
            email: 'test@example.com',
            role: Role.USER,
          },
          expect.objectContaining({ expiresIn: expect.any(String) }),
        );
      });

      it('should store hashed refresh token in database', async () => {
        await authService.register(registerDto);

        expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
          'uuid-123',
          'hashed-value',
        );
      });
    });

    describe('error cases', () => {
      it('should throw ConflictException when email already exists', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);

        await expect(authService.register(registerDto)).rejects.toThrow(
          ConflictException,
        );
        await expect(authService.register(registerDto)).rejects.toThrow(
          'Email already registered',
        );
      });

      it('should not create user when email already exists', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);

        await expect(authService.register(registerDto)).rejects.toThrow();

        expect(usersService.create).not.toHaveBeenCalled();
      });

      it('should check for existing email before creating user', async () => {
        const callOrder: string[] = [];
        usersService.findByEmail.mockImplementation(async () => {
          callOrder.push('findByEmail');
          return null;
        });
        usersService.create.mockImplementation(async () => {
          callOrder.push('create');
          return mockUser;
        });
        usersService.updateRefreshToken.mockResolvedValue(undefined);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
        jwtService.sign.mockReturnValue('token');

        await authService.register(registerDto);

        expect(usersService.findByEmail).toHaveBeenCalledWith(
          'test@example.com',
        );
        expect(callOrder.indexOf('findByEmail')).toBeLessThan(
          callOrder.indexOf('create'),
        );
      });
    });
  });
});
