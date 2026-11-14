import request from 'supertest';
import { UserAdminController } from 'src/controllers/user-admin.controller.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { UserAdminService } from 'src/services/user-admin.service.js';
import { errorDto } from 'test/medium/responses.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, automock, controllerSetup, mockBaseService } from 'test/utils.js';

describe(UserAdminController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(UserAdminService);

  beforeAll(async () => {
    ctx = await controllerSetup(UserAdminController, [
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
      { provide: UserAdminService, useValue: service },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /admin/users', () => {
    it('is not available, people are added in the PrivoHub portal', async () => {
      const { status } = await request(ctx.getHttpServer())
        .post(`/admin/users`)
        .send({ name: 'Test user', email: 'test@immich.cloud', password: 'password' });
      expect(status).toBe(403);
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /admin/users/:id', () => {
    it(`should not allow decimal quota`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/admin/users/${factory.uuid()}`)
        .set('Authorization', `Bearer token`)
        .send({ quotaSizeInBytes: 1.2 });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([
          { path: ['quotaSizeInBytes'], message: 'Invalid input: expected int, received number' },
        ]),
      );
    });

    it('should allow a null pinCode', async () => {
      const id = factory.uuid();
      await request(ctx.getHttpServer()).put(`/admin/users/${id}`).send({ pinCode: null });
      expect(service.update).toHaveBeenCalledWith(undefined, id, expect.objectContaining({ pinCode: null }));
    });

    it('should refuse a password', async () => {
      const { status } = await request(ctx.getHttpServer())
        .put(`/admin/users/${factory.uuid()}`)
        .send({ password: 'password' });
      expect(status).toBe(400);
      expect(service.update).not.toHaveBeenCalled();
    });

    it('should refuse setting a pinCode', async () => {
      const { status } = await request(ctx.getHttpServer())
        .patch(`/admin/users/${factory.uuid()}`)
        .send({ pinCode: '123456' });
      expect(status).toBe(400);
      expect(service.update).not.toHaveBeenCalled();
    });

    it('should allow a null avatarColor', async () => {
      const id = factory.uuid();
      await request(ctx.getHttpServer()).put(`/admin/users/${id}`).send({ avatarColor: null });
      expect(service.update).toHaveBeenCalledWith(undefined, id, expect.objectContaining({ avatarColor: null }));
    });

    for (const [key, message] of [
      ['password', 'Invalid input: expected string, received null'],
      ['email', 'Invalid input: expected email, received object'],
      ['name', 'Invalid input: expected string, received null'],
      ['shouldChangePassword', 'Invalid input: expected boolean, received null'],
    ] as const) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(ctx.getHttpServer())
          .put(`/admin/users/${factory.uuid()}`)
          .set('Authorization', `Bearer token`)
          .send({ [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.validationError([{ path: [key], message }]));
      });
    }
  });
});
