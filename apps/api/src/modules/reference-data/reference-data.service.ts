import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENT } from '../audit/audit-event.types';
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

@Injectable()
export class ReferenceDataService {
  private readonly logger = new Logger(ReferenceDataService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // ComplaintCategory
  // ---------------------------------------------------------------------------

  async createCategory(
    dto: CreateCategoryDto,
    correlationId?: string,
  ): Promise<CategoryResponseDto> {
    if (dto.parentId) {
      const parent = await this.prisma.complaintCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category ${dto.parentId} not found`,
        );
      }
    }

    try {
      const cat = await this.prisma.complaintCategory.create({
        data: {
          code: dto.code,
          nameEn: dto.nameEn,
          nameAm: dto.nameAm ?? null,
          parentId: dto.parentId ?? null,
          sortOrder: dto.sortOrder ?? 0,
        },
      });

      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.CATEGORY_CREATED,
        entityType: 'complaint_category',
        entityId: cat.id,
        correlationId,
        metadata: { code: cat.code, nameEn: cat.nameEn },
      });

      return this.toCategoryDto(cat);
    } catch (err: unknown) {
      if (this.isPrismaUniqueError(err)) {
        throw new ConflictException(
          `Category with code "${dto.code}" already exists`,
        );
      }
      throw err;
    }
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
    correlationId?: string,
  ): Promise<CategoryResponseDto> {
    await this.prisma.complaintCategory.findUniqueOrThrow({
      where: { id },
    });

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw new ConflictException('A category cannot be its own parent');
      }
      const parent = await this.prisma.complaintCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category ${dto.parentId} not found`,
        );
      }
    }

