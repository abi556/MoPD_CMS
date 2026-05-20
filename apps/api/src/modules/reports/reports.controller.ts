import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import type { RequestWithCorrelationId } from '../../common/middleware/correlation-id.middleware';
import { DashboardReportQueryDto } from './dto/dashboard-report.query.dto';
import {
  ChannelsDashboardEnvelopeDto,
  ResolutionDashboardEnvelopeDto,
  SlaDashboardEnvelopeDto,
  VolumeDashboardEnvelopeDto,
} from './dto/dashboard-response.dto';
import {
  CreateReportExportDto,
  ReportExportCreatedEnvelopeDto,
  ReportExportDownloadEnvelopeDto,
  ReportExportStatusEnvelopeDto,
} from './dto/report-export.dto';
import { ReportsService } from './reports.service';
import { normalizeReportFilters } from './report-filters';

function toFilters(query: DashboardReportQueryDto) {
  return normalizeReportFilters({
    from: query.from,
    to: query.to,
    bucket: query.bucket,
    categoryId: query.categoryId,
    orgUnitId: query.orgUnitId,
  });
}

function isSuperAdmin(user: JwtUser): boolean {
  return user.roles.includes('SuperAdmin');
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard/volume')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Permissions('report:view')
  @ApiOperation({ summary: 'Volume dashboard (status × date bucket)' })
  @ApiOkResponse({ type: VolumeDashboardEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async volume(
    @Query() query: DashboardReportQueryDto,
  ): Promise<VolumeDashboardEnvelopeDto> {
    return { data: await this.reports.getVolume(toFilters(query)) };
  }

  @Get('dashboard/sla')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Permissions('report:view')
  @ApiOperation({ summary: 'SLA compliance dashboard' })
  @ApiOkResponse({ type: SlaDashboardEnvelopeDto })
  async sla(
    @Query() query: DashboardReportQueryDto,
  ): Promise<SlaDashboardEnvelopeDto> {
    return { data: await this.reports.getSla(toFilters(query)) };
  }

  @Get('dashboard/resolution')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Permissions('report:view')
  @ApiOperation({ summary: 'Resolution metrics dashboard' })
  @ApiOkResponse({ type: ResolutionDashboardEnvelopeDto })
  async resolution(
    @Query() query: DashboardReportQueryDto,
  ): Promise<ResolutionDashboardEnvelopeDto> {
    return { data: await this.reports.getResolution(toFilters(query)) };
  }

  @Get('dashboard/channels')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Permissions('report:view')
  @ApiOperation({ summary: 'Channel utilization dashboard' })
  @ApiOkResponse({ type: ChannelsDashboardEnvelopeDto })
  async channels(
    @Query() query: DashboardReportQueryDto,
  ): Promise<ChannelsDashboardEnvelopeDto> {
    return { data: await this.reports.getChannels(toFilters(query)) };
  }

  @Post('export')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Permissions('report:export')
  @ApiOperation({ summary: 'Queue async complaint report export' })
  @ApiCreatedResponse({ type: ReportExportCreatedEnvelopeDto })
  async createExport(
    @Body() body: CreateReportExportDto,
    @CurrentUser() user: JwtUser,
    @Req() req: RequestWithCorrelationId,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ReportExportCreatedEnvelopeDto> {
    const record = await this.reports.createExport(
      body,
      user.id,
      req.correlationId,
    );
    res.setHeader('Location', `/api/v1/reports/export/${record.id}`);
    return {
      data: {
        id: record.id,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
      },
    };
  }

  @Get('export/:id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Permissions('report:export')
  @ApiOperation({ summary: 'Report export job status' })
  @ApiOkResponse({ type: ReportExportStatusEnvelopeDto })
  async exportStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<ReportExportStatusEnvelopeDto> {
    return {
      data: await this.reports.getExportStatus(id, user.id, isSuperAdmin(user)),
    };
  }

  @Get('export/:id/download')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Permissions('report:export')
  @ApiOperation({ summary: 'Download generated report export' })
  @ApiOkResponse({ type: ReportExportDownloadEnvelopeDto })
  @ApiAcceptedResponse({ type: ReportExportDownloadEnvelopeDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiGoneResponse({ type: ErrorResponseDto })
  async downloadExport(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ReportExportDownloadEnvelopeDto> {
    const result = await this.reports.getExportDownload(
      id,
      user.id,
      isSuperAdmin(user),
    );

    if (
      result.status === 'PENDING' ||
      result.status === 'PROCESSING' ||
      !result.url
    ) {
      res.status(HttpStatus.ACCEPTED);
      return {
        data: {
          status: result.status,
          url: '',
          expiresAt: '',
        },
      };
    }

    return {
      data: {
        url: result.url,
        expiresAt: result.expiresAt ?? '',
      },
    };
  }
}
