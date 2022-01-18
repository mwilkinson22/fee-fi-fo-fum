export function canCrawlFixtures(segment) {
	const { _parentCompetition, externalCompId } = segment;
	return segment.externalCompId && _parentCompetition.webcrawlFormat && externalCompId;
}

export function createLeagueTableString(_competition, year, fromDate, toDate) {
	return [
		_competition,
		year,
		fromDate ? fromDate.toString("yyyy-MM-dd") : `none`,
		toDate ? toDate.toString("yyyy-MM-dd") : `none`
	].join("-");
}
