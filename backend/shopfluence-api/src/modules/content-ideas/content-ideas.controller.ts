import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { ContentIdeasService } from './content-ideas.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateIdeaDto {
  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  niche: string;
}

@ApiTags('Content Ideas')
@Controller('content-ideas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.AFFILIATE)
@ApiBearerAuth()
export class ContentIdeasController {
  constructor(private readonly ideasService: ContentIdeasService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate content ideas based on niche and platform',
  })
  async generate(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateIdeaDto,
  ) {
    return this.ideasService.generateIdeas(userId, dto.niche, dto.platform);
  }

  @Get()
  @ApiOperation({ summary: 'Get generated history of content ideas' })
  async getHistory(@CurrentUser('id') userId: string) {
    return this.ideasService.getHistory(userId);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save an idea' })
  async saveIdea(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ideasService.saveIdea(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an idea' })
  async removeIdea(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ideasService.removeIdea(userId, id);
  }
}
