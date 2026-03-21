import {
  IsString,
  IsOptional,
  IsHexColor,
  IsUrl,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertStorefrontDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  influencerId?: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  tagline?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsHexColor()
  @IsOptional()
  themeColor?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  bannerUrl?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  metaTitle?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  metaDescription?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customCss?: string;
}
