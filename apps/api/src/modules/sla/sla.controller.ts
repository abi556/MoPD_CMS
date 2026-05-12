import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import type { RequestWithCorrelationId } from '../../common/middleware/correlation-id.middleware';
import { CreateSlaConfigDto } from './dto/create-sla-config.dto';
import { UpdateSlaConfigDto } from './dto/update-sla-config.dto';
import { EscalateComplaintDto } from './dto/escalate-complaint.dto';
import {
  SlaConfigResponseDto,
  SlaStatusResponseDto,
} from './dto/sla-status-response.dto';
import { SlaService } from './sla.service';

@ApiTags('sla')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  // ---------------------------------------------------------------------------
  // Complaint-scoped endpoints
  // ---------------------------------------------------------------------------

  @Get('complaints/:id/sla')
  @Throttle({ default: { ttl: 60000, limit: 120 } })
  @Permissions('complaints:detail')
  @ApiOperation({ summary: 'Get SLA status for a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint id' })
  @ApiOkResponse({ type: SlaStatusResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async getSlaStatus(@Param('id') id: string): Promise<SlaStatusResponseDto> {
    return this.slaService.getStatusForComplaint(id);
  }

  @Post('complaints/:id/escalate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Permissions('complaint:escalate')
  @ApiOperation({ summary: 'Escalate a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint id' })
  @ApiOkResponse({ description: 'Escalation recorded' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async escalate(
    @Param('id') id: string,
    @Body() body: EscalateComplaintDto,
    @CurrentUser() user: JwtUser,
    @Req() req: RequestWithCorrelationId,
  ): Promise<void> {
    await this.slaService.escalateComplaint(
      id,
      user.id,
      body.reason,
      req.correlationId,
    );
  }

  // ---------------------------------------------------------------------------
  // Admin config endpoints
  // ---------------------------------------------------------------------------

  @Get('admin/sla-configs')
  @Throttle({ default: { ttl: 60000, limit: 120 } })
  @Permissions('config:manage')
  @ApiOperation({ summary: 'List all SLA configurations' })
  @ApiOkResponse({ type: [SlaConfigResponseDto] })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async listSlaConfigs(): Promise<SlaConfigResponseDto[]> {
    return this.slaService.listSlaConfigs();
  }

  @Post('admin/sla-configs')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Permissions('config:manage')
  @ApiOperation({ summary: 'Create a new SLA configuration' })
  @ApiCreatedResponse({ type: SlaConfigResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async createSlaConfig(
    @Body() dto: CreateSlaConfigDto,
    @Req() req: RequestWithCorrelationId,
  ): Promise<SlaConfigResponseDto> {
    return this.slaService.createSlaConfig(dto, req.correlationId);
  }

  @Patch('admin/sla-configs/:id')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Permissions('config:manage')
  @ApiOperation({ summary: 'Update a SLA configuration' })
  @ApiParam({ name: 'id', description: 'SlaConfig id' })
  @ApiOkResponse({ type: SlaConfigResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async updateSlaConfig(
    @Param('id') id: string,
    @Body() dto: UpdateSlaConfigDto,
    @Req() req: RequestWithCorrelationId,
  ): Promise<SlaConfigResponseDto> {
    return this.slaService.updateSlaConfig(id, dto, req.correlationId);
  }
}
