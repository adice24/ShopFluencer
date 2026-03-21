import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LinksService } from './links.service';

export class CreateShortLinkDto {
  @IsUrl({}, { message: 'Destination must be a valid URL' })
  @IsNotEmpty()
  originalUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;
}

@ApiTags('Links')
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  // ── Authenticated Routes ─────────────────────────────────────
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.AFFILIATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new short link' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateShortLinkDto,
  ) {
    const link = await this.linksService.createShortLink(userId, dto);
    return {
      message: 'Short link created',
      data: link,
    };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.AFFILIATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all links for the current affiliate' })
  async getMyLinks(@CurrentUser('id') userId: string) {
    const links = await this.linksService.getUserLinks(userId);
    return { data: links };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.AFFILIATE)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a short link' })
  async deleteLink(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.linksService.deleteLink(userId, id);
  }
}

// ── Public Redirect Controller (separate prefix) ─────────────────
@ApiTags('Public Redirect')
@Controller('r')
export class PublicRedirectController {
  constructor(private readonly linksService: LinksService) {}

  @Get(':shortCode')
  @ApiOperation({
    summary: 'Resolve short link and 302 redirect to destination',
  })
  async redirect(
    @Param('shortCode') shortCode: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '';
    const userAgent = req.headers['user-agent'] || '';
    const referrer = (req.headers['referer'] as string) || '';

    const destinationUrl = await this.linksService.recordClick(shortCode, {
      ipAddress: ip,
      userAgent,
      referrer,
    });

    return res.redirect(302, destinationUrl);
  }

  @Get('resolve/:shortCode')
  @ApiOperation({
    summary: 'Resolve short link and return destination URL as JSON',
  })
  async resolveJson(
    @Param('shortCode') shortCode: string,
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '';
    const userAgent = req.headers['user-agent'] || '';
    const referrer = (req.headers['referer'] as string) || '';

    const destinationUrl = await this.linksService.recordClick(shortCode, {
      ipAddress: ip,
      userAgent,
      referrer,
    });

    return { originalUrl: destinationUrl };
  }
}
