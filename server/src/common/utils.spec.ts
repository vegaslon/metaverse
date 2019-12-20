import {
	snakeToCamelCase,
	snakeToCamelCaseObject,
	patchObject,
	pagination,
	generateRandomString,
} from "./utils";

describe("utils", () => {
	it.each([
		["this_is_MY_TEST", "thisIsMyTest"],
		["Is_ThIs_My_TeSt?", "isThisMyTest?"],
		["THISIS_MYTEST____TEST____", "thisisMytestTest"],
		["_capital_letters", "CapitalLetters"],
	])("should convert snake to camel case", (input, expected) => {
		expect(snakeToCamelCase(input)).toBe(expected);
	});

	it.each([
		[
			{
				domain_name: "Domain",
				ip_ADDRESS: "1.1.1.1",
				IMPORTANT_FIELD: true,
				default_placeName: "Test",
			},
			{
				domainName: "Domain",
				ipAddress: "1.1.1.1",
				importantField: true,
				defaultPlacename: "Test",
			},
		],
		[
			{
				____capital_letter: true,
				yes_IT_IS______: false,
			},
			{
				CapitalLetter: true,
				yesItIs: false,
			},
		],
	])(
		"should convert a snake object to a camel case object",
		(snakeObject, camelObject) => {
			expect(snakeToCamelCaseObject(snakeObject)).toEqual(camelObject);
		},
	);

	it("should patch an object with another object", () => {
		expect(
			patchObject(
				{
					ipAddress: "1.1.1.1",
					ipPort: 1234,
					domainName: "Domain",
				},
				{
					ipAddress: "2.2.2.2",
					notHere: false,
				},
			),
		).toEqual({
			ipAddress: "2.2.2.2",
			ipPort: 1234,
			domainName: "Domain",
		});
	});

	it.each([
		[
			2,
			2,
			["This", "is", "a", "test"],
			{
				info: {
					current_page: 2,
					per_page: 2,
					total_pages: 2,
					total_entries: 4,
				},
				data: ["a", "test"],
			},
		],
		[
			1,
			3,
			["This", "is", "a", "test"],
			{
				info: {
					current_page: 1,
					per_page: 3,
					total_pages: 2,
					total_entries: 4,
				},
				data: ["This", "is", "a"],
			},
		],
		[
			3,
			3,
			["This", "is", "a", "test"],
			{
				info: {
					current_page: 3,
					per_page: 3,
					total_pages: 2,
					total_entries: 4,
				},
				data: [],
			},
		],
	])(
		"should paginate an array",
		(currentPage, perPage, entries, expected) => {
			expect(pagination(currentPage, perPage, entries)).toEqual(expected);
		},
	);

	it.each([
		[/^[a-zA-Z0-9]*$/, 16, true, true, true],
		[/^[0-9]*$/, 24, false, false, true],
		[/^[a-z0-9]*$/, 32, true, false, true],
	])(
		"should generate a random string",
		(regex, length, small, big, numbers) => {
			const string = generateRandomString(length, small, big, numbers);
			if (string.length != length) throw new Error("Incorrect length");

			expect(/^[a-zA-Z0-9]*$/.test(string)).toBe(true);
		},
	);
});
