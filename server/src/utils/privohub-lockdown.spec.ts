import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { controllers } from 'src/controllers/index.js';
import { LibraryController } from 'src/controllers/library.controller.js';
import { UserAdminController } from 'src/controllers/user-admin.controller.js';
import { defaults, mapAdminConfig } from 'src/dtos/config.dto.js';
import { AuthGuard, getAuthenticatedOptions } from 'src/middleware/auth.guard.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { AuthService } from 'src/services/auth.service.js';
import {
  PRIVOHUB_ADMIN_ROUTES,
  PRIVOHUB_BLOCKED_ROUTES,
  assertPrivohubUserAdminUpdate,
  assertPrivohubUserUpdate,
  isPrivohubRouteBlocked,
  redactAdminConfig,
  restrictAdminConfigUpdate,
} from 'src/utils/privohub-lockdown.js';
import { newTestService } from 'test/utils.js';

type Route = { route: string; admin: boolean };

const reflector = new Reflector();

const allRoutes = (): Route[] => {
  const routes: Route[] = [];
  for (const controller of controllers) {
    const prototype = controller.prototype as unknown as Record<string, unknown>;
    for (const name of Object.getOwnPropertyNames(prototype)) {
      const handler = prototype[name];
      if (name === 'constructor' || typeof handler !== 'function') {
        continue;
      }
      const options = getAuthenticatedOptions(reflector, handler as () => void);
      if (options) {
        routes.push({ route: `${controller.name}.${name}`, admin: !!options.admin });
      }
    }
  }
  return routes;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const contextFor = (controller: { name: string }, handler: Function) =>
  ({
    getClass: () => controller,
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ headers: {}, query: {}, path: '/' }) }),
  }) as unknown as ExecutionContext;

const setupGuard = () => {
  const { sut: authService, mocks } = newTestService(AuthService);
  const guard = new AuthGuard(mocks.logger as unknown as LoggingRepository, reflector, authService);
  return { guard, authService };
};

const withSecrets = () => {
  const config = mapAdminConfig(defaults);
  config.oauth.clientSecret = 'client-secret';
  config.notifications.smtp.transport.password = 'smtp-password';
  return config;
};

/**
 * Every admin route of this release, open or not. A new upstream release that adds one
 * fails here so it gets reviewed; until then the guard refuses it.
 */
const KNOWN_ADMIN_ROUTES = [
  ...PRIVOHUB_ADMIN_ROUTES,
  'AuthAdminController.unlinkAllOAuthAccountsAdmin',
  'DatabaseBackupController.deleteDatabaseBackup',
  'DatabaseBackupController.downloadDatabaseBackup',
  'DatabaseBackupController.listDatabaseBackups',
  'DatabaseBackupController.uploadDatabaseBackup',
  'IntegrityAdminController.deleteIntegrityReport',
  'IntegrityAdminController.getIntegrityReport',
  'IntegrityAdminController.getIntegrityReportCsv',
  'IntegrityAdminController.getIntegrityReportFile',
  'IntegrityAdminController.getIntegrityReportSummary',
  'LibraryController.createLibrary',
  'LibraryController.deleteLibrary',
  'LibraryController.getAllLibraries',
  'LibraryController.getLibrary',
  'LibraryController.getLibraryStatistics',
  'LibraryController.scanLibrary',
  'LibraryController.updateLibrary',
  'LibraryController.updateLibraryV3',
  'LibraryController.validate',
  'MaintenanceController.detectPriorInstall',
  'MaintenanceController.setMaintenanceMode',
  'NotificationAdminController.createNotification',
  'NotificationAdminController.getNotificationTemplateAdmin',
  'NotificationAdminController.sendTestEmailAdmin',
  'ServerController.deleteServerLicense',
  'ServerController.getServerLicense',
  'ServerController.setServerLicense',
  'SystemConfigController.getStorageTemplateOptions',
  'UserAdminController.createUserAdmin',
  'UserAdminController.updateUserPreferencesAdmin',
  'UserAdminController.updateUserPreferencesAdminV3',
];

