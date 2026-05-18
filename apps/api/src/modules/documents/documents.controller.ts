import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { RequestWithCorrelationId } from '../../common/middleware/correlation-id.middleware';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { getDocumentMaxBytes } from './document.config';
import { DocumentsService } from './documents.service';
import {
  DocumentDownloadEnvelopeDto,
  DocumentDto,
  DocumentEnvelopeDto,
} from './dto/document-response.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

function toDocumentDto(
  record: Awaited<ReturnType<DocumentsService['getMetadata']>>,
): DocumentDto {
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

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('SuperAdmin', 'CaseOfficer')
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @Permissions('document:upload', 'complaints:detail')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: getDocumentMaxBytes() },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a complaint attachment (quarantine + scan)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'complaintId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        complaintId: {
          type: 'string',
          format: 'uuid',
          example: 'cmojzpoy200006o9mjdpyn6w4',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: DocumentEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadDocumentDto,
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: DocumentDto }> {
    const record = await this.documentsService.upload(
      body.complaintId,
      user.id,
      file,
      request.correlationId,
    );
    res.setHeader('Location', `/api/v1/documents/${record.id}`);
    return { data: toDocumentDto(record) };
  }

  @Get(':id')
  @Permissions('document:read', 'complaints:detail')
  @ApiOperation({ summary: 'Get document metadata' })
  @ApiParam({ name: 'id', description: 'Document id' })
  @ApiOkResponse({ type: DocumentEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 180, ttl: 60000 } })
  async getMetadata(@Param('id') id: string): Promise<{ data: DocumentDto }> {
    const record = await this.documentsService.getMetadata(id);
    return { data: toDocumentDto(record) };
  }

  @Get(':id/download')
  @Permissions('document:read', 'complaints:detail')
  @ApiOperation({ summary: 'Get pre-signed download URL for a clean document' })
  @ApiParam({ name: 'id', description: 'Document id' })
  @ApiOkResponse({ type: DocumentDownloadEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
  ): Promise<DocumentDownloadEnvelopeDto> {
    const signed = await this.documentsService.getDownloadUrl(
      id,
      user.id,
      request.correlationId,
    );
    return { data: signed };
  }

  @Delete(':id')
  @Permissions('document:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'id', description: 'Document id' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Req() request: RequestWithCorrelationId,
  ): Promise<void> {
    await this.documentsService.delete(id, user.id, request.correlationId);
  }
}
