import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationMaintenanceService } from './notification-maintenance.service';

describe('NotificationMaintenanceService', () => {
  let service: NotificationMaintenanceService;
  const userFindMany = jest.fn();
  const userUpdate = jest.fn();
  const notify = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    userFindMany.mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]);
    notify.mockResolvedValue({ id: 'n1' });
    userUpdate.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationMaintenanceService,
        {
          provide: PrismaService,
          useValue: {
            user: { findMany: userFindMany, update: userUpdate },
          },
        },
        {
          provide: InAppNotificationService,
          useValue: { notify },
        },
      ],
    }).compile();

    service = module.get(NotificationMaintenanceService);
  });

  it('sends weekly MFA reminders to users without MFA', async () => {
    const result = await service.sendWeeklyMfaReminders();
    expect(result.sent).toBe(2);
    expect(notify).toHaveBeenCalledTimes(2);
    expect(userUpdate).toHaveBeenCalledTimes(2);
  });
});
