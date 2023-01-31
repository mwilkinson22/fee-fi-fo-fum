// pageClassNames.gameWrapper is called differently to the other classes, so we deliberately miss off the dot
export default {
	SL: {
		webcrawlUrl: "https://www.superleague.co.uk",
		webcrawlFixturesPage: "/ajaxAPI",
		webcrawlReportPage: "/match-centre/report",
		webcrawlTemplate: "template.twig",
		pageClassNames: {
			gameWrapper: "match-hold",
			homeTeamName: ".home-holder h3",
			awayTeamName: ".away-holder h3",
			time: ".ko",
			round: ".comp-round",
			broadcasters: ".skyHD,.channel4"
		}
	},
	RFL: {
		webcrawlUrl: "https://www.rugby-league.com",
		webcrawlFixturesPage: "/ajaxAPI",
		webcrawlReportPage: "/match-centre/match-report",
		webcrawlTemplate: "main_match_centre.twig",
		pageClassNames: {
			gameWrapper: "fixture-card",
			homeTeamName: ".left .team-name",
			awayTeamName: ".away .team-name",
			time: ".fixture-wrap .middle",
			round: ".fixture-footer",
			broadcasters: ".fixture-footer img"
		}
	}
};
