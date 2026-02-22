import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    displayName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUrl()
    avatarUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUrl()
    websiteUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    instagramHandle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    youtubeHandle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tiktokHandle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    twitterHandle?: string;
}
