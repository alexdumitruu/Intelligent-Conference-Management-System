import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly jwtService: JwtService,
  ) {}
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<{ accessToken: string }> {
    const existingUser = await this.userModel.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.userModel.create({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
    });
    const accessToken = this.generateToken(user);
    return { accessToken };
  }
  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    try {
      console.log('--- LOGIN DEBUG ---');
      console.log('EMAIL ARG:', email);
      console.log('PASSWORD ARG:', password);
      
      const user = await this.userModel.findOne({ where: { email } });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      console.log('USER PASSWORD HASH:', user.passwordHash);
      console.log('USER DATA VALUES:', user.dataValues);
      console.log('-------------------');

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const accessToken = this.generateToken(user);
      return { accessToken };
    } catch (error) {
      console.error('CRASH IN AUTH SERVICE:', error);
      throw error;
    }
  }
  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
