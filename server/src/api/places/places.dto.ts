export interface Place {
	id: string;
	description: string;
	path: string; // with /
	name: string; // place name
	address: string; // hifi://address/path
	domain: {
		id: string;
		network_address: string;
		network_port: number;
		cloud_domain?: false; // we're not using this
		online: boolean;
		default_place_name: string;
	};
	previews: {
		lobby: string;
		thumbnail: string;
	};
}
