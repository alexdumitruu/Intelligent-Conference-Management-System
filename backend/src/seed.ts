import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { User } from './users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const users = [
    { email: 'chair@test.com', firstName: 'Alice', lastName: 'Chair', affiliation: 'MIT' },
    { email: 'author1@test.com', firstName: 'Bob', lastName: 'Author', affiliation: 'Stanford' },
    { email: 'author2@test.com', firstName: 'Carol', lastName: 'Writer', affiliation: 'Oxford' },
    { email: 'reviewer1@test.com', firstName: 'Dave', lastName: 'Reviewer', affiliation: 'Cambridge' },
    { email: 'reviewer2@test.com', firstName: 'Eve', lastName: 'Critic', affiliation: 'ETH Zurich' },
    { email: 'reviewer3@test.com', firstName: 'Frank', lastName: 'Judge', affiliation: 'MIT' },
  ];

  const password = await bcrypt.hash('Test1234!', 10);

  for (const u of users) {
    const [user, created] = await User.findOrCreate({
      where: { email: u.email },
      defaults: { ...u, passwordHash: password },
    });
    console.log(`${created ? 'Created' : 'Exists'}: ${user.email}`);
  }

  console.log('\nAll accounts use password: Test1234!');
  await app.close();
}

seed();
