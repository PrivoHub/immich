import request from 'supertest';
import { LibraryController } from 'src/controllers/library.controller.js';
import { LibraryService } from 'src/services/library.service.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

// External libraries are not available on PrivoHub Photos: every route is refused before
// validation (see src/utils/privohub-lockdown.ts).
describe(LibraryController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(LibraryService);

  beforeAll(async () => {
    ctx = await controllerSetup(LibraryController, [{ provide: LibraryService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  const id = factory.uuid();

  for (const [method, url] of [
    ['get', '/libraries'],
    ['post', '/libraries'],
    ['get', `/libraries/${id}`],
    ['put', `/libraries/${id}`],
    ['patch', `/libraries/${id}`],
    ['delete', `/libraries/${id}`],
    ['post', `/libraries/${id}/validate`],
    ['get', `/libraries/${id}/statistics`],
    ['post', `/libraries/${id}/scan`],
  ] as const) {
    it(`should refuse ${method.toUpperCase()} ${url.replace(id, ':id')}`, async () => {
      const { status } = await request(ctx.getHttpServer())
        [method](url)
        .send({ ownerId: id, importPaths: ['/usr'] });
      expect(status).toBe(403);
      expect(ctx.authenticate).not.toHaveBeenCalled();
    });
  }
});
