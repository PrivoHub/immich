import request from 'supertest';
import { NotificationAdminController } from 'src/controllers/notification-admin.controller.js';
import { NotificationAdminService } from 'src/services/notification-admin.service.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

describe(NotificationAdminController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(NotificationAdminService);

  beforeAll(async () => {
    ctx = await controllerSetup(NotificationAdminController, [
      { provide: NotificationAdminService, useValue: service },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /admin/notifications', () => {
    it('should be refused', async () => {
      const { status } = await request(ctx.getHttpServer())
        .post(`/admin/notifications`)
        .send({ title: 'Test', userId: factory.uuid(), readAt: null });
      expect(status).toBe(403);
      expect(service.create).not.toHaveBeenCalled();
    });
  });
});
