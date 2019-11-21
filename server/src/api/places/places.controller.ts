import { Controller, Get, Param } from "@nestjs/common";
import { ApiUseTags } from "@nestjs/swagger";
import { DomainService } from "../../domain/domain.service";
import { Place } from "./places.dto";

@ApiUseTags("from hifi")
@Controller("api/v1/places")
export class PlacesController {
	constructor(private domainService: DomainService) {}

	@Get(":id")
	async getPlace(@Param("id") id: string) {
		const domain = await this.domainService.findById(id);
		if (domain == null)
			return {
				status: "fail",
				data: {
					place: "there is no place with that name",
				},
			};

		const domainSession = this.domainService.sessions[id];

		return {
			status: "success",
			data: {
				place: {
					id: domain._id,
					description: domain.description,
					path: domain.path,
					name: domain._id,
					address: "hifi://" + domain.id + domain.path,
					domain: {
						id: domain._id,
						network_address: domain.networkAddress,
						network_port: domain.networkPort,
						online: domainSession != null,
						default_place_name: domain._id,
					},
					previews: {
						lobby: "",
						thumbnail: "",
					},
				} as Place,
			},
		};
	}
}
