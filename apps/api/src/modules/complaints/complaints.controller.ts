import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBody,
  ApiConsumes,
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
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
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
import { AppealComplaintDto } from './dto/appeal-complaint.dto';
import { AssignComplaintDto } from './dto/assign-complaint.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import { TransitionComplaintDto } from './dto/transition-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { ListComplaintsQueryDto } from './dto/list-complaints.dto';
import { ComplaintsService, type ComplaintRecord } from './complaints.service';
import { getDocumentMaxBytes } from '../documents/document.config';
import type { UploadedMulterFile } from '../documents/types/uploaded-file';
import { DocumentEnvelopeDto } from '../documents/dto/document-response.dto';
import { ReferenceDataService } from '../reference-data/reference-data.service';
import {
  ComplaintFormOptionsDataDto,
  ComplaintFormOptionsEnvelopeDto,
} from './dto/complaint-form-options.dto';

function toComplaintDetailData(
  complaint: ComplaintRecord,
): ComplaintDetailDataDto {
  return {
    id: complaint.id,
    referenceNo: complaint.referenceNo,
    status: complaint.status,
    channel: complaint.channel,
    subject: complaint.subject,
    description: complaint.description,
    submittedAt: complaint.submittedAt,
    locale: complaint.locale,
    consentGiven: complaint.consentGiven,
    categoryId: complaint.categoryId ?? null,
    orgUnitId: complaint.orgUnitId ?? null,
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
  };
}

@ApiTags('complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('complaint:read')
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
  @Throttle({ default: { limit: 180, ttl: 60000 } })
  async list(
    @Query() query: ListComplaintsQueryDto,
    @CurrentUser() user: JwtUser,
  ): Promise<{
    data: ComplaintListItemDto[];
    meta: ComplaintListMetaDto;
  }> {
    const result = await this.complaintsService.listForStaff(query, user);

    return {
      data: result.data.map((item) => ({
        id: item.id,
        referenceNo: item.referenceNo,
        status: item.status,
        channel: item.channel,
        subject: item.subject,
        submittedAt: item.submittedAt,
        locale: item.locale,
        categoryId: item.categoryId ?? null,
        orgUnitId: item.orgUnitId ?? null,
      })),
      meta: result.meta,
    };
  }

  // Public routes — must be registered before @Get(':id') to avoid param capture.
  @Get('form-options')
  @ApiOperation({
    summary: 'Public complaint form reference data',
    description:
      'Returns active complaint categories and org units for the public submission form.',
  })
  @ApiOkResponse({
    description: 'Form options for public complaint submission.',
    type: ComplaintFormOptionsEnvelopeDto,
  })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getFormOptions(): Promise<{ data: ComplaintFormOptionsDataDto }> {
    const [categories, orgUnits] = await Promise.all([
      this.referenceDataService.listCategories(true),
      this.referenceDataService.listOrgUnits(true),
    ]);

    return {
      data: {
        categories: categories.map((c) => ({
          id: c.id,
          code: c.code,
          nameEn: c.nameEn,
          nameAm: c.nameAm,
        })),
        orgUnits: orgUnits.map((o) => ({
          id: o.id,
          code: o.code,
          nameEn: o.nameEn,
          nameAm: o.nameAm,
        })),
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
  @Throttle({ default: { limit: 60, ttl: 60000 } })
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

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('complaint:read')
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
  @Throttle({ default: { limit: 180, ttl: 60000 } })
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<{ data: ComplaintDetailDataDto }> {
    const complaint = await this.complaintsService.getByIdForStaff(id, user);

    return {
      data: toComplaintDetailData(complaint),
    };
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('complaint:read')
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
  @Throttle({ default: { limit: 180, ttl: 60000 } })
  async history(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<{ data: ComplaintHistoryItemDto[] }> {
    const items = await this.complaintsService.getHistoryForStaff(id, user);

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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('workflow:transition')
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
  @Throttle({ default: { limit: 120, ttl: 60000 } })
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
      user,
    );

    return {
      data: toComplaintDetailData(complaint),
    };
  }

  @Post(':id/transition')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('workflow:transition')
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
  @Throttle({ default: { limit: 120, ttl: 60000 } })
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
      user,
    );

    return {
      data: toComplaintDetailData(complaint),
    };
  }

  @Post(':id/appeal')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('complaint:escalate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Escalate complaint to appeal status' })
  @ApiParam({ name: 'id', description: 'Internal complaint id.' })
  @ApiOkResponse({ type: ComplaintDetailEnvelopeDto })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async appeal(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() body: AppealComplaintDto,
    @Req() request: RequestWithCorrelationId,
  ): Promise<{ data: ComplaintDetailDataDto }> {
    const complaint = await this.complaintsService.appealComplaint(
      id,
      user,
      body.reason,
      request.correlationId,
    );
    return { data: toComplaintDetailData(complaint) };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('complaint:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update complaint metadata (non-status fields)' })
  @ApiParam({ name: 'id', description: 'Internal complaint id.' })
  @ApiOkResponse({ type: ComplaintDetailEnvelopeDto })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async updateMetadata(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() body: UpdateComplaintDto,
    @Req() request: RequestWithCorrelationId,
  ): Promise<{ data: ComplaintDetailDataDto }> {
    const complaint = await this.complaintsService.updateComplaintMetadata(
      id,
      user,
      body,
      request.correlationId,
    );
    return { data: toComplaintDetailData(complaint) };
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
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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
        id: created.complaint.id,
        referenceNo: created.complaint.referenceNo,
        status: created.complaint.status,
        channel: created.complaint.channel,
        subject: created.complaint.subject,
        submittedAt: created.complaint.submittedAt,
        locale: created.complaint.locale,
        consentGiven: created.complaint.consentGiven,
        categoryId: created.complaint.categoryId ?? null,
        orgUnitId: created.complaint.orgUnitId ?? null,
        uploadSession: created.uploadSession ?? null,
      },
    };
  }

  @Post(':id/evidence')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: getDocumentMaxBytes() },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload optional public evidence for a submitted complaint',
  })
  @ApiParam({ name: 'id', description: 'Complaint id.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'uploadToken'],
      properties: {
        file: { type: 'string', format: 'binary' },
        uploadToken: { type: 'string' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Evidence uploaded successfully.',
    type: DocumentEnvelopeDto,
  })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async uploadEvidence(
    @Param('id') id: string,
    @Body() body: UploadEvidenceDto,
    @UploadedFile() file: UploadedMulterFile,
    @Req() request: RequestWithCorrelationId,
  ): Promise<DocumentEnvelopeDto> {
    const record = await this.complaintsService.uploadPublicEvidence(
      id,
      body.uploadToken,
      file,
      request.correlationId,
    );
    return { data: record };
  }
}
