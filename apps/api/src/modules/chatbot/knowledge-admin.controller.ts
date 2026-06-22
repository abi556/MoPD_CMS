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
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ChatAnalyticsDaily, KnowledgeArticle } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KnowledgeAdminService } from './knowledge-admin.service';
import {
  CreateKnowledgeArticleDto,
  KnowledgeArticleListQueryDto,
  UpdateKnowledgeArticleDto,
} from './dto/knowledge-article.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/knowledge')
export class KnowledgeAdminController {
  constructor(private readonly knowledgeAdmin: KnowledgeAdminService) {}

  @Get('articles')
  @Throttle({ default: { ttl: 60000, limit: 120 } })
  @Permissions('knowledge:manage')
  @ApiOperation({ summary: 'List knowledge base articles' })
  @ApiOkResponse({ description: 'Article list' })
  list(
    @Query() query: KnowledgeArticleListQueryDto,
  ): Promise<KnowledgeArticle[]> {
    return this.knowledgeAdmin.list(query);
  }

  @Post('articles')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Permissions('knowledge:manage')
  @ApiOperation({ summary: 'Create knowledge article (draft)' })
  @ApiCreatedResponse({ description: 'Article created' })
  create(
    @Body() dto: CreateKnowledgeArticleDto,
    @CurrentUser() user: JwtUser,
  ): Promise<KnowledgeArticle> {
    return this.knowledgeAdmin.create(dto, user.id);
  }

  @Patch('articles/:id')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Permissions('knowledge:manage')
  @ApiOperation({ summary: 'Update knowledge article' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeArticleDto,
    @CurrentUser() user: JwtUser,
  ): Promise<KnowledgeArticle> {
    return this.knowledgeAdmin.update(id, dto, user.id);
  }

  @Post('articles/:id/publish')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Permissions('knowledge:manage')
  @ApiOperation({ summary: 'Publish article and trigger re-index' })
  publish(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<KnowledgeArticle> {
    return this.knowledgeAdmin.publish(id, user.id);
  }

  @Post('articles/:id/reindex')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Permissions('knowledge:manage')
  @ApiOperation({ summary: 'Manually rebuild article embeddings' })
  reindex(
    @Param('id') id: string,
  ): Promise<{ queued: true; articleId: string }> {
    return this.knowledgeAdmin.reindex(id);
  }

  @Get('analytics')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Permissions('chatbot:analytics:read')
  @ApiOperation({ summary: 'Chatbot daily analytics' })
  analytics(): Promise<ChatAnalyticsDaily[]> {
    return this.knowledgeAdmin.listAnalytics();
  }
}
