import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import LoadingPage from "../components/LoadingPage";
import { fetchNeutralGames, crawlAndUpdateNeutralGames } from "../actions/gamesActions";
import { fetchTeamList } from "../actions/teamsActions";
import { fetchAllCompetitionSegments } from "~/client/actions/competitionActions";
import NeutralGameList from "../components/admin/neutralGames/NeutralGameList";
import HelmetBuilder from "../components/HelmetBuilder";

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
		const { competitionSegmentList, neutralGames, teamList, teamTypes, match } = nextProps;
		if (!competitionSegmentList || !neutralGames || !teamList) {
			return {};
		}

		const newState = {};

		//Years
		newState.years = _.chain(neutralGames)
			.map(g => g.date.getFullYear())
			.uniq()
			.sort()
			.reverse()
			.value();

		newState.year = _.find(newState.years, y => y == match.params.year)
			? match.params.year
			: _.max(newState.years);

		//Team Types
		newState.teamTypes = _.chain(neutralGames)
			.filter(g => g.date.getFullYear() == newState.year)
			.map(g => teamTypes[g._teamType])
			.uniqBy("_id")
			.sortBy("sortOrder")
			.value();

		newState.teamType =
			_.find(newState.teamTypes, t => t.slug == match.params.teamType) ||
			newState.teamTypes[0];

		//Games
		newState.games = _.chain(neutralGames)
			.filter(
				g => g.date.getFullYear() == newState.year && g._teamType == newState.teamType._id
			)
			.value();

		return newState;
	}

	generatePageHeader() {
		const { years } = this.state;
		const options = _.map(years, year => {
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
		const coreUrl = `/admin/neutralGames/${year}`;
		const submenu = _.map(teamTypes, teamType => {
			const { name, slug } = teamType;
			return (
				<NavLink key={slug} to={`${coreUrl}/${slug}`} activeClassName="active">
					{name}
				</NavLink>
			);
		});

		const dummyLinkUrls = ["/admin/neutralGames", coreUrl];
		const dummyLinks = dummyLinkUrls.map(url => {
			return (
				<NavLink
					key={url}
					exact={true}
					className="hidden"
					to={url}
					activeClassName="active"
				/>
			);
		});

		return (
			<div className="sub-menu">
				{dummyLinks}
				{submenu}
			</div>
		);
	}

	render() {
		const { year, games } = this.state;

		if (!year) {
			return <LoadingPage />;
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
	{ fetchAllCompetitionSegments, fetchTeamList, fetchNeutralGames, crawlAndUpdateNeutralGames }
)(AdminNeutralGameList);
