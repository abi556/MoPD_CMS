import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import {
  CreateUserDto,
  ListUsersQueryDto,
  ListUsersResponseDto,
  UpdateOwnProfileDto,
  UpdateUserDto,
  UserDetailResponseDto,
} from './dto/user-management.dto';
import {
  CreateRoleDto,
  PermissionListResponseDto,
  RoleListResponseDto,
  UpdateRoleDto,
} from './dto/role-management.dto';
import { UserManagementService } from './user-management.service';

@ApiTags('users')
@Controller()
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users (paginated/filterable)' })
  @ApiOkResponse({ type: ListUsersResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async listUsers(
    @Query() query: ListUsersQueryDto,
  ): Promise<ListUsersResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const isActive =
      query.isActive === undefined ? undefined : query.isActive === 'true';
    return this.userManagementService.listUsers({
      page,
      pageSize,
      email: query.email,
      isActive,
    });
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by id' })
  @ApiOkResponse({ type: UserDetailResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async getUserById(@Param('id') id: string): Promise<UserDetailResponseDto> {
    return { data: await this.userManagementService.getUserById(id) };
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user' })
  @ApiCreatedResponse({ type: UserDetailResponseDto })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async createUser(
    @Body() body: CreateUserDto,
  ): Promise<UserDetailResponseDto> {
    return { data: await this.userManagementService.createUser(body) };
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiOkResponse({ type: UserDetailResponseDto })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ): Promise<UserDetailResponseDto> {
    return { data: await this.userManagementService.updateUser(id, body) };
  }

  @Post('users/:id/deactivate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiOkResponse({ type: UserDetailResponseDto })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async deactivateUser(
    @Param('id') id: string,
  ): Promise<UserDetailResponseDto> {
    return { data: await this.userManagementService.deactivateUser(id) };
  }

  @Get('users/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserDetailResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async me(@CurrentUser() user: JwtUser): Promise<UserDetailResponseDto> {
    return { data: await this.userManagementService.getCurrentUser(user.id) };
  }

  @Patch('users/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  @ApiOkResponse({ type: UserDetailResponseDto })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async updateMe(
    @CurrentUser() user: JwtUser,
    @Body() body: UpdateOwnProfileDto,
  ): Promise<UserDetailResponseDto> {
    return {
      data: await this.userManagementService.updateCurrentUser(
        user.id,
        body.email,
      ),
    };
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('role:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List roles' })
  @ApiOkResponse({ type: RoleListResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async listRoles(): Promise<RoleListResponseDto> {
    return {
      data: await this.userManagementService.listRoles(),
    };
  }

  @Post('roles')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('role:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create role' })
  @ApiCreatedResponse({ type: RoleListResponseDto })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async createRole(@Body() body: CreateRoleDto): Promise<{
    data: Awaited<ReturnType<UserManagementService['createRole']>>;
  }> {
    return {
      data: await this.userManagementService.createRole(body),
    };
  }

  @Patch('roles/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('role:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update role permissions' })
  @ApiOkResponse({ type: RoleListResponseDto })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async updateRole(
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
  ): Promise<{
    data: Awaited<ReturnType<UserManagementService['updateRole']>>;
  }> {
    return {
      data: await this.userManagementService.updateRole(id, body),
    };
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('role:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete role (if unassigned)' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async deleteRole(@Param('id') id: string): Promise<void> {
    await this.userManagementService.deleteRole(id);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('role:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all permissions' })
  @ApiOkResponse({ type: PermissionListResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async listPermissions(): Promise<PermissionListResponseDto> {
    return {
      data: await this.userManagementService.listPermissions(),
    };
  }
}
