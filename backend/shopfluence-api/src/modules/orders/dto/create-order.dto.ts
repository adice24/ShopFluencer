import { IsString, IsEmail, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsUUID, Min, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
    @ApiProperty()
    @IsUUID()
    productId: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    variantId?: string;

    @ApiProperty()
    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @ApiProperty({ type: [CreateOrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    shippingName: string;

    @ApiProperty()
    @IsEmail()
    shippingEmail: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    shippingPhone: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    shippingAddress: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    shippingCity: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    shippingState: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    shippingZip: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @MaxLength(2)
    shippingCountry?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    influencerId?: string;
}
