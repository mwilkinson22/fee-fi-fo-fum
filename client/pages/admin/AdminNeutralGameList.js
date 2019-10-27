//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";
import NeutralGameList from "../../components/admin/neutralGames/NeutralGameList";
import HelmetBuilder from "../../components/HelmetBuilder";
import SubMenu from "../../components/SubMenu";

//Actions
import {
	fetchNeutralGames,
	fetchNeutralGameYears,
	crawlAndUpdateNeutralGames
} from "../../actions/neutralGamesActions";
import { setActiveTeamType } from "../../actions/teamsActions";
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";

class AdminNeutralGameList extends Component {
	constructor(props) {
		super(props);
		const {
			competitionSegmentList,
			fetchCompetitionSegments,
			neutralGameYears,
			fetchNeutralGameYears
		} = props;

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		if (!neutralGameYears) {
			fetchNeutralGameYears();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const {
			competitionSegmentList,
			neutralGameYears,
			neutralGames,
			fetchNeutralGames,
			teamList,
			teamTypes,
			match,
			activeTeamType,
			setActiveTeamType
		} = nextProps;

		if (!competitionSegmentList || !neutralGameYears || !teamList) {
			return {};
		}

		const newState = {};

		const year = _.find(neutralGameYears, y => y == match.params.year)
			? match.params.year
			: _.max(neutralGameYears);
		newState.year = year;

		//Get Games
		if ((!neutralGames || !neutralGames[year]) && !prevState.isLoadingGames) {
			newState.isLoadingGames = true;
			fetchNeutralGames(year);
			return newState;
		} else if (!neutralGames || !neutralGames[year]) {
			return newState;
		} else {
			newState.isLoadingGames = false;
		}

		//Team Types
		newState.teamTypes = _.chain(neutralGames[year])
			.map(g => teamTypes[g._teamType])
			.uniqBy("_id")
			.sortBy("sortOrder")
			.value();

		if (match.params.teamType) {
			const filteredTeamType = _.find(
				newState.teamTypes,
				t => t.slug === match.params.teamType
			);
			if (filteredTeamType) {
				newState.teamType = filteredTeamType;
			}
		}

		//If no valid team type is found, we redirect to either the last active one, or just the first in the list
		if (!newState.teamType) {
			const teamTypeRedirect =
				_.find(newState.teamTypes, t => t._id == activeTeamType) || newState.teamTypes[0];

			newState.teamTypeRedirect = teamTypeRedirect.slug;
			newState.teamType = activeTeamType;
		} else {
			//In case we've been redirected, clear out this value
			newState.teamTypeRedirect = undefined;
			if (activeTeamType != newState.teamType._id) {
				setActiveTeamType(newState.teamType._id);
			}
		}

		newState.teamType =
			_.find(newState.teamTypes, t => t.slug == match.params.teamType) ||
			newState.teamTypes[0];

		//Games
		newState.games = _.chain(neutralGames[year])
			.filter(g => g._teamType == newState.teamType._id)
			.value();

		return newState;
	}

	generatePageHeader() {
		const { neutralGameYears } = this.props;
		const options = _.map(neutralGameYears, year => {
			return (
				<option key={year} value={year}>
					{year}
				</option>
			);
		});
		return [
			<select
				key="year-selector"
				onChange={ev => this.props.history.push(`/admin/neutralGames/${ev.target.value}`)}
				value={this.state.year}
			>
				{options}
			</select>
		];
	}

	generateTeamTypeMenu() {
		const { teamTypes, year } = this.state;

		const dummyLinks = ["", year.toString()].map(slug => ({
			slug,
			isExact: true,
			isDummy: true,
			label: slug
		}));
		const links = teamTypes.map(({ name, slug }) => ({
			slug: `${year}/${slug}`,
			label: name
		}));

		return <SubMenu items={[...dummyLinks, ...links]} rootUrl={"/admin/neutralGames/"} />;
	}

	render() {
		const { year, games, teamTypeRedirect, isLoadingGames } = this.state;

		if (!year || isLoadingGames) {
			return <LoadingPage />;
		}

		if (teamTypeRedirect) {
			return <Redirect to={`/admin/neutralGames/${year}/${teamTypeRedirect}`} />;
		}

		const gamesToEdit = _.filter(
			games,
			g => g.date <= new Date() && (g.homePoints === null || g.awayPoints === null)
		);

		let gamesToEditSection;
		if (gamesToEdit.length) {
			gamesToEditSection = [
				<h3 key="title">Games To Edit</h3>,
				<NeutralGameList games={gamesToEdit} key="list" />
			];
		}

		return (
			<div>
				<HelmetBuilder title={`${year} Neutral Games`} />
				<section className="page-header">
					<div className="container">
						<h1>{this.generatePageHeader()}</h1>
						{this.generateTeamTypeMenu()}
					</div>
				</section>
				<section className="neutral-game-list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/neutralGame/new`}>
							Manually add a new game
						</Link>
						<div
							className="nav-card card"
							onClick={() => this.props.crawlAndUpdateNeutralGames()}
						>
							Force a sync
						</div>
						{gamesToEditSection}
						<h3>All Games</h3>
						<NeutralGameList games={games} />
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ games, teams, competitions }) {
	const { neutralGames, neutralGameYears } = games;
	const { teamList, teamTypes, activeTeamType } = teams;
	const { competitionSegmentList } = competitions;
	return {
		neutralGames,
		neutralGameYears,
		teamList,
		competitionSegmentList,
		teamTypes,
		fetchNeutralGameYears,
		activeTeamType
	};
}

export default connect(
	mapStateToProps,
	{
		fetchCompetitionSegments,
		fetchNeutralGames,
		fetchNeutralGameYears,
		crawlAndUpdateNeutralGames,
		setActiveTeamType
	}
)(AdminNeutralGameList);
