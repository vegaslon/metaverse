export function pagination(
	current_page: number,
	per_page: number,
	entries: any[],
) {
	// page 1 is the minimum
	current_page = current_page <= 0 ? 1 : current_page;

	const startIndex = per_page * (current_page - 1);
	const data = entries.slice(startIndex, startIndex + per_page);

	const total_pages = Math.ceil(entries.length / per_page);
	const total_entries = entries.length;

	return {
		info: {
			current_page,
			per_page,
			total_pages,
			total_entries,
		},
		data,
	};
}

function test() {
	const test = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
	console.log(pagination(0, 5, test));
	console.log(pagination(1, 5, test));
	console.log(pagination(2, 5, test));
	console.log(pagination(3, 5, test));
	console.log(pagination(4, 5, test));
	console.log(pagination(5, 5, test));
}
