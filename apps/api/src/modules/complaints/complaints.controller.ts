import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
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
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ComplaintCreatedDataDto,
  ComplaintCreatedEnvelopeDto,
  ComplaintListEnvelopeDto,
  ComplaintListItemDto,
  ComplaintListMetaDto,
  ComplaintTrackingDataDto,
  ComplaintTrackingEnvelopeDto,
} from './dto/complaint-response.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { ListComplaintsQueryDto } from './dto/list-complaints.dto';
import { ComplaintsService } from './complaints.service';

@ApiTags('complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'CaseOfficer')
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
  ): Promise<{ data: ComplaintCreatedDataDto }> {
    const created = await this.complaintsService.create(body);

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
