import { Module } from '@nestjs/common';
import { ContentIdeasService } from './content-ideas.service';
import { ContentIdeasController } from './content-ideas.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [ContentIdeasController],
    providers: [ContentIdeasService],
    exports: [ContentIdeasService],
})
export class ContentIdeasModule { }
