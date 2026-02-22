import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ContentIdeasService {
    private readonly logger = new Logger(ContentIdeasService.name);

    constructor(private readonly prisma: PrismaService) { }

    async generateIdeas(userId: string, niche: string, platform: string) {
        // Mocking a powerful LLM response based on the niche and platform requested.
        // We generate ~10 ideas matching the user's specific context.

        const platformFormats: Record<string, string> = {
            'Instagram': 'Reel / Post',
            'TikTok': 'Short-form Video',
            'YouTube': 'Vlog / Long Video',
            'Affiliate Promotion': 'Review / Showcase',
            'Product Launch': 'Teaser / Launch',
        };

        const format = platformFormats[platform] || 'Content';

        const ideasTemplate = [
            { title: 'Behind the Scenes Workflow', hook: 'Ever wonder what actually goes into making...', cta: 'Drop your favorite tool in the comments!' },
            { title: 'Top 3 Mistakes Beginners Make', hook: 'If you want to succeed in this space, stop doing this right now.', cta: 'Save this so you dont forget!' },
            { title: 'A Day in the Life', hook: 'Come with me for a productive day doing what I love.', cta: 'What does your routine look like?' },
            { title: 'My Holy Grail Products', hook: 'I’ve tested hundreds of things, and these are the only ones I swear by.', cta: 'Check out the link in my bio for to get yours!' },
            { title: 'How I Generated X Results in 30 Days', hook: 'I couldn’t believe this strategy actually worked...', cta: 'Comment “STRATEGY” and I’ll DM you the exact step-by-step.' },
            { title: 'Debunking Common Myths', hook: 'Stop believing this massive lie about our industry.', cta: 'Tag a friend who needs to hear this.' },
            { title: 'The Ultimate Hacks Compilation', hook: 'These 5 secrets completely changed the game for me.', cta: 'Try number 3 and thank me later!' },
            { title: 'Unboxing / First Impressions', hook: 'I just got my hands on the most hyped release of the year.', cta: 'Would you buy this? Reply below!' },
            { title: 'Storytime: My biggest failure', hook: 'I almost quit entirely after this happened...', cta: 'Have you ever failed like this? Let’s chat.' },
            { title: 'Step-by-Step Mini Tutorial', hook: 'Here’s the fast-track way to achieve your goal by tonight.', cta: 'Share this with someone on a similar journey!' }
        ];

        // Ensure exactly 10 ideas (or however many the template has)
        const generated = ideasTemplate.map((t, idx) => ({
            userId,
            interestArea: niche,
            platform,
            title: `${format}: ${t.title} - ${niche} Focus`,
            hook: t.hook,
            cta: t.cta,
            hashtags: ['#' + niche.replace(/\s+/g, ''), '#' + platform.replace(/\s+/g, ''), '#contentidea', '#tips'],
            isSaved: false,
        }));

        // In a real app with LLM, this would take ~5-10 seconds.
        // We'll insert these into the database to satisfy "Save generated ideas in DB for history".
        const savedIdeas = await Promise.all(
            generated.map(idea => this.prisma.contentIdea.create({ data: idea }))
        );

        return savedIdeas;
    }

    async getHistory(userId: string) {
        return this.prisma.contentIdea.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async saveIdea(userId: string, ideaId: string) {
        return this.prisma.contentIdea.update({
            where: { id: ideaId, userId },
            data: { isSaved: true }
        });
    }

    async removeIdea(userId: string, id: string) {
        return this.prisma.contentIdea.delete({
            where: { id, userId }
        });
    }
}
