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
  Res,
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
import {
  CaseCollaborationService,
  type CaseNoteRecord,
  type CaseTaskRecord,
} from './case-collaboration.service';
import {
  CaseNoteDto,
  CaseNoteEnvelopeDto,
  CaseNoteListEnvelopeDto,
  CaseTaskDto,
  CaseTaskEnvelopeDto,
  CaseTaskListEnvelopeDto,
} from './dto/case-collaboration-response.dto';
import { CreateCaseNoteDto } from './dto/create-case-note.dto';
import { CreateCaseTaskDto } from './dto/create-case-task.dto';
import { UpdateCaseTaskDto } from './dto/update-case-task.dto';

function toCaseNoteDto(note: CaseNoteRecord): CaseNoteDto {
  return {
    id: note.id,
    complaintId: note.complaintId,
    authorUserId: note.authorUserId,
    body: note.body,
    visibility: note.visibility,
    createdAt: note.createdAt,
  };
}

function toCaseTaskDto(task: CaseTaskRecord): CaseTaskDto {
  return {
    id: task.id,
    complaintId: task.complaintId,
    assigneeUserId: task.assigneeUserId,
    createdByUserId: task.createdByUserId,
    title: task.title,
    status: task.status,
    dueAt: task.dueAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

@ApiTags('case-collaboration')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('SuperAdmin', 'CaseOfficer')
@ApiBearerAuth()
export class CaseCollaborationController {
  constructor(
    private readonly caseCollaborationService: CaseCollaborationService,
  ) {}

  @Get('complaints/:id/notes')
  @Permissions('case:read')
  @ApiOperation({ summary: 'List internal notes for a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint id' })
  @ApiOkResponse({ type: CaseNoteListEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 180, ttl: 60000 } })
  async listNotes(@Param('id') id: string): Promise<{ data: CaseNoteDto[] }> {
    const notes = await this.caseCollaborationService.listNotes(id);
    return { data: notes.map(toCaseNoteDto) };
  }

  @Post('complaints/:id/notes')
  @Permissions('case:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an internal note to a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint id' })
  @ApiCreatedResponse({ type: CaseNoteEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async createNote(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() body: CreateCaseNoteDto,
    @Req() request: RequestWithCorrelationId,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: CaseNoteDto }> {
    const note = await this.caseCollaborationService.createNote(
      id,
      user.id,
      body,
      request.correlationId,
    );
    res.setHeader('Location', `/api/v1/complaints/${id}/notes/${note.id}`);
    return { data: toCaseNoteDto(note) };
  }

  @Get('complaints/:id/tasks')
  @Permissions('case:read')
  @ApiOperation({ summary: 'List case tasks for a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint id' })
  @ApiOkResponse({ type: CaseTaskListEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 180, ttl: 60000 } })
  async listTasks(@Param('id') id: string): Promise<{ data: CaseTaskDto[] }> {
    const tasks = await this.caseCollaborationService.listTasks(id);
    return { data: tasks.map(toCaseTaskDto) };
  }

  @Post('complaints/:id/tasks')
  @Permissions('case:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a case task on a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint id' })
  @ApiCreatedResponse({ type: CaseTaskEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async createTask(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() body: CreateCaseTaskDto,
    @Req() request: RequestWithCorrelationId,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: CaseTaskDto }> {
    const task = await this.caseCollaborationService.createTask(
      id,
      user.id,
      body,
      request.correlationId,
    );
    res.setHeader('Location', `/api/v1/complaints/${id}/tasks/${task.id}`);
    return { data: toCaseTaskDto(task) };
  }

  @Patch('complaints/:id/tasks/:taskId')
  @Permissions('case:write')
  @ApiOperation({ summary: 'Update a case task' })
  @ApiParam({ name: 'id', description: 'Complaint id' })
  @ApiParam({ name: 'taskId', description: 'Case task id' })
  @ApiOkResponse({ type: CaseTaskEnvelopeDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async updateTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtUser,
    @Body() body: UpdateCaseTaskDto,
    @Req() request: RequestWithCorrelationId,
  ): Promise<{ data: CaseTaskDto }> {
    const task = await this.caseCollaborationService.updateTask(
      id,
      taskId,
      user.id,
      body,
      request.correlationId,
    );
    return { data: toCaseTaskDto(task) };
  }
}
