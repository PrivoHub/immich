import { SemVer } from 'semver';
import { serverVersion } from 'src/constants';
import { JobStatus } from 'src/enum';
import { VersionService } from 'src/services/version.service';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(VersionService.name, () => {
  let sut: VersionService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(VersionService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should record a new version', async () => {
      mocks.versionHistory.getAll.mockResolvedValue([]);
      mocks.versionHistory.getLatest.mockResolvedValue(void 0);
      mocks.versionHistory.create.mockResolvedValue(factory.versionHistory());

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.versionHistory.create).toHaveBeenCalledWith({ version: expect.any(String) });
    });

    it('should skip a duplicate version', async () => {
      mocks.versionHistory.getLatest.mockResolvedValue({
        id: 'version-1',
        createdAt: new Date(),
        version: serverVersion.toString(),
      });
      await expect(sut.onBootstrap()).resolves.toBeUndefined();
      expect(mocks.versionHistory.create).not.toHaveBeenCalled();
    });

    it('should not schedule a version check cron job', async () => {
      mocks.versionHistory.getLatest.mockResolvedValue({
        id: 'version-1',
        createdAt: new Date(),
        version: serverVersion.toString(),
      });
      await sut.onBootstrap();
      expect(mocks.cron.create).not.toHaveBeenCalled();
    });
  });

  describe('getVersion', () => {
    it('should respond the server version', () => {
      expect(sut.getVersion()).toEqual({
        major: serverVersion.major,
        minor: serverVersion.minor,
        patch: serverVersion.patch,
      });
    });
  });

  describe('getVersionHistory', () => {
    it('should respond the server version history', async () => {
      const upgrade = { id: 'upgrade-1', createdAt: new Date(), version: '1.0.0' };
      mocks.versionHistory.getAll.mockResolvedValue([upgrade]);
      await expect(sut.getVersionHistory()).resolves.toEqual([upgrade]);
    });
  });

  describe('handleVersionCheck', () => {
    it('should never contact the upstream release server', async () => {
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.Skipped);
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
      expect(mocks.websocket.clientBroadcast).not.toHaveBeenCalled();
    });
  });

  describe('onWebsocketConnection', () => {
    it('should send on_server_version client event', () => {
      sut.onWebsocketConnection({ userId: '42' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_server_version', '42', expect.any(SemVer));
      expect(mocks.websocket.clientSend).toHaveBeenCalledTimes(1);
    });
  });
});
