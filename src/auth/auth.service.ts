import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { JwtPayload } from '../shared/jwt/jwt.strategy';
import { User } from '../users/entities/user.entity';
import { UserResponse } from '../users/user-response';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

const INVALID_CREDENTIALS = 'E-mail ou senha inválidos';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    const exists = await this.usersRepository.exists({ where: { email } });
    if (exists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        name: dto.name,
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        heartsUpdatedAt: new Date(),
      }),
    );

    return this.issue(await this.usersService.findById(user.id));
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: dto.email.toLowerCase() })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    return this.issue(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<UserResponse> {
    const user = await this.usersService.findById(userId);
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.dailyGoal !== undefined) user.dailyGoal = dto.dailyGoal;
    await this.usersRepository.update(user.id, {
      name: user.name,
      dailyGoal: user.dailyGoal,
    });
    return this.usersService.toResponse(user);
  }

  private async issue(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      user: await this.usersService.toResponse(user),
      token: await this.jwtService.signAsync(payload),
    };
  }
}
