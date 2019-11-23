import {
	Controller,
	Get,
	Param,
	NotImplementedException,
} from "@nestjs/common";
import { ApiUseTags, ApiOperation } from "@nestjs/swagger";
import { DomainService } from "../../domain/domain.service";
import { Place } from "./places.dto";
import { UserService } from "../../user/user.service";

@ApiUseTags("from hifi")
@Controller("api/v1/places")
export class PlacesController {
	constructor(
		private domainService: DomainService,
		private userService: UserService,
	) {}

	private throwNoPlace() {
		return {
			status: "fail",
			data: {
				place: "there is no place with that name",
			},
		};
	}

	@Get(":placeName")
	@ApiOperation({ title: "", deprecated: true })
	async getPlace(@Param("placeName") placeName: string) {
		throw new NotImplementedException();
		// const domain = await this.domainService.domainFromPlaceName(placeName);
		// if (domain == null) return this.throwNoPlace();

		// const domainSession = this.domainService.sessions[domain._id];

		// return {
		// 	status: "success",
		// 	data: {
		// 		place: {
		// 			id: domain._id,
		// 			description: domain.description,
		// 			path: domain.path,
		// 			name: this.domainService.toPlaceName(domain.author, domain),
		// 			address: "hifi://" + domain.id + domain.path,
		// 			domain: {
		// 				id: domain._id,
		// 				network_address: domain.networkAddress,
		// 				network_port: domain.networkPort,
		// 				online: domainSession != null,
		// 				default_place_name: domain._id,
		// 			},
		// 			previews: {
		// 				lobby: "",
		// 				thumbnail: "",
		// 			},
		// 		} as Place,
		// 	},
		// };
	}
}