describe('privohub lockdown', () => {
  describe('route lists', () => {
    it('knows every admin route', () => {
      const admin = allRoutes()
        .filter(({ admin }) => admin)
        .map(({ route }) => route);
      expect(admin.toSorted()).toEqual(KNOWN_ADMIN_ROUTES.toSorted());
    });

    it('lists only admin routes as open to admins', () => {
      const admin = new Set(
        allRoutes()
          .filter(({ admin }) => admin)
          .map(({ route }) => route),
      );
      for (const route of PRIVOHUB_ADMIN_ROUTES) {
        expect(admin.has(route), route).toBe(true);
      }
    });

    it('lists only routes that exist as blocked', () => {
      const routes = new Set(allRoutes().map(({ route }) => route));
      for (const route of PRIVOHUB_BLOCKED_ROUTES) {
        expect(routes.has(route), route).toBe(true);
      }
    });

    it('blocks the routes that store files or settings outside the workspace defaults', () => {
      for (const route of [
        'LibraryController.createLibrary',
        'LibraryController.scanLibrary',
        'DatabaseBackupController.uploadDatabaseBackup',
        'DatabaseBackupController.downloadDatabaseBackup',
        'MaintenanceController.setMaintenanceMode',
        'UserAdminController.createUserAdmin',
      ]) {
        const [controller, handler] = route.split('.', 2);
        expect(isPrivohubRouteBlocked(controller, handler, true), route).toBe(true);
      }
    });

    it('blocks sign-in changes for everyone', () => {
      expect(isPrivohubRouteBlocked('AuthController', 'changePassword', false)).toBe(true);
      expect(isPrivohubRouteBlocked('OAuthController', 'linkOAuthAccount', false)).toBe(true);
      expect(isPrivohubRouteBlocked('OAuthController', 'unlinkOAuthAccount', false)).toBe(true);
    });

    it('leaves other user routes alone', () => {
      expect(isPrivohubRouteBlocked('AssetController', 'getAssetInfo', false)).toBe(false);
      expect(isPrivohubRouteBlocked('UserController', 'updateMyUser', false)).toBe(false);
    });
  });

  describe('AuthGuard', () => {
    it('refuses a closed admin route before authenticating', async () => {
      const { guard, authService } = setupGuard();
      const authenticate = vitest.spyOn(authService, 'authenticate');

      await expect(
        guard.canActivate(contextFor(LibraryController, LibraryController.prototype.createLibrary)),
      ).rejects.toThrowError('not available on PrivoHub Photos');
      expect(authenticate).not.toHaveBeenCalled();
    });

    it('authenticates an open admin route as usual', async () => {
      const { guard, authService } = setupGuard();
      const authenticate = vitest.spyOn(authService, 'authenticate').mockResolvedValue({} as never);

      await expect(
        guard.canActivate(contextFor(UserAdminController, UserAdminController.prototype.searchUsersAdmin)),
      ).resolves.toBe(true);
      expect(authenticate).toHaveBeenCalled();
    });
  });

  describe('settings', () => {
    it('removes credentials from the admin view', () => {
      const config = withSecrets();
      const redacted = redactAdminConfig(config);

      expect(redacted.oauth.clientSecret).toBe('');
      expect(redacted.notifications.smtp.transport.password).toBe('');
      expect(config.oauth.clientSecret).toBe('client-secret');
    });

    it('takes only the editable keys from an update', () => {
      const current = withSecrets();
      const requested = redactAdminConfig(current);
      requested.map.enabled = !current.map.enabled;
      requested.passwordLogin.enabled = true;
      requested.oauth.issuerUrl = 'https://idp.example.com';
      requested.machineLearning.urls = ['https://ml.example.com'];

      const next = restrictAdminConfigUpdate(current, requested);

      expect(next.map.enabled).toBe(!current.map.enabled);
      expect(next.passwordLogin.enabled).toBe(current.passwordLogin.enabled);
      expect(next.oauth.issuerUrl).toBe(current.oauth.issuerUrl);
      expect(next.machineLearning.urls).toEqual(current.machineLearning.urls);
      expect(next.oauth.clientSecret).toBe('client-secret');
      expect(next.notifications.smtp.transport.password).toBe('smtp-password');
    });
  });

  describe('user updates', () => {
    it('lets an admin edit details and reset a PIN code', () => {
      expect(() => assertPrivohubUserAdminUpdate({ name: 'New name', quotaSizeInBytes: 1 })).not.toThrow();
      expect(() => assertPrivohubUserAdminUpdate({ pinCode: null })).not.toThrow();
      expect(() => assertPrivohubUserAdminUpdate({ shouldChangePassword: false })).not.toThrow();
    });

    it('refuses credentials from an admin', () => {
      expect(() => assertPrivohubUserAdminUpdate({ password: 'secret' })).toThrow();
      expect(() => assertPrivohubUserAdminUpdate({ password: '' })).toThrow();
      expect(() => assertPrivohubUserAdminUpdate({ shouldChangePassword: true })).toThrow();
      expect(() => assertPrivohubUserAdminUpdate({ pinCode: '123456' })).toThrow();
    });

    it('refuses a password on the own profile', () => {
      expect(() => assertPrivohubUserUpdate({ name: 'New name' })).not.toThrow();
      expect(() => assertPrivohubUserUpdate({ password: 'secret' })).toThrow();
    });
  });
});
