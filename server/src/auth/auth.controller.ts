import { Body, Controller, Post } from "@nestjs/common";
import { ApiUseTags } from "@nestjs/swagger";
import { AuthSignUpDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@ApiUseTags("api")
@Controller("api/auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("signup")
	async signUp(@Body() authSignUpDto: AuthSignUpDto) {
		return this.authService.signUp(authSignUpDto);
	}
}
