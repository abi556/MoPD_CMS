import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithCorrelationId } from '../../common/middleware/correlation-id.middleware';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './dto/category.dto';
import {
  CreateOrgUnitDto,
  UpdateOrgUnitDto,
  OrgUnitResponseDto,
} from './dto/org-unit.dto';
import { ReferenceDataService } from './reference-data.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin')
export class ReferenceDataController {
  constructor(private readonly refDataService: ReferenceDataService) {}

  // ---------------------------------------------------------------------------
  // Complaint Categories
  // ---------------------------------------------------------------------------

  @Get('complaint-categories')
  @Throttle({ default: { ttl: 60000, limit: 120 } })
  @Permissions('config:manage')
  @ApiOperation({ summary: 'List complaint categories' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'If true, return only active categories',
  })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async listCategories(
    @Query('activeOnly') activeOnly?: string,
  ): Promise<CategoryResponseDto[]> {
    return this.refDataService.listCategories(activeOnly === 'true');
  }

  @Post('complaint-categories')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Permissions('config:manage')
  @ApiOperation({ summary: 'Create a complaint category' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @Req() req: RequestWithCorrelationId,
  ): Promise<CategoryResponseDto> {
    return this.refDataService.createCategory(dto, req.correlationId);
  }

  @Patch('complaint-categories/:id')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Permissions('config:manage')
  @ApiOperation({ summary: 'Update a complaint category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: RequestWithCorrelationId,
  ): Promise<CategoryResponseDto> {
    return this.refDataService.updateCategory(id, dto, req.correlationId);
  }

  // ---------------------------------------------------------------------------
  // Org Units
  // ---------------------------------------------------------------------------

  @Get('org-units')
  @Throttle({ default: { ttl: 60000, limit: 120 } })
  @Permissions('config:manage')
  @ApiOperation({ summary: 'List organizational units' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'If true, return only active org units',
  })
  @ApiOkResponse({ type: [OrgUnitResponseDto] })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async listOrgUnits(
    @Query('activeOnly') activeOnly?: string,
  ): Promise<OrgUnitResponseDto[]> {
    return this.refDataService.listOrgUnits(activeOnly === 'true');
  }

  @Post('org-units')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Permissions('config:manage')
  @ApiOperation({ summary: 'Create an organizational unit' })
  @ApiCreatedResponse({ type: OrgUnitResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async createOrgUnit(
    @Body() dto: CreateOrgUnitDto,
    @Req() req: RequestWithCorrelationId,
  ): Promise<OrgUnitResponseDto> {
    return this.refDataService.createOrgUnit(dto, req.correlationId);
  }

  @Patch('org-units/:id')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Permissions('config:manage')
  @ApiOperation({ summary: 'Update an organizational unit' })
  @ApiParam({ name: 'id', description: 'OrgUnit ID' })
  @ApiOkResponse({ type: OrgUnitResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async updateOrgUnit(
    @Param('id') id: string,
    @Body() dto: UpdateOrgUnitDto,
    @Req() req: RequestWithCorrelationId,
  ): Promise<OrgUnitResponseDto> {
    return this.refDataService.updateOrgUnit(id, dto, req.correlationId);
  }
}
