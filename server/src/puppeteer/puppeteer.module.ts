import { Module, forwardRef } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { PuppeteerService } from "./puppeteer.service";

@Module({
	providers: [PuppeteerService],
	imports: [forwardRef(() => UserModule)],
	exports: [PuppeteerService],
})
export class PuppeteerModule {}
