import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async getProfile(userId: number): Promise<User> {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'affiliation'],
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async updateProfile(
    userId: number,
    updateData: { email?: string; firstName?: string; lastName?: string; affiliation?: string },
  ): Promise<User> {
    const user = await this.userModel.findByPk(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (updateData.email) user.email = updateData.email;
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.affiliation !== undefined) user.affiliation = updateData.affiliation;
    
    await user.save();
    
    return user;
  }
}
