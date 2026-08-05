import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { ErrorCode } from 'src/utils/error-codes';
import { MediaService } from './media.service';
import { MoveMediaDTO } from './dto/move-media.dto';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @Role([Roles.Manager, Roles.Owner])
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folderId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  upload(
    @UploadedFile() file?: Express.Multer.File,
    @Body('folderId') folderId?: string,
  ) {
    if (!file) {
      throw new BadRequestException(ErrorCode.MEDIA_FILE_REQUIRED);
    }
    return this.mediaService.upload(file, folderId);
  }

  // Global media (e.g. default category icons) is shared across every
  // tenant, so only SuperAdmin can add to it.
  @Post('global')
  @Role([Roles.SuperAdmin])
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  uploadGlobal(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(ErrorCode.MEDIA_FILE_REQUIRED);
    }
    return this.mediaService.uploadGlobal(file);
  }

  // Everything the caller's tenant uploaded, plus every global file. Pass
  // ?folderId= to look inside a folder instead of the root.
  @Get()
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  findAll(@Query('folderId', new ParseUUIDPipe({ optional: true })) folderId?: string) {
    return this.mediaService.list(folderId);
  }

  @Get(':id')
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.getById(id);
  }

  @Patch(':id/folder')
  @Role([Roles.Manager, Roles.Owner])
  moveToFolder(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveMediaDTO) {
    return this.mediaService.moveToFolder(id, dto);
  }

  @Get(':id/download')
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const result = await this.mediaService.getObjectStream(id);
    if (!result.isSuccess) {
      res.status(result.errorCode).json({ error: result.error });
      return;
    }

    const { media, stream } = result.value;
    const safeName = media.originalName.replace(/["\r\n]/g, '');

    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Content-Length', media.size);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(media.originalName)}`,
    );

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      res.on('finish', resolve);
      res.on('error', reject);
      stream.pipe(res);
    });
  }

  @Delete(':id')
  @Role([Roles.Manager, Roles.Owner])
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.remove(id);
  }

  @Delete('global/:id')
  @Role([Roles.SuperAdmin])
  removeGlobal(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.removeGlobal(id);
  }
}
