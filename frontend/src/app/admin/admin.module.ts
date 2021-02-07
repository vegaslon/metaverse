import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { UiModule } from "../ui/ui.module";
import { AdminComponent } from "./admin.component";
import { CreateOpenaiTokenComponent } from "./create-openai-token/create-openai-token.component";
import { OpenaiTokensComponent } from "./openai-tokens/openai-tokens.component";
import { UserComponent } from "./user/user.component";
import { UsersComponent } from "./users/users.component";

const routes: Routes = [
	{
		path: "",
		component: AdminComponent,
		children: [
			{ path: "users", component: UsersComponent },
			{ path: "online-users", component: UsersComponent },
			{ path: "user/:username", component: UserComponent },
			{ path: "openai-tokens", component: OpenaiTokensComponent },
			{ path: "**", redirectTo: "users" },
		],
	},
];

@NgModule({
	declarations: [
		AdminComponent,
		UserComponent,
		UsersComponent,
		OpenaiTokensComponent,
		CreateOpenaiTokenComponent,
	],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		MaterialModule,
		UiModule,
		ScrollingModule,
		ReactiveFormsModule,
	],
	entryComponents: [CreateOpenaiTokenComponent],
})
export class AdminModule {}
