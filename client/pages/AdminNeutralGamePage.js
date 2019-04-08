import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import LoadingPage from "../components/LoadingPage";
import { fetchNeutralGames } from "../actions/gamesActions";
import { fetchTeamList } from "../actions/teamsActions";
import { fetchAllCompetitionSegments } from "~/client/actions/competitionActions";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "~/client/pages/NotFoundPage";

class AdminNeutralGameList extends Component {
	constructor(props) {
		super(props);
		const {
			competitionSegmentList,
			fetchAllCompetitionSegments,
			neutralGames,
			fetchNeutralGames,
			teamList,
			fetchTeamList
		} = props;

		if (!competitionSegmentList) {
			fetchAllCompetitionSegments();
		}

		if (!neutralGames) {
			fetchNeutralGames();
		}

		if (!teamList) {
			fetchTeamList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList, neutralGames, teamList, match } = nextProps;
		if (!competitionSegmentList || !neutralGames || !teamList) {
			return {};
		}

		let game = _.find(neutralGames, g => g._id === match.params.id) || false;
		if (game) {
			game = _.cloneDeep(game);
			game._homeTeam = teamList[game._homeTeam];
			game._awayTeam = teamList[game._awayTeam];
		}

		return { game };
	}

	generatePageTitle() {
		const { _homeTeam, _awayTeam, date } = this.state.game;
		return `${_homeTeam.name.short} vs ${_awayTeam.name.short} - ${date.toString(
			"ddd dS MMM yyyy"
		)}`;
	}

	generatePageHeader() {
		const { date, _teamType } = this.state.game;
		const { teamTypes } = this.props;
		const urlYear = date.getFullYear();
		const urlSlug = teamTypes[_teamType].slug;
		return (
			<section className="page-header">
				<div className="container">
					<Link
						className="nav-card card"
						to={`/admin/neutralGames/${urlYear}/${urlSlug}`}
					>
						↩ Return to game list
					</Link>
					<h1>{this.generatePageTitle()}</h1>
				</div>
			</section>
		);
	}

	render() {
		const { game } = this.state;

		if (game === undefined) {
			return <LoadingPage />;
		}

		if (!game) {
			return <NotFoundPage error={"Game not found"} />;
		}

		return (
			<div>
				<HelmetBuilder title={this.generatePageTitle()} />
				{this.generatePageHeader()}
			</div>
		);
	}
}

function mapStateToProps({ games, teams, competitions }) {
	const { neutralGames } = games;
	const { teamList, teamTypes } = teams;
	const { competitionSegmentList } = competitions;
	return {
		neutralGames,
		teamList,
		competitionSegmentList,
		teamTypes
	};
}

export default connect(
	mapStateToProps,
	{ fetchAllCompetitionSegments, fetchTeamList, fetchNeutralGames }
)(AdminNeutralGameList);
