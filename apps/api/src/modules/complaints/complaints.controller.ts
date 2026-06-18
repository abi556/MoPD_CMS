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
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
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
import { ComplaintRecoveryInquiryService } from './complaint-recovery-inquiry.service';
import { ComplaintRecoveryService } from './complaint-recovery.service';
import { ComplaintsService, type ComplaintRecord } from './complaints.service';
import {
  CreateRecoveryInquiryDto,
  ListRecoveryInquiriesQueryDto,
  RecoveryInquiryCandidatesEnvelopeDto,
  RecoveryInquiryCreatedEnvelopeDto,
  RecoveryInquiryCreatedDataDto,
  RecoveryInquiryEnvelopeDto,
  RecoveryInquiryItemDto,
  RecoveryInquiryListEnvelopeDto,
  ResolveRecoveryInquiryDto,
} from './dto/recovery-inquiry.dto';
import {
  RecoveryRequestDto,
  RecoveryVerifyDto,
} from './dto/recovery-request.dto';
import {
  RecoveryVerifyDataDto,
  RecoveryVerifyEnvelopeDto,
} from './dto/recovery-response.dto';
import { getDocumentMaxBytes } from '../documents/document.config';
import type { UploadedMulterFile } from '../documents/types/uploaded-file';
import {
  DocumentEnvelopeDto,
  DocumentDto,
  DocumentListEnvelopeDto,
} from '../documents/dto/document-response.dto';
import type { DocumentRecord } from '../documents/documents.service';
import { ReferenceDataService } from '../reference-data/reference-data.service';
import {
  ComplaintFormOptionsDataDto,
  ComplaintFormOptionsEnvelopeDto,
} from './dto/complaint-form-options.dto';
import { ComplaintPriority } from './dto/update-complaint.dto';

function toDocumentDto(record: DocumentRecord): DocumentDto {
  return {
    id: record.id,
    complaintId: record.complaintId,
    ownerUserId: record.ownerUserId,
    originalName: record.originalName,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    scanStatus: record.scanStatus,
    storageKey: record.storageKey,
    scannedAt: record.scannedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

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
    priority: (complaint.priority as ComplaintPriority) ?? null,
    responseDraft: complaint.responseDraft ?? null,
  };
}

