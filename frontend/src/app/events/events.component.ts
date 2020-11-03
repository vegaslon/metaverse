import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import * as moment from "moment-timezone";

@Component({
	selector: "app-events",
	templateUrl: "./events.component.html",
	styleUrls: ["./events.component.scss"],
})
export class EventsComponent implements OnInit {
	// today = new Date();
	timezone = moment.tz.guess();
	// currentDate = new Date().getDate() - 1;

	// offset = new Array(moment().startOf("month").get("day") - 1);

	// calendar: {
	// 	name: string;
	// 	description: string;
	// 	date: Date;
	// }[][];

	// weekDays = [
	// 	"Monday",
	// 	"Tuesday",
	// 	"Wednesday",
	// 	"Thursday",
	// 	"Friday",
	// 	"Saturday",
	// 	"Sunday",
	// ];

	// loading = false;

	// amPm = false;

	googleCalendar = true;
	googleCalendarUrl =
		"https://calendar.google.com/calendar/embed?" +
		[
			"wkst=2",
			"bgcolor=#ffffff",
			"src=ZW1vYjR1ZnE4MGs2dDZlNTE1bnU5cWV2NWNAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ",
			"color=#D81B60",
			"showTitle=0",
			"showNav=1",
			"showDate=1",
			"showPrint=0",
			"showTabs=1",
			"showCalendars=0",
			"showTz=1",
			"mode=MONTH",
			"ctz=" + this.timezone,
		]
			.map(param => {
				const [key, value] = param.split("=");
				return key + "=" + encodeURIComponent(value);
			})
			.join("&");

	constructor(
		private readonly http: HttpClient,
		public readonly sanitizer: DomSanitizer,
	) {}

	// parseIcal(ical: string) {
	// 	this.calendar = new Array(
	// 		moment().endOf("month").get("date"),
	// 	).map(() => []);

	// 	ical.match(/BEGIN:VEVENT[^]+?END:VEVENT/g).forEach(icalEvent => {
	// 		const get = property => {
	// 			const matches = icalEvent.match(
	// 				new RegExp(property + "[:;]([^]*?)\\n"),
	// 			);
	// 			return matches == null ? null : matches[1];
	// 		};

	// 		// get basic info

	// 		const name = get("SUMMARY");
	// 		const description = get("DESCRIPTION");

	// 		// get date

	// 		let date: Date = null;

	// 		const startWithTz = icalEvent.match(
	// 			/DTSTART;TZID=([^]*?\/[^]*?):([0-9]{4}[0-9]{2}[0-9]{2}T[0-9]{2}[0-9]{2}[0-9]{2})Z?\s/,
	// 		);

	// 		if (startWithTz != null) {
	// 			date = moment
	// 				.tz(startWithTz[2], "YYYYMMDDTHHmmss", startWithTz[1])
	// 				.toDate();
	// 		} else {
	// 			const start = icalEvent.match(
	// 				/DTSTART:([0-9]{4}[0-9]{2}[0-9]{2}T[0-9]{2}[0-9]{2}[0-9]{2})Z?\s/,
	// 			);
	// 			if (start != null)
	// 				date = moment.utc(start[1], "YYYYMMDDTHHmmss").toDate();
	// 		}

	// 		// check if current month

	// 		if (date.getMonth() !== new Date().getMonth()) return;

	// 		if (this.calendar[date.getDate() - 1] == null)
	// 			this.calendar[date.getDate() - 1] = [];
	// 		this.calendar[date.getDate() - 1].push({
	// 			name,
	// 			description,
	// 			date,
	// 		});

	// 		// check if theres repetition

	// 		// const repetitionRule = get("RRULE");
	// 		// console.log(repetitionRule)

	// 		// if (sequence) {
	// 		// 	for (let i = 0; i < sequence; i++) {
	// 		// 		const sequenceDate = new Date(date);
	// 		// 		sequenceDate.setDate(date.getDate() + 7 * (i + 1));

	// 		// 		if (this.calendar[sequenceDate.getDate() - 1] == null)
	// 		// 			this.calendar[sequenceDate.getDate() - 1] = [];
	// 		// 		this.calendar[sequenceDate.getDate() - 1].push({
	// 		// 			name,
	// 		// 			description,
	// 		// 			date: sequenceDate,
	// 		// 		});
	// 		// 	}
	// 		// }
	// 	});

	// 	// sort events by date

	// 	for (const i of Object.keys(this.calendar)) {
	// 		this.calendar[i] = this.calendar[i].sort(
	// 			(a, b) => +a.date - +b.date,
	// 		);
	// 	}
	// }

	refresh() {
		if (this.googleCalendar) {
			this.googleCalendarUrl = this.googleCalendarUrl;
		} else {
			// this.loading = true;
			// this.http
			// 	.get("/api/events", {
			// 		responseType: "text",
			// 	})
			// 	.subscribe(
			// 		ical => {
			// 			this.parseIcal(ical);
			// 			this.loading = false;
			// 		},
			// 		err => {
			// 			this.loading = false;
			// 		},
			// 	);
		}
	}

	onGoogleCalendar() {
		this.googleCalendar = !this.googleCalendar;
	}

	ngOnInit(): void {
		this.refresh();
	}
}
