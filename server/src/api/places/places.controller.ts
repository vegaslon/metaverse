import { Controller, Get, HttpException, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { renderDomainForHifi } from "../../common/utils";
import { DomainService } from "../../domain/domain.service";
import { URL } from "../../environment";
import { SessionService } from "../../session/session.service";
import { Place } from "./places.dto";

@ApiTags("from hifi")
@Controller("api/v1/places")
export class PlacesController {
	constructor(
		private domainService: DomainService,
		private sessionService: SessionService,
	) {}

	@Get(":placeName")
	async getPlace(@Param("placeName") placeName: string) {
		const domain = await this.domainService.findById(placeName);
		if (domain == null)
			throw new HttpException(
				{
					status: "fail",
					data: {
						place: "there is no place with that name",
					},
				},
				404,
			);

		const thumbnailUrl = URL + "/api/domain/" + domain._id + "/image";

		const session = await this.sessionService.findDomainById(domain.id);

		return {
			status: "success",
			data: {
				place: {
					id: domain._id,
					description: domain.description,
					path: domain.path,
					name: domain._id,
					address: domain._id, // hifi://address/path
					domain: renderDomainForHifi(domain, session),
					previews: {
						lobby: thumbnailUrl,
						thumbnail: thumbnailUrl,
					},
				} as Place,
			},
		};
	}
}
