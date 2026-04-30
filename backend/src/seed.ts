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
    { email: 'author3@test.com', firstName: 'Grace', lastName: 'Hopper', affiliation: 'Yale' },
    { email: 'author4@test.com', firstName: 'Henry', lastName: 'Turing', affiliation: 'Princeton' },
    { email: 'author5@test.com', firstName: 'Irene', lastName: 'Curie', affiliation: 'Sorbonne' },
    { email: 'reviewer1@test.com', firstName: 'Dave', lastName: 'Reviewer', affiliation: 'Cambridge' },
    { email: 'reviewer2@test.com', firstName: 'Eve', lastName: 'Critic', affiliation: 'ETH Zurich' },
    { email: 'reviewer3@test.com', firstName: 'Frank', lastName: 'Judge', affiliation: 'MIT' },
    { email: 'reviewer4@test.com', firstName: 'Julia', lastName: 'Knuth', affiliation: 'Caltech' },
    { email: 'reviewer5@test.com', firstName: 'Karl', lastName: 'Gauss', affiliation: 'TU Munich' },
  ];

  const password = await bcrypt.hash('test', 10);

  for (const u of users) {
    const [user, created] = await User.findOrCreate({
      where: { email: u.email },
      defaults: { ...u, passwordHash: password },
    });
    if (!created) {
      user.passwordHash = password;
      await user.save();
      console.log(`Reset password: ${user.email}`);
    } else {
      console.log(`Created: ${user.email}`);
    }
  }

  console.log('\nAll accounts use password: test');
  await app.close();
}

seed();
