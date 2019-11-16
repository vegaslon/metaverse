import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { VideoStreamComponent } from "./video-stream.component";

const routes: Routes = [{ path: ":id", component: VideoStreamComponent }];

@NgModule({
	declarations: [VideoStreamComponent],
	imports: [CommonModule, RouterModule.forChild(routes)],
})
export class VideoStreamModule {}
