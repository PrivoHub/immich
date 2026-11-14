import request from 'supertest';
import { MaintenanceController } from 'src/controllers/maintenance.controller.js';
import { MaintenanceAction } from 'src/enum.js';
import { MaintenanceService } from 'src/services/maintenance.service.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

describe(MaintenanceController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(MaintenanceService);

  beforeAll(async () => {
    ctx = await controllerSetup(MaintenanceController, [{ provide: MaintenanceService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /admin/maintenance', () => {
    it('should be refused', async () => {
      const { status } = await request(ctx.getHttpServer()).post('/admin/maintenance').send({
        action: MaintenanceAction.RestoreDatabase,
      });
      expect(status).toBe(403);
      expect(ctx.authenticate).not.toHaveBeenCalled();
    });
  });
});
