import { ConflictException, NotFoundException } from '@nestjs/common';
import { AUDIT_EVENT } from '../audit/audit-event.types';
import { ReferenceDataService } from './reference-data.service';

describe('ReferenceDataService', () => {
  let service: ReferenceDataService;

  const complaintCategory = {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };

  const orgUnit = {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };

  const logEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    logEvent.mockResolvedValue(undefined);
    service = new ReferenceDataService(
      { complaintCategory, orgUnit } as never,
      { logEvent } as never,
    );
  });

  const sampleCategoryRow = {
    id: 'cat-uuid-1',
    code: 'ROAD_INFRA',
    nameEn: 'Road Infrastructure',
    nameAm: null as string | null,
    parentId: null as string | null,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date('2026-05-12T10:00:00.000Z'),
    updatedAt: new Date('2026-05-12T10:00:00.000Z'),
  };

  const sampleOrgRow = {
    id: 'org-uuid-1',
    code: 'MOPD_HQ',
    nameEn: 'HQ',
    nameAm: null as string | null,
    parentId: null as string | null,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date('2026-05-12T10:00:00.000Z'),
    updatedAt: new Date('2026-05-12T10:00:00.000Z'),
  };

  describe('createCategory', () => {
    it('creates category and writes audit', async () => {
      complaintCategory.findUnique.mockResolvedValue(null);
      complaintCategory.create.mockResolvedValue(sampleCategoryRow);

      const dto = await service.createCategory(
        { code: 'ROAD_INFRA', nameEn: 'Road Infrastructure', sortOrder: 1 },
        'corr-1',
      );

      expect(dto.id).toBe('cat-uuid-1');
      expect(dto.code).toBe('ROAD_INFRA');
      expect(logEvent).toHaveBeenCalledWith({
        eventType: AUDIT_EVENT.CATEGORY_CREATED,
        entityType: 'complaint_category',
        entityId: 'cat-uuid-1',
        correlationId: 'corr-1',
        metadata: { code: 'ROAD_INFRA', nameEn: 'Road Infrastructure' },
      });
    });

    it('throws NotFoundException when parentId is set but parent missing', async () => {
      complaintCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.createCategory({
          code: 'CHILD',
          nameEn: 'Child',
          parentId: 'missing-parent',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(complaintCategory.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException on Prisma unique violation (P2002)', async () => {
      complaintCategory.findUnique.mockResolvedValue(null);
      complaintCategory.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.createCategory({ code: 'DUP', nameEn: 'Duplicate' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateCategory', () => {
    it('throws ConflictException when parentId equals own id', async () => {
      complaintCategory.findUniqueOrThrow.mockResolvedValue(sampleCategoryRow);

      await expect(
        service.updateCategory('cat-uuid-1', { parentId: 'cat-uuid-1' }),
      ).rejects.toThrow(ConflictException);

      expect(complaintCategory.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when new parent does not exist', async () => {
      complaintCategory.findUniqueOrThrow.mockResolvedValue(sampleCategoryRow);
      complaintCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCategory('cat-uuid-1', { parentId: 'other-missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates and audits', async () => {
      complaintCategory.findUniqueOrThrow.mockResolvedValue(sampleCategoryRow);
      complaintCategory.findUnique.mockResolvedValue({
        ...sampleCategoryRow,
        id: 'parent-1',
      });
      complaintCategory.update.mockResolvedValue({
        ...sampleCategoryRow,
        nameEn: 'Renamed',
      });

      const dto = await service.updateCategory(
        'cat-uuid-1',
        { parentId: 'parent-1', nameEn: 'Renamed' },
        'c2',
      );

      expect(dto.nameEn).toBe('Renamed');
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AUDIT_EVENT.CATEGORY_UPDATED,
          entityId: 'cat-uuid-1',
          correlationId: 'c2',
        }),
      );
    });
  });

  describe('listCategories', () => {
    it('passes activeOnly filter when true', async () => {
      complaintCategory.findMany.mockResolvedValue([]);

      await service.listCategories(true);

      expect(complaintCategory.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
      });
    });
  });

  describe('getCategoryById', () => {
    it('throws NotFoundException when missing', async () => {
      complaintCategory.findUnique.mockResolvedValue(null);

      await expect(service.getCategoryById('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createOrgUnit', () => {
    it('throws NotFoundException when parent missing', async () => {
      orgUnit.findUnique.mockResolvedValue(null);

      await expect(
        service.createOrgUnit({
          code: 'SUB_UNIT',
          nameEn: 'Sub',
          parentId: 'no-such-parent',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(orgUnit.create).not.toHaveBeenCalled();
    });

    it('maps P2002 to ConflictException', async () => {
      orgUnit.findUnique.mockResolvedValue(null);
      orgUnit.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.createOrgUnit({ code: 'DUP_ORG', nameEn: 'Dup' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates org unit and audits', async () => {
      orgUnit.findUnique.mockResolvedValue(null);
      orgUnit.create.mockResolvedValue(sampleOrgRow);

      const dto = await service.createOrgUnit(
        { code: 'MOPD_HQ', nameEn: 'HQ' },
        'c-org',
      );

      expect(dto.code).toBe('MOPD_HQ');
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AUDIT_EVENT.ORG_UNIT_CREATED,
          correlationId: 'c-org',
        }),
      );
    });
  });

  describe('updateOrgUnit', () => {
    it('throws ConflictException when parent is self', async () => {
      orgUnit.findUniqueOrThrow.mockResolvedValue(sampleOrgRow);

      await expect(
        service.updateOrgUnit('org-uuid-1', { parentId: 'org-uuid-1' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getOrgUnitById', () => {
    it('throws NotFoundException when missing', async () => {
      orgUnit.findUnique.mockResolvedValue(null);

      await expect(service.getOrgUnitById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
