import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserService } from './user.service';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserManagementController],
  providers: [UserService, UserManagementService],
  exports: [UserService, UserManagementService],
})
export class UserModule {}
