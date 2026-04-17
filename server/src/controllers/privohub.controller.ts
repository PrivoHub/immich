import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/schema';

@ApiExcludeController()
@Controller('privohub')
export class PrivohubController {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @Get('quota')
  async getQuota() {
    const quotaGb = Number(process.env.PRIVOHUB_QUOTA_GB ?? 0);

    const result = await this.db
      .selectFrom('asset_exif')
      .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
      .where('asset.libraryId', 'is', null)
      .select((eb) => eb.fn.coalesce(eb.fn.sum<number>('asset_exif.fileSizeInByte'), eb.lit(0)).as('usedBytes'))
      .executeTakeFirstOrThrow();

    return {
      quota_gb: quotaGb,
      used_bytes: Number(result.usedBytes),
    };
  }
}
