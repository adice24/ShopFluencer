import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecureP@ss123', minLength: 8 })
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName: string;

    @ApiPropertyOptional({ enum: UserRole, default: UserRole.CUSTOMER })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}