    const updated = await this.prisma.complaintCategory.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.nameAm !== undefined && { nameAm: dto.nameAm }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.CATEGORY_UPDATED,
      entityType: 'complaint_category',
      entityId: id,
      correlationId,
      metadata: { code: updated.code },
    });

    return this.toCategoryDto(updated);
  }

  async listCategories(activeOnly = false): Promise<CategoryResponseDto[]> {
    const where = activeOnly ? { isActive: true } : {};
    const rows = await this.prisma.complaintCategory.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
    return rows.map((r) => this.toCategoryDto(r));
  }

  async getCategoryById(id: string): Promise<CategoryResponseDto> {
    const cat = await this.prisma.complaintCategory.findUnique({
      where: { id },
    });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return this.toCategoryDto(cat);
  }

  // ---------------------------------------------------------------------------
  // OrgUnit
  // ---------------------------------------------------------------------------

  async createOrgUnit(
    dto: CreateOrgUnitDto,
    correlationId?: string,
  ): Promise<OrgUnitResponseDto> {
    if (dto.parentId) {
      const parent = await this.prisma.orgUnit.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent org unit ${dto.parentId} not found`,
        );
      }
    }

    try {
      const unit = await this.prisma.orgUnit.create({
        data: {
          code: dto.code,
          nameEn: dto.nameEn,
          nameAm: dto.nameAm ?? null,
          parentId: dto.parentId ?? null,
          sortOrder: dto.sortOrder ?? 0,
        },
      });

      await this.auditService.logEvent({
        eventType: AUDIT_EVENT.ORG_UNIT_CREATED,
        entityType: 'org_unit',
        entityId: unit.id,
        correlationId,
        metadata: { code: unit.code, nameEn: unit.nameEn },
      });

      return this.toOrgUnitDto(unit);
    } catch (err: unknown) {
      if (this.isPrismaUniqueError(err)) {
        throw new ConflictException(
          `Org unit with code "${dto.code}" already exists`,
        );
      }
      throw err;
    }
  }

  async updateOrgUnit(
    id: string,
    dto: UpdateOrgUnitDto,
    correlationId?: string,
  ): Promise<OrgUnitResponseDto> {
    await this.prisma.orgUnit.findUniqueOrThrow({ where: { id } });

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw new ConflictException('An org unit cannot be its own parent');
      }
      const parent = await this.prisma.orgUnit.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent org unit ${dto.parentId} not found`,
        );
      }
    }

    const updated = await this.prisma.orgUnit.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.nameAm !== undefined && { nameAm: dto.nameAm }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    await this.auditService.logEvent({
      eventType: AUDIT_EVENT.ORG_UNIT_UPDATED,
      entityType: 'org_unit',
      entityId: id,
      correlationId,
      metadata: { code: updated.code },
    });

    return this.toOrgUnitDto(updated);
  }

  async listOrgUnits(activeOnly = false): Promise<OrgUnitResponseDto[]> {
    const where = activeOnly ? { isActive: true } : {};
    const rows = await this.prisma.orgUnit.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
    return rows.map((r) => this.toOrgUnitDto(r));
  }

  async getOrgUnitById(id: string): Promise<OrgUnitResponseDto> {
    const unit = await this.prisma.orgUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException(`Org unit ${id} not found`);
    return this.toOrgUnitDto(unit);
  }

  // ---------------------------------------------------------------------------
  // Seed data
  // ---------------------------------------------------------------------------

  async ensureSeedCategories(): Promise<void> {
    const defaults: Array<{
      code: string;
      nameEn: string;
      nameAm: string;
      sortOrder: number;
    }> = [
      {
        code: 'ROAD_INFRA',
        nameEn: 'Road Infrastructure',
        nameAm: 'የመንገድ መሠረተ ልማት',
        sortOrder: 1,
      },
      {
        code: 'WATER_SUPPLY',
        nameEn: 'Water Supply',
        nameAm: 'የውሃ አቅርቦት',
        sortOrder: 2,
      },
      {
        code: 'ELECTRICITY',
        nameEn: 'Electricity',
        nameAm: 'ኤሌክትሪክ',
        sortOrder: 3,
      },
      {
        code: 'PUBLIC_HEALTH',
        nameEn: 'Public Health',
        nameAm: 'የህብረተሰብ ጤና',
        sortOrder: 4,
      },
      { code: 'EDUCATION', nameEn: 'Education', nameAm: 'ትምህርት', sortOrder: 5 },
      {
        code: 'PUBLIC_SAFETY',
        nameEn: 'Public Safety',
        nameAm: 'የህዝብ ደህንነት',
        sortOrder: 6,
      },
      {
        code: 'LAND_HOUSING',
        nameEn: 'Land & Housing',
        nameAm: 'መሬት እና ቤት',
        sortOrder: 7,
      },
      {
        code: 'GOVT_SERVICE',
        nameEn: 'Government Service Delivery',
        nameAm: 'የመንግስት አገልግሎት አሰጣጥ',
        sortOrder: 8,
      },
      {
        code: 'CORRUPTION',
        nameEn: 'Corruption & Misconduct',
        nameAm: 'ሙስና እና ብልሹ ተግባር',
        sortOrder: 9,
      },
      { code: 'OTHER', nameEn: 'Other', nameAm: 'ሌላ', sortOrder: 99 },
    ];

    for (const cat of defaults) {
      const existing = await this.prisma.complaintCategory.findUnique({
        where: { code: cat.code },
      });
      if (!existing) {
        await this.prisma.complaintCategory.create({
          data: {
            code: cat.code,
            nameEn: cat.nameEn,
            nameAm: cat.nameAm,
            sortOrder: cat.sortOrder,
          },
        });
      }
    }

    this.logger.log('Seed categories ensured');
  }

  async ensureSeedOrgUnits(): Promise<void> {
    const defaults: Array<{
      code: string;
      nameEn: string;
      nameAm: string;
      sortOrder: number;
    }> = [
      {
        code: 'MOPD_HQ',
        nameEn: 'MoPD Headquarters',
        nameAm: 'ብልፅግና ዋና መስሪያ ቤት',
        sortOrder: 1,
      },
      {
        code: 'DIR_COMPLAINTS',
        nameEn: 'Complaints Directorate',
        nameAm: 'የቅሬታ ዳይሬክቶሬት',
        sortOrder: 2,
      },
      {
        code: 'DIR_MONITORING',
        nameEn: 'Monitoring & Evaluation',
        nameAm: 'ክትትል እና ግምገማ',
        sortOrder: 3,
      },
      {
        code: 'DIR_LEGAL',
        nameEn: 'Legal Affairs',
        nameAm: 'የሕግ ጉዳዮች',
        sortOrder: 4,
      },
      {
        code: 'DIR_ICT',
        nameEn: 'ICT Directorate',
        nameAm: 'የአይሲቲ ዳይሬክቶሬት',
        sortOrder: 5,
      },
    ];

    for (const unit of defaults) {
      const existing = await this.prisma.orgUnit.findUnique({
        where: { code: unit.code },
      });
      if (!existing) {
        await this.prisma.orgUnit.create({
          data: {
            code: unit.code,
            nameEn: unit.nameEn,
            nameAm: unit.nameAm,
            sortOrder: unit.sortOrder,
          },
        });
      }
    }

    this.logger.log('Seed org units ensured');
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private toCategoryDto(cat: {
    id: string;
    code: string;
    nameEn: string;
    nameAm: string | null;
    parentId: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
  }): CategoryResponseDto {
    return {
      id: cat.id,
      code: cat.code,
      nameEn: cat.nameEn,
      nameAm: cat.nameAm,
      parentId: cat.parentId,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
      createdAt: cat.createdAt.toISOString(),
    };
  }

  private toOrgUnitDto(unit: {
    id: string;
    code: string;
    nameEn: string;
    nameAm: string | null;
    parentId: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
  }): OrgUnitResponseDto {
    return {
      id: unit.id,
      code: unit.code,
      nameEn: unit.nameEn,
      nameAm: unit.nameAm,
      parentId: unit.parentId,
      isActive: unit.isActive,
      sortOrder: unit.sortOrder,
      createdAt: unit.createdAt.toISOString(),
    };
  }

  private isPrismaUniqueError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    );
  }
}
