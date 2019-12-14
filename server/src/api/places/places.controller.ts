import { Controller, Get, HttpException, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { HOSTNAME } from "src/environment";
import { DomainService } from "../../domain/domain.service";
import { UserService } from "../../user/user.service";
import { Place } from "./places.dto";

@ApiTags("from hifi")
@Controller("api/v1/places")
export class PlacesController {
	constructor(
		private domainService: DomainService,
		private userService: UserService,
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

		//const domainSession = this.domainService.sessions[domain._id];
		const thumbnailUrl = HOSTNAME + "/api/domain/" + domain._id + "/image";

		return {
			status: "success",
			data: {
				place: {
					id: domain._id,
					description: domain.description,
					path: domain.path,
					name: domain.label,
					address: "hifi://" + domain._id + domain.path,
					domain: {
						id: domain._id,
						network_address: domain.networkAddress,
						network_port: domain.networkPort,
						online: domain.online,
						default_place_name: domain._id,
					},
					previews: {
						lobby: thumbnailUrl,
						thumbnail: thumbnailUrl,
					},
				} as Place,
			},
		};
	}
}
