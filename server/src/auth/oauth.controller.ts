import { Body, Controller, HttpException, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthTokenDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@ApiTags("from hifi")
@Controller("oauth")
export class OauthController {
	constructor(private authService: AuthService) {}

	@Post("token")
	async getToken(@Body() authTokenDto: AuthTokenDto) {
		const user = await this.authService.validateUser(authTokenDto);
		if (user == null)
			throw new HttpException(
				{
					error: "invalid_grant",
					error_description:
						"The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.",
				},
				401,
			);

		return this.authService.login(user);
	}
}
