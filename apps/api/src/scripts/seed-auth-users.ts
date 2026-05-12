import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../modules/user/user.service';
import { SlaService } from '../modules/sla/sla.service';

async function bootstrap(): Promise<void> {
  process.env.AUTH_SEED_ENABLED = process.env.AUTH_SEED_ENABLED ?? 'true';
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const userService = app.get(UserService);
    await userService.ensureSeedUsers();

    const slaService = app.get(SlaService);
    await slaService.ensureSeedSlaConfigs();

    console.log('Seed completed successfully.');
  } finally {
    await app.close();
  }
}

void bootstrap();
