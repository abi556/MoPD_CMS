import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../modules/user/user.service';
import { SlaService } from '../modules/sla/sla.service';
import { ReferenceDataService } from '../modules/reference-data/reference-data.service';

async function bootstrap(): Promise<void> {
  process.env.AUTH_SEED_ENABLED = process.env.AUTH_SEED_ENABLED ?? 'true';
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const userService = app.get(UserService);
    await userService.ensureSeedUsers();

    const refDataService = app.get(ReferenceDataService);
    await refDataService.ensureSeedCategories();
    await refDataService.ensureSeedOrgUnits();

    const slaService = app.get(SlaService);
    await slaService.ensureSeedSlaConfigs();

    console.log('Seed completed successfully.');
  } finally {
    await app.close();
  }
}

void bootstrap();