@ApiTags('complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly complaintRecoveryService: ComplaintRecoveryService,
    private readonly complaintRecoveryInquiryService: ComplaintRecoveryInquiryService,
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
        assignedToUserId: item.assignedToUserId ?? null,
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

  @Post('recovery/request')
  @ApiTags('reference-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Request OTP to recover complaint reference numbers',
    description:
      'Public self-service recovery. Always returns 204 to avoid contact enumeration. Sends a 6-digit OTP by email when matching complaints exist (SMS when RECOVERY_SMS_ENABLED=true).',
  })
  @ApiBody({ type: RecoveryRequestDto })
  @ApiNoContentResponse({
    description:
      'Request accepted. Same response whether or not the contact matches a complaint.',
  })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async requestRecovery(
    @Body() body: RecoveryRequestDto,
    @Req() request: RequestWithCorrelationId,
  ): Promise<void> {
    await this.complaintRecoveryService.requestRecovery(
      body,
      request.correlationId,
    );
  }

  @Post('recovery/verify')
  @ApiTags('reference-recovery')
  @ApiOperation({
    summary: 'Verify OTP and list complaint references for a contact',
    description:
      'Returns up to 10 reference numbers (no subject/description) after a valid OTP. Invalid codes return 400; lockout returns 429.',
  })
  @ApiBody({ type: RecoveryVerifyDto })
  @ApiOkResponse({
    description: 'OTP verified; matching complaint references returned.',
    type: RecoveryVerifyEnvelopeDto,
  })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyRecovery(
    @Body() body: RecoveryVerifyDto,
    @Req() request: RequestWithCorrelationId,
  ): Promise<{ data: RecoveryVerifyDataDto }> {
    const result = await this.complaintRecoveryService.verifyRecovery(
      body,
      request.correlationId,
    );
    return { data: result };
  }

  @Post('recovery/inquiries')
  @ApiTags('reference-recovery')
  @ApiOperation({
    summary:
      'Submit manual reference recovery inquiry (requires contact email for async staff outcome)',
    description:
      'Fallback when the citizen did not provide email or phone at submission. Creates a PENDING staff queue item; does not return a complaint reference.',
  })
  @ApiBody({ type: CreateRecoveryInquiryDto })
  @ApiCreatedResponse({
    description: 'Inquiry created.',
    type: RecoveryInquiryCreatedEnvelopeDto,
  })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 15, ttl: 3600000 } })
  async createRecoveryInquiry(
    @Body() body: CreateRecoveryInquiryDto,
    @Req() request: RequestWithCorrelationId,
  ): Promise<{ data: RecoveryInquiryCreatedDataDto }> {
    const created = await this.complaintRecoveryInquiryService.createInquiry(
      body,
      request.correlationId,
    );
    return { data: created };
  }

  @Get('recovery/inquiries')
  @ApiTags('reference-recovery')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('complaint:recovery:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reference recovery inquiries (staff)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED'],
  })
  @ApiOkResponse({ type: RecoveryInquiryListEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async listRecoveryInquiries(
    @Query() query: ListRecoveryInquiriesQueryDto,
  ): Promise<{ data: RecoveryInquiryItemDto[] }> {
    const data =
      await this.complaintRecoveryInquiryService.listInquiries(query);
    return { data };
  }

  @Get('recovery/inquiries/:id/candidates')
  @ApiTags('reference-recovery')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('complaint:recovery:manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search complaint candidates for a recovery inquiry',
    description:
      'Pre-filtered complaint search by inquiry subject fragment, optional date window (±3 days), category, and org unit.',
  })
  @ApiParam({ name: 'id', description: 'Reference recovery inquiry id' })
  @ApiOkResponse({ type: RecoveryInquiryCandidatesEnvelopeDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async recoveryInquiryCandidates(@Param('id') id: string) {
    const data =
      await this.complaintRecoveryInquiryService.searchComplaintCandidates(id);
    return { data };
  }

  @Patch('recovery/inquiries/:id')
  @ApiTags('reference-recovery')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('complaint:recovery:manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Resolve or update a reference recovery inquiry',
    description:
      'When status is RESOLVED, resolvedReferenceNo is required; emails inquiry contactEmail with the reference. REJECTED emails contactEmail with guidance to submit anew. RESOLVED with matchedComplaintId adds an internal case note.',
  })
  @ApiParam({ name: 'id', description: 'Reference recovery inquiry id' })
  @ApiBody({ type: ResolveRecoveryInquiryDto })
  @ApiOkResponse({ type: RecoveryInquiryEnvelopeDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async resolveRecoveryInquiry(
    @Param('id') id: string,
    @Body() body: ResolveRecoveryInquiryDto,
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
  ): Promise<{ data: RecoveryInquiryItemDto }> {
    const data = await this.complaintRecoveryInquiryService.resolveInquiry(
      id,
      body,
      user.id,
      request.correlationId,
    );
    return { data };
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

  @Get(':id/documents')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('complaint:read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List documents attached to a complaint',
    description:
      'Returns metadata for all documents linked to the complaint, newest first.',
  })
  @ApiParam({
    name: 'id',
    description: 'Internal complaint id.',
    example: 'cmojzpoy200006o9mjdpyn6w4',
  })
  @ApiOkResponse({
    description: 'Complaint document list for staff view.',
    type: DocumentListEnvelopeDto,
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
  async listDocuments(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<{ data: DocumentDto[] }> {
    const items = await this.complaintsService.getDocumentsForStaff(id, user);
    return { data: items.map(toDocumentDto) };
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
        ackEmailQueued: created.ackEmailQueued,
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
