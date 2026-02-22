import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { UserRole, UserStatus } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                avatarUrl: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                influencerProfile: true,
            },
        });

        if (!user || user.status === UserStatus.INACTIVE) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
    }

    async findAll(query: PaginationDto & { role?: UserRole; status?: UserStatus }) {
        const where: any = { deletedAt: null };
        if (query.role) where.role = query.role;
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
                skip: query.skip,
                take: query.take,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    avatarUrl: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return paginate(data, total, query.page || 1, query.limit || 20);
    }

    async updateStatus(id: string, status: UserStatus) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { status },
        });

        this.logger.log(`User ${id} status updated to ${status}`);
        return user;
    }

    async softDelete(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
        });
    }

    async getProfile(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                influencerProfile: {
                    include: {
                        storefront: true,
                        brandAssignments: { include: { brand: true } },
                    },
                },
            },
        });
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { influencerProfile: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prepare User Model Updates
        const userUpdates: any = {};
        if (dto.firstName !== undefined) userUpdates.firstName = dto.firstName;
        if (dto.lastName !== undefined) userUpdates.lastName = dto.lastName;
        if (dto.avatarUrl !== undefined) userUpdates.avatarUrl = dto.avatarUrl;

        // Prepare Influencer Profile Updates
        const influencerUpdates: any = {};
        if (dto.displayName !== undefined) influencerUpdates.displayName = dto.displayName;
        if (dto.bio !== undefined) influencerUpdates.bio = dto.bio;
        if (dto.websiteUrl !== undefined) influencerUpdates.websiteUrl = dto.websiteUrl;
        if (dto.instagramHandle !== undefined) influencerUpdates.instagramHandle = dto.instagramHandle;
        if (dto.youtubeHandle !== undefined) influencerUpdates.youtubeHandle = dto.youtubeHandle;
        if (dto.tiktokHandle !== undefined) influencerUpdates.tiktokHandle = dto.tiktokHandle;
        if (dto.twitterHandle !== undefined) influencerUpdates.twitterHandle = dto.twitterHandle;

        return this.prisma.$transaction(async (tx) => {
            // Update User
            let updatedUser = user;
            if (Object.keys(userUpdates).length > 0) {
                updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: userUpdates,
                    include: { influencerProfile: true },
                }) as any;
            }

            // Update or Create Influencer Profile if needed
            if (Object.keys(influencerUpdates).length > 0) {
                if (user.influencerProfile) {
                    await tx.influencerProfile.update({
                        where: { userId },
                        data: influencerUpdates,
                    });
                } else if (user.role === UserRole.INFLUENCER || user.role === UserRole.ADMIN) {
                    // Only create profile if they are an influencer
                    const defaultDisplayName = dto.displayName || `${user.firstName} ${user.lastName}`.trim();
                    await tx.influencerProfile.create({
                        data: {
                            userId,
                            displayName: defaultDisplayName || 'unnamed',
                            ...influencerUpdates,
                        },
                    });
                }
            }

            return tx.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    avatarUrl: true,
                    emailVerified: true,
                    createdAt: true,
                    influencerProfile: true, // safe to expose profile
                },
            });
        });
    }
}
