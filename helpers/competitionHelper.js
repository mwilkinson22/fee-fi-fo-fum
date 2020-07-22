export function canCrawlFixtures(segment) {
	const { _parentCompetition } = segment;
	return (
		segment.externalCompId &&
		_parentCompetition.webcrawlFormat &&
		_parentCompetition.webcrawlUrl
	);
}
