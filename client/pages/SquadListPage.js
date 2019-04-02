import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchTeam } from "../actions/teamsActions";
import LoadingPage from "../components/LoadingPage";
import PersonCard from "../components/people/PersonCard";
import _ from "lodash";
import HelmetBuilder from "../components/HelmetBuilder";
import { NavLink } from "react-router-dom";

class SquadListPage extends Component {
	constructor(props) {
		super(props);
		const { localTeam, fullTeams, fetchTeam } = props;
		if (!fullTeams[localTeam]) {
			fetchTeam(localTeam);
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = {};
		const { localTeam, fullTeams, match, teamTypes } = nextProps;
		const team = fullTeams[localTeam];

		if (!team) {
			return newState;
		}

		//Get Years
		newState.years = _.chain(team.squads)
			.map(squad => squad.year)
			.uniq()
			.sort()
			.reverse()
			.value();

		//Get Active Year
		newState.year = match.params.year || newState.years[0];

		//Get TeamTypes
		newState.teamTypes = _.chain(team.squads)
			.filter(squad => squad.year == newState.year)
			.map(squad => teamTypes[squad._teamType])
			.sortBy("sortOrder")
			.value();

		//Get Active TeamType
		const filteredTeamType = _.find(teamType => teamType.slug === match.params.teamType);
		newState.teamType = filteredTeamType ? filteredTeamType._id : newState.teamTypes[0]._id;

		//Get Players
		newState.squad = _.chain(team.squads)
			.filter(squad => squad.year == newState.year && squad._teamType == newState.teamType)
			.map(squad => squad.players)
			.flatten()
			.sortBy(player => player.number || 9999)
			.value();

		return newState;
	}

	generatePageHeader() {
		const { year, years } = this.state;
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
				onChange={ev => this.props.history.push(`/squads/${ev.target.value}`)}
				value={year}
			>
				{options}
			</select>,
			<span key="results-header"> Squad</span>
		];
	}

	generateTeamTypeMenu() {
		const { teamTypes, year } = this.state;
		const coreUrl = `/squads/${year}`;
		const submenu = _.chain(teamTypes)
			.map(teamType => {
				const { name, slug } = teamType;
				return (
					<NavLink key={slug} to={`${coreUrl}/${slug}`} activeClassName="active">
						{name}
					</NavLink>
				);
			})
			.value();

		const dummyLinkUrls = ["/squads/", coreUrl];
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

	generateSquadList() {
		const { squad } = this.state;
		const players = _.map(squad, player => {
			return (
				<PersonCard
					person={player._player}
					personType="player"
					key={player._player._id}
					number={player.number}
				/>
			);
		});
		return <div className="squad-list">{players}</div>;
	}

	generateHelmet() {
		const { year, teamType, years } = this.state;
		const { teamTypes } = this.props;
		const teamTypeObject = _.find(teamTypes, t => t._id === teamType);
		const specifyTeamTypeInMeta = _.minBy(_.values(teamTypes), "sortOrder")._id !== teamType;
		//Title
		let title = `${year} Huddersfield Giants`;
		if (specifyTeamTypeInMeta) {
			title += teamTypeObject.name;
		}
		title += " Squad";

		//Canonical
		let canonical = "squads";
		if (years[0] != year) {
			canonical += `/${year}`;

			if (specifyTeamTypeInMeta) {
				canonical += `/${teamTypeObject.slug}`;
			}
		}

		//Render
		return <HelmetBuilder title={title} canonical={canonical} />;
	}

	render() {
		const { years } = this.state;

		if (!years) {
			return <LoadingPage />;
		}

		return (
			<div className="team-page">
				{this.generateHelmet()}

				<section className="page-header">
					<div className="container">
						<h1>{this.generatePageHeader()}</h1>
						{this.generateTeamTypeMenu()}
					</div>
				</section>
				{this.generateSquadList()}
			</div>
		);
	}
}

async function loadData(store) {
	const { localTeam } = store.getState().config;
	return store.dispatch(fetchTeam(localTeam));
}

function mapStateToProps({ config, teams }) {
	const { fullTeams, teamTypes } = teams;
	const { localTeam } = config;
	return { localTeam, fullTeams, teamTypes };
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchTeam }
	)(SquadListPage),
	loadData
};
