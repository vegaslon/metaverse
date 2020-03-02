import { Readable } from "stream";

export interface MulterFile {
	fieldname: string;
	originalname: string;
	encoding: string;
	mimetype: string;
	buffer: Buffer;
}

export interface MulterStream {
	fieldname: string;
	originalname: string;
	encoding: string;
	mimetype: string;
	stream: Readable;
}
