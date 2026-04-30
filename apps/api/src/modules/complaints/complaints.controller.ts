import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiParam,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestWithCorrelationId } from '../../common/middleware/correlation-id.middleware';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import {
  ComplaintCreatedDataDto,
  ComplaintCreatedEnvelopeDto,
  ComplaintDetailDataDto,
  ComplaintDetailEnvelopeDto,
  ComplaintHistoryEnvelopeDto,
  ComplaintHistoryItemDto,
  ComplaintListEnvelopeDto,
  ComplaintListItemDto,
  ComplaintListMetaDto,
  ComplaintTrackingDataDto,
  ComplaintTrackingEnvelopeDto,
} from './dto/complaint-response.dto';
import { AssignComplaintDto } from './dto/assign-complaint.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { TransitionComplaintDto } from './dto/transition-complaint.dto';
import { ListComplaintsQueryDto } from './dto/list-complaints.dto';
import { ComplaintsService } from './complaints.service';

@ApiTags('complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SuperAdmin', 'CaseOfficer')
  @Permissions('complaints:list')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List complaints for staff operations',
    description:
      'Returns complaints with pagination and optional filters for status, channel, locale, and submission date range.',
  })
  @ApiOkResponse({
    description: 'Paginated complaint results for staff users.',
    type: ComplaintListEnvelopeDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user does not have required role.',
    type: ErrorResponseDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Query parameters failed validation.',
    type: ErrorResponseDto,
  })
  async list(@Query() query: ListComplaintsQueryDto): Promise<{
    data: ComplaintListItemDto[];
    meta: ComplaintListMetaDto;
  }> {
    const result = await this.complaintsService.listForStaff(query);

    return {
      data: result.data.map((item) => ({
        id: item.id,
        referenceNo: item.referenceNo,
        status: item.status,
        channel: item.channel,
        subject: item.subject,
        submittedAt: item.submittedAt,
        locale: item.locale,
      })),
      meta: result.meta,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SuperAdmin', 'CaseOfficer')
  @Permissions('complaints:detail')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get complaint details by internal id',
    description: 'Returns full complaint details for internal staff workflows.',
  })
  @ApiParam({
    name: 'id',
    description: 'Internal complaint id.',
    example: 'cmojx636z0000tc9mj1pge0zh',
  })
  @ApiOkResponse({
    description: 'Complaint details for internal staff view.',
    type: ComplaintDetailEnvelopeDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user does not have required role.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Complaint id was not found.',
    type: ErrorResponseDto,
  })
  async getById(
    @Param('id') id: string,
  ): Promise<{ data: ComplaintDetailDataDto }> {
    const complaint = await this.complaintsService.getByIdForStaff(id);

    return {
      data: {
        id: complaint.id,
        referenceNo: complaint.referenceNo,
        status: complaint.status,
        channel: complaint.channel,
        subject: complaint.subject,
        description: complaint.description,
        submittedAt: complaint.submittedAt,
        locale: complaint.locale,
        consentGiven: complaint.consentGiven,
        complainantName: complaint.complainantName ?? null,
        complainantEmail: complaint.complainantEmail ?? null,
        complainantPhone: complaint.complainantPhone ?? null,
        assignedToUserId: complaint.assignedToUserId ?? null,
        assignedByUserId: complaint.assignedByUserId ?? null,
        assignedAt: complaint.assignedAt ?? null,
        assignmentReason: complaint.assignmentReason ?? null,
        lastTransitionByUserId: complaint.lastTransitionByUserId ?? null,
        lastTransitionAt: complaint.lastTransitionAt ?? null,
        lastTransitionReason: complaint.lastTransitionReason ?? null,
      },
    };
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SuperAdmin', 'CaseOfficer')
  @Permissions('complaints:history')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get immutable complaint history timeline',
    description:
      'Returns assignment and workflow transition events in chronological order.',
  })
  @ApiParam({
    name: 'id',
    description: 'Internal complaint id.',
    example: 'cmojzpoy200006o9mjdpyn6w4',
  })
  @ApiOkResponse({
    description: 'Complaint history timeline for staff view.',
    type: ComplaintHistoryEnvelopeDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user does not have required role.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Complaint id was not found.',
    type: ErrorResponseDto,
  })
  async history(
    @Param('id') id: string,
  ): Promise<{ data: ComplaintHistoryItemDto[] }> {
    const items = await this.complaintsService.getHistoryForStaff(id);

    return {
      data: items.map((item) => ({
        id: item.id,
        action: item.action,
        fromStatus: item.fromStatus,
        toStatus: item.toStatus,
        actorUserId: item.actorUserId,
        reason: item.reason ?? null,
        createdAt: item.createdAt,
      })),
    };
  }

  @Post(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SuperAdmin', 'CaseOfficer')
  @Permissions('complaints:assign')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign or reassign complaint to an officer',
    description:
      'Sets assignment ownership and marks complaint status as ASSIGNED.',
  })
  @ApiParam({
    name: 'id',
    description: 'Internal complaint id.',
    example: 'cmojzpoy200006o9mjdpyn6w4',
  })
  @ApiOkResponse({
    description: 'Complaint assignment updated.',
    type: ComplaintDetailEnvelopeDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user does not have required role.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Complaint id was not found.',
    type: ErrorResponseDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Request body failed validation.',
    type: ErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async assign(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() body: AssignComplaintDto,
    @Req() request: RequestWithCorrelationId,
  ): Promise<{ data: ComplaintDetailDataDto }> {
    const complaint = await this.complaintsService.assignComplaint(
      id,
      body.assigneeUserId,
      user.id,
      body.reason,
      request.correlationId,
    );

    return {
      data: {
        id: complaint.id,
        referenceNo: complaint.referenceNo,
        status: complaint.status,
        channel: complaint.channel,
        subject: complaint.subject,
        description: complaint.description,
        submittedAt: complaint.submittedAt,
        locale: complaint.locale,
        consentGiven: complaint.consentGiven,
        complainantName: complaint.complainantName ?? null,
        complainantEmail: complaint.complainantEmail ?? null,
        complainantPhone: complaint.complainantPhone ?? null,
        assignedToUserId: complaint.assignedToUserId ?? null,
        assignedByUserId: complaint.assignedByUserId ?? null,
        assignedAt: complaint.assignedAt ?? null,
        assignmentReason: complaint.assignmentReason ?? null,
        lastTransitionByUserId: complaint.lastTransitionByUserId ?? null,
        lastTransitionAt: complaint.lastTransitionAt ?? null,
        lastTransitionReason: complaint.lastTransitionReason ?? null,
      },
    };
  }

  @Post(':id/transition')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SuperAdmin', 'CaseOfficer')
  @Permissions('complaints:transition')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Transition complaint workflow status',
    description:
      'Transitions complaint status with guard-validated workflow rules and required reason.',
  })
  @ApiParam({
    name: 'id',
    description: 'Internal complaint id.',
    example: 'cmojzpoy200006o9mjdpyn6w4',
  })
  @ApiOkResponse({
    description: 'Complaint status transitioned successfully.',
    type: ComplaintDetailEnvelopeDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user does not have required role.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Complaint id was not found.',
    type: ErrorResponseDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid transition request payload or workflow transition.',
    type: ErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async transition(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() body: TransitionComplaintDto,
    @Req() request: RequestWithCorrelationId,
  ): Promise<{ data: ComplaintDetailDataDto }> {
    const complaint = await this.complaintsService.transitionComplaint(
      id,
      body.toStatus,
      user.id,
      body.reason,
      request.correlationId,
    );

    return {
      data: {
        id: complaint.id,
        referenceNo: complaint.referenceNo,
        status: complaint.status,
        channel: complaint.channel,
        subject: complaint.subject,
        description: complaint.description,
        submittedAt: complaint.submittedAt,
        locale: complaint.locale,
        consentGiven: complaint.consentGiven,
        complainantName: complaint.complainantName ?? null,
        complainantEmail: complaint.complainantEmail ?? null,
        complainantPhone: complaint.complainantPhone ?? null,
        assignedToUserId: complaint.assignedToUserId ?? null,
        assignedByUserId: complaint.assignedByUserId ?? null,
        assignedAt: complaint.assignedAt ?? null,
        assignmentReason: complaint.assignmentReason ?? null,
        lastTransitionByUserId: complaint.lastTransitionByUserId ?? null,
        lastTransitionAt: complaint.lastTransitionAt ?? null,
        lastTransitionReason: complaint.lastTransitionReason ?? null,
      },
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Submit a new complaint',
    description:
      'Creates a complaint record and returns a tracking reference number.',
  })
  @ApiCreatedResponse({
    description: 'Complaint submitted successfully.',
    type: ComplaintCreatedEnvelopeDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed for one or more request fields.',
    type: ErrorResponseDto,
  })
  async create(
    @Body() body: CreateComplaintDto,
    @Req() request: RequestWithCorrelationId,
  ): Promise<{ data: ComplaintCreatedDataDto }> {
    const created = await this.complaintsService.create(
      body,
      request.correlationId,
    );

    return {
      data: {
        id: created.id,
        referenceNo: created.referenceNo,
        status: created.status,
        channel: created.channel,
        subject: created.subject,
        submittedAt: created.submittedAt,
        locale: created.locale,
        consentGiven: created.consentGiven,
      },
    };
  }

  @Get('track/:referenceNo')
  @ApiOperation({
    summary: 'Track a complaint by public reference number',
  })
  @ApiOkResponse({
    description: 'Complaint tracking information.',
    type: ComplaintTrackingEnvelopeDto,
  })
  @ApiNotFoundResponse({
    description: 'Complaint reference was not found.',
    type: ErrorResponseDto,
  })
  async track(@Param('referenceNo') referenceNo: string): Promise<{
    data: ComplaintTrackingDataDto;
  }> {
    const complaint = await this.complaintsService.getByReference(referenceNo);

    return {
      data: {
        referenceNo: complaint.referenceNo,
        status: complaint.status,
        subject: complaint.subject,
        submittedAt: complaint.submittedAt,
      },
    };
  }
}
