import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import { AdminConfigDto, ConfigTemplateStorageOptionDto } from 'src/dtos/config.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Authenticated } from 'src/middleware/auth.guard.js';
import { StorageTemplateService } from 'src/services/storage-template.service.js';
import { SystemConfigService } from 'src/services/system-config.service.js';
import { redactAdminConfig, restrictAdminConfigUpdate } from 'src/utils/privohub-lockdown.js';

@ApiTags(ApiTag.SystemConfig)
@Controller('system-config')
export class SystemConfigController {
  constructor(
    private service: SystemConfigService,
    private storageTemplateService: StorageTemplateService,
  ) {}

  @Get()
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @Endpoint({
    summary: 'Get system configuration',
    description: 'Retrieve the current system configuration.',
    history: new HistoryBuilder()
      .added('v1')
      .beta('v1')
      .stable('v2')
      .deprecated('v3.2.0', { replacementId: 'getAdminConfig' }),
  })
  async getConfig(): Promise<AdminConfigDto> {
    return redactAdminConfig(await this.service.getAdminConfig());
  }

  @Get('defaults')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @Endpoint({
    summary: 'Get system configuration defaults',
    description: 'Retrieve the default values for the system configuration.',
    history: new HistoryBuilder()
      .added('v1')
      .beta('v1')
      .stable('v2')
      .deprecated('v3.2.0', { replacementId: 'getAdminConfigDefaults' }),
  })
  getConfigDefaults(): AdminConfigDto {
    return this.service.getAdminConfigDefaults();
  }

  @Put()
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Update system configuration',
    description: 'Update the system configuration with a new system configuration.',
    history: new HistoryBuilder()
      .added('v1')
      .beta('v1')
      .stable('v2')
      .deprecated('v3.2.0', { replacementId: 'updateAdminConfig' }),
  })
  async updateConfig(@Body() dto: AdminConfigDto): Promise<AdminConfigDto> {
    const current = await this.service.getAdminConfig();
    return redactAdminConfig(await this.service.updateAdminConfig(restrictAdminConfigUpdate(current, dto)));
  }

  @Get('storage-template-options')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @Endpoint({
    summary: 'Get storage template options',
    description: 'Retrieve exemplary storage template options.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getStorageTemplateOptions(): ConfigTemplateStorageOptionDto {
    return this.storageTemplateService.getStorageTemplateOptions();
  }
}
