import { BadRequestException } from '@nestjs/common';
import { cloneDeep, get, set } from 'lodash-es';
import type { AdminConfigDto } from 'src/dtos/config.dto.js';
import type { UserAdminUpdateDto, UserUpdateMeDto } from 'src/dtos/user.dto.js';

/**
 * A PrivoHub Photos workspace is run by the platform: sign-in, storage, machine learning
 * and backups are managed for every workspace, and people are added and removed in the
 * PrivoHub portal. A workspace admin manages the people already in the workspace and the
 * background jobs, nothing more.
 *
 * Routes are named `Controller.handler`. An admin route that is not listed here is
 * refused, so a route added by a future upstream release stays closed until it is
 * reviewed and listed.
 */
export const PRIVOHUB_ADMIN_ROUTES: ReadonlySet<string> = new Set([
  // People in the workspace
  'UserAdminController.searchUsersAdmin',
  'UserAdminController.getUserAdmin',
  'UserAdminController.updateUserAdmin',
  'UserAdminController.updateUserAdminV3',
  'UserAdminController.deleteUserAdmin',
  'UserAdminController.restoreUserAdmin',
  'UserAdminController.getUserStatisticsAdmin',
  'UserAdminController.getUserSessionsAdmin',
  'UserAdminController.getUserPreferencesAdmin',
  'UserAdminController.getUserCalendarHeatmapAdmin',

  // Background jobs
  'QueueController.getQueues',
  'QueueController.getQueue',
  'QueueController.updateQueue',
  'QueueController.getQueueJobs',
  'QueueController.emptyQueue',
  'JobController.getQueuesLegacy',
  'JobController.createJob',
  'JobController.runQueueCommandLegacy',

  // Server statistics
  'ServerController.getServerStatistics',

  // Settings: readable with secrets removed, and only PRIVOHUB_EDITABLE_CONFIG can change
  'SystemConfigController.getConfig',
  'SystemConfigController.getConfigDefaults',
  'SystemConfigController.updateConfig',
  'ConfigAdminController.getAdminConfig',
  'ConfigAdminController.getAdminConfigDefaults',
  'ConfigAdminController.updateAdminConfig',

  // First-login onboarding
  'SystemMetadataController.getAdminOnboarding',
  'SystemMetadataController.updateAdminOnboarding',
  'SystemMetadataController.getReverseGeocodingState',
  'SystemMetadataController.getVersionCheckState',
]);

/** Routes refused for everyone. Sign-in is managed by the PrivoHub account. */
export const PRIVOHUB_BLOCKED_ROUTES: ReadonlySet<string> = new Set([
  'AuthController.changePassword',
  'OAuthController.linkOAuthAccount',
  'OAuthController.unlinkOAuthAccount',
]);

export const isPrivohubRouteBlocked = (controller: string, handler: string, adminRoute: boolean): boolean => {
  const route = `${controller}.${handler}`;
  return PRIVOHUB_BLOCKED_ROUTES.has(route) || (adminRoute && !PRIVOHUB_ADMIN_ROUTES.has(route));
};

/** The only settings a workspace admin can change (offered during onboarding). */
export const PRIVOHUB_EDITABLE_CONFIG = ['map.enabled'] as const;

const SECRET_CONFIG = ['oauth.clientSecret', 'notifications.smtp.transport.password'] as const;

/** The admin view of the settings, without credentials. */
export const redactAdminConfig = (config: AdminConfigDto): AdminConfigDto => {
  const redacted = cloneDeep(config);
  for (const path of SECRET_CONFIG) {
    if (get(redacted, path) !== undefined) {
      set(redacted, path, '');
    }
  }
  return redacted;
};

/**
 * The settings to save for an admin update: the current settings with only the editable
 * keys taken from the request. Everything else in the request is ignored, which also
 * keeps the redacted secrets the client was shown from being written back.
 */
export const restrictAdminConfigUpdate = (current: AdminConfigDto, requested: AdminConfigDto): AdminConfigDto => {
  const next = cloneDeep(current);
  for (const path of PRIVOHUB_EDITABLE_CONFIG) {
    const value = get(requested, path);
    if (value !== undefined) {
      set(next, path, value);
    }
  }
  return next;
};

/** An admin may edit a person's details and clear their PIN code, not set credentials. */
export const assertPrivohubUserAdminUpdate = (dto: UserAdminUpdateDto): void => {
  if (dto.password !== undefined || dto.shouldChangePassword) {
    throw new BadRequestException('Passwords are managed by the PrivoHub account');
  }
  if (dto.pinCode !== undefined && dto.pinCode !== null) {
    throw new BadRequestException('A PIN code can only be reset, not set, by an admin');
  }
};

export const assertPrivohubUserUpdate = (dto: UserUpdateMeDto): void => {
  if (dto.password !== undefined) {
    throw new BadRequestException('Passwords are managed by the PrivoHub account');
  }
};
