import { ComplaintDashboardService } from './complaint-dashboard.service';

describe('ComplaintDashboardService', () => {
  const complaintGroupBy = jest.fn();
  const categoryFindMany = jest.fn();
  const historyFindMany = jest.fn();
  const buildListScopeFilter = jest.fn().mockReturnValue({});

  const mockPrisma = {
    complaint: { groupBy: complaintGroupBy },
    complaintCategory: { findMany: categoryFindMany },
    complaintHistory: { findMany: historyFindMany },
  };

  let service: ComplaintDashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    buildListScopeFilter.mockReturnValue({});
    service = new ComplaintDashboardService(
      mockPrisma as never,
      { buildListScopeFilter } as never,
    );
  });

  describe('getTopCategories', () => {
    it('returns ranked categories with counts', async () => {
      complaintGroupBy.mockResolvedValue([
        { categoryId: 'cat-1', _count: { _all: 12 } },
        { categoryId: 'cat-2', _count: { _all: 5 } },
      ]);
      categoryFindMany.mockResolvedValue([
        {
          id: 'cat-1',
          code: 'LAND',
          nameEn: 'Land',
          nameAm: 'መሬት',
        },
        {
          id: 'cat-2',
          code: 'PROC',
          nameEn: 'Procurement',
          nameAm: null,
        },
      ]);

      const result = await service.getTopCategories(
        { id: 'user-1', permissions: ['complaint:read'] } as never,
        30,
        5,
      );

      expect(result.days).toBe(30);
      expect(result.categories).toEqual([
        {
          categoryId: 'cat-1',
          code: 'LAND',
          nameEn: 'Land',
          nameAm: 'መሬት',
          count: 12,
        },
        {
          categoryId: 'cat-2',
          code: 'PROC',
          nameEn: 'Procurement',
          nameAm: null,
          count: 5,
        },
      ]);
    });

    it('returns empty list when no categorized complaints exist', async () => {
      complaintGroupBy.mockResolvedValue([]);

      const result = await service.getTopCategories(
        { id: 'user-1', permissions: ['complaint:read'] } as never,
      );

      expect(result.categories).toEqual([]);
      expect(categoryFindMany).not.toHaveBeenCalled();
    });
  });

  describe('getRecentQueueActivity', () => {
    it('returns recent triage and assignment events', async () => {
      historyFindMany.mockResolvedValue([
        {
          id: 'hist-1',
          action: 'ASSIGNED',
          fromStatus: 'TRIAGE',
          toStatus: 'ASSIGNED',
          createdAt: new Date('2026-06-18T10:00:00.000Z'),
          complaint: {
            id: 'cmp-1',
            referenceNo: 'REF-001',
            subject: 'Road damage',
          },
        },
      ]);

      const result = await service.getRecentQueueActivity(
        { id: 'user-1', permissions: ['complaint:read'] } as never,
        10,
      );

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        referenceNo: 'REF-001',
        action: 'ASSIGNED',
        toStatus: 'ASSIGNED',
      });
      expect(historyFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });
});
