//Modules
import _ from "lodash";
import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";
import Select from "react-select";

//Components
import LoadingPage from "../../components/LoadingPage";
import NeutralGameList from "../../components/admin/neutralGames/NeutralGameList";
import HelmetBuilder from "../../components/HelmetBuilder";
import SubMenu from "../../components/SubMenu";

//Constants
import selectStyling from "~/constants/selectStyling";

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
		const { competitionSegmentList, fetchCompetitionSegments, neutralGameYears, fetchNeutralGameYears } = props;

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		if (!neutralGameYears) {
			fetchNeutralGameYears();
		}

		this.state = {
			isSyncingGames: false,
			allTeams: [],
			teamFilters: [],
			filteredGames: []
		};
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
		const { teamFilter } = prevState;

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
			const filteredTeamType = _.find(newState.teamTypes, t => t.slug === match.params.teamType);
			if (filteredTeamType) {
				newState.teamType = filteredTeamType;
			}
		}

		//If no valid team type is found, we redirect to either the last active one, or just the first in the list
		if (!newState.teamType) {
			const teamTypeRedirect = _.find(newState.teamTypes, t => t._id == activeTeamType) || newState.teamTypes[0];

			newState.teamTypeRedirect = teamTypeRedirect.slug;
			newState.teamType = activeTeamType;
		} else {
			//In case we've been redirected, clear out this value
			newState.teamTypeRedirect = undefined;
			if (activeTeamType != newState.teamType._id) {
				setActiveTeamType(newState.teamType._id);
			}
		}

		newState.teamType = _.find(newState.teamTypes, t => t.slug == match.params.teamType) || newState.teamTypes[0];

		//Games
		newState.games = _.chain(neutralGames[year])
			.filter(g => g._teamType == newState.teamType._id)
			.value();

		//Reset Teams and Filters on year change
		if (
			newState.year !== prevState.year ||
			!prevState.teamType ||
			newState.teamType._id !== prevState.teamType._id
		) {
			newState.allTeams = _.chain(newState.games)
				.map(g => [g._homeTeam, g._awayTeam])
				.flatten()
				.uniq()
				.map(id => ({ value: id, label: teamList[id].name.long }))
				.sortBy("label")
				.value();
			newState.teamFilter = [];
		}

		//Filter Games
		newState.filteredGames = _.filter(newState.games, game => {
			if (!teamFilter || teamFilter.length === 0) {
				return true;
			}
			const filteredTeamIds = teamFilter.map(t => t.value);
			//If we only have one team, simply filter by whether that team is included
			if (filteredTeamIds.length === 1) {
				return [game._homeTeam, game._awayTeam].includes(filteredTeamIds[0]);
			}

			//Otherwise, loop through the teams and make sure both teams are part of the filter
			return filteredTeamIds.includes(game._homeTeam) && filteredTeamIds.includes(game._awayTeam);
		});

		return newState;
	}

	async handleCrawlAndUpdate() {
		const { crawlAndUpdateNeutralGames } = this.props;
		const { isSyncing } = this.state;
		if (!isSyncing) {
			//Disable button
			this.setState({ isSyncing: true });

			//Perform sync
			await crawlAndUpdateNeutralGames();

			//Re-enable button
			this.setState({ isSyncing: false });
		}
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
		const { year, filteredGames, teamTypeRedirect, isLoadingGames, isSyncing, allTeams, teamFilter } = this.state;

		if (!year || isLoadingGames) {
			return <LoadingPage />;
		}

		if (teamTypeRedirect) {
			return <Redirect to={`/admin/neutralGames/${year}/${teamTypeRedirect}`} />;
		}

		const now = new Date();
		const gamesToEdit = _.filter(
			filteredGames,
			g => g.date <= now && (g.homePoints === null || g.awayPoints === null)
		);
		let upcomingGamesSection,
			pastGamesSection = null;
		const upcomingGames = _.filter(filteredGames, g => g.date > now);
		if (upcomingGames.length) {
			upcomingGamesSection = (
				<Fragment>
					<h3>Upcoming Games</h3>
					<NeutralGameList games={upcomingGames} />
				</Fragment>
			);
		}
		const pastGames = _.filter(filteredGames, g => g.date <= now);
		if (pastGames.length) {
			pastGamesSection = (
				<Fragment>
					<h3>Past Games</h3>
					<NeutralGameList games={pastGames} />
				</Fragment>
			);
		}

		let gamesToEditSection;
		if (gamesToEdit.length) {
			gamesToEditSection = (
				<Fragment>
					<h3>Games To Edit</h3>
					<NeutralGameList games={gamesToEdit} dateDescending={true} />
				</Fragment>
			);
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
							className={`nav-card card${isSyncing ? " disabled" : ""}`}
							onClick={() => this.handleCrawlAndUpdate()}
						>
							{isSyncing ? "Forcing" : "Force"} a sync
						</div>
						<h3>Filter By Team</h3>
						<Select
							isMulti={true}
							isSearchable={false}
							value={teamFilter}
							options={allTeams}
							onChange={teamFilter => this.setState({ teamFilter })}
							styles={selectStyling}
						/>
						<br />
						{gamesToEditSection}
						{upcomingGamesSection}
						{pastGamesSection}
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

export default connect(mapStateToProps, {
	fetchCompetitionSegments,
	fetchNeutralGames,
	fetchNeutralGameYears,
	crawlAndUpdateNeutralGames,
	setActiveTeamType
})(AdminNeutralGameList);
