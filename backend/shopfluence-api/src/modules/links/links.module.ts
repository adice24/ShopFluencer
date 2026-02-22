import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LinksService } from './links.service';
import { LinksController, PublicRedirectController } from './links.controller';

@Module({
    imports: [DatabaseModule],
    controllers: [LinksController, PublicRedirectController],
    providers: [LinksService],
    exports: [LinksService],
})
export class LinksModule { }
