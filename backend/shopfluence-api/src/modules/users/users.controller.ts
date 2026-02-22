import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    Patch,
    Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    async getMe(@CurrentUser('id') userId: string) {
        return this.usersService.getProfile(userId);
    }

    @Patch('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    async updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(userId, dto);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all users (Admin)' })
    async findAll(@Query() query: PaginationDto) {
        return this.usersService.findAll(query);
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user by ID (Admin)' })
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }
}
