import { isPlatformServer } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
	Component,
	ElementRef,
	HostListener,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
} from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { tap } from "rxjs/operators";
import { File, FilesService } from "../files.service";

@Component({
	selector: "app-editor",
	templateUrl: "./editor.component.html",
	styleUrls: ["./editor.component.scss"],
})
export class EditorComponent implements OnInit, OnDestroy {
	monaco: typeof import("monaco-editor");

	@ViewChild("editor") editorRef: ElementRef<HTMLDivElement>;
	// TODO: look into this
	// editor: typeof import("monaco-editor").editor.IStandaloneCodeEditor;
	editor: any;

	loading: "file" | "editor" = "file";
	saving = false;

	mimeType = null;

	constructor(
		private readonly dialogRef: MatDialogRef<EditorComponent>,
		@Inject(MAT_DIALOG_DATA)
		public readonly data: {
			file: File;
		},
		private readonly http: HttpClient,
		private readonly filesService: FilesService,
		@Inject(PLATFORM_ID)
		private readonly platformId: Object,
	) {}

	private initMonaco() {
		return new Promise(resolve => {
			const self = window as any;
			const baseUrl = "/assets/monaco-editor/min/vs";

			const loadMonaco = () => {
				self.require.config({ paths: { vs: baseUrl } });
				self.require(["vs/editor/editor.main"], () => {
					this.monaco = self.monaco;
					resolve();
				});
			};

			if (self.require) {
				loadMonaco();
			} else {
				const script: HTMLScriptElement = document.createElement(
					"script",
				);
				script.type = "text/javascript";
				script.src = baseUrl + "/loader.js";
				script.addEventListener("load", () => {
					loadMonaco();
				});
				document.body.appendChild(script);
			}
		});
	}

	private getLanguage() {
		const fileExt = this.data.file.name.split(".").pop().toLowerCase();
		const language = this.monaco.languages
			.getLanguages()
			.find(language => language.extensions.includes("." + fileExt));
		return language;
	}

	private getFileData() {
		return this.http
			.get(this.data.file.url, {
				responseType: "text",
				// observe: "response",
			})
			.toPromise();
	}

	save() {
		this.saving = true;

		const file = new globalThis.File(
			[this.editor.getValue()],
			this.data.file.name,
			{
				type: this.mimeType,
			},
		);

		return this.filesService.uploadFile(this.data.file.key, file).pipe(
			tap(event => {
				if (event.type >= 4) this.saving = false;
			}),
		);
	}

	async ngOnInit() {
		if (isPlatformServer(this.platformId)) return;

		this.loading = "file";
		const fileData = await this.getFileData();

		this.loading = "editor";
		await this.initMonaco();

		const language = this.getLanguage();
		this.mimeType = language
			? language.mimetypes.length > 0
				? language.mimetypes[0]
				: "text/plain"
			: "text/plain";

		// this.monaco.editor.defineTheme("dracula", draculaThemeData);
		// TODO: add tivoli types https://stackoverflow.com/a/43080286
		this.monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
			target: this.monaco.languages.typescript.ScriptTarget.ES3,
			allowNonTsExtensions: true,
			moduleResolution: this.monaco.languages.typescript
				.ModuleResolutionKind.NodeJs,
			module: this.monaco.languages.typescript.ModuleKind.CommonJS,
			noEmit: true,
			typeRoots: ["node_modules/@types"],
		});

		this.loading = null;
		this.editor = this.monaco.editor.create(this.editorRef.nativeElement, {
			value: fileData,
			language: language ? language.id : "plaintext",
			// theme: "dracula",
			theme: "vs-dark",
			mouseWheelZoom: true,
			fontFamily: "'Roboto Mono', monospace",
			fontSize: 18,
		});
		setTimeout(() => {
			this.editor.layout();
		}, 50);
	}

	@HostListener("window:resize")
	onWindowResize() {
		if (this.editor) this.editor.layout();
	}

	@HostListener("keydown", ["$event"])
	onKeyDown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey) {
			switch (event.code) {
				case "KeyS":
					event.preventDefault();
					this.save().subscribe(() => {});
					break;
			}
		}

		// console.log(event);
		// console.log(event.which);
	}

	// @HostListener("wheel", ["$event"])
	// onWheel(event: any) {
	// 	console.log(event);
	// }

	ngOnDestroy() {
		if (this.editor) this.editor.dispose();
	}

	onDiscard() {
		this.dialogRef.close();
	}

	onSave() {
		this.save().subscribe(event => {
			if (event.type >= 4) this.dialogRef.close();
		});
	}
}
