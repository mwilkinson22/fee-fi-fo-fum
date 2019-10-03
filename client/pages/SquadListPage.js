//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import SubMenu from "~/client/components/SubMenu";
import LoadingPage from "../components/LoadingPage";
import PersonCard from "../components/people/PersonCard";
import HelmetBuilder from "../components/HelmetBuilder";

//Constants
import coachTypes from "~/constants/coachTypes";

class SquadListPage extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = {};
		const { localTeam, fullTeams, match, teamTypes } = nextProps;
		const team = fullTeams[localTeam];

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
			.orderBy("sortOrder")
			.value();

		//Get Active TeamType
		const filteredTeamType = _.find(
			newState.teamTypes,
			teamType => teamType.slug == match.params.teamType
		);
		newState.teamType = filteredTeamType ? filteredTeamType._id : newState.teamTypes[0]._id;

		//Get Players
		newState.squad = _.chain(team.squads)
			.filter(squad => squad.year == newState.year && squad._teamType == newState.teamType)
			.map(squad => squad.players)
			.flatten()
			.sortBy(({ number, _player }) => number || _player.name.first)
			.value();

		//Get Coaches
		const now = new Date();
		const currentYear = Number(now.getFullYear());
		if (team.coaches) {
			const coaches = _.chain(team.coaches)
				.filter(c => c._teamType == newState.teamType)
				.orderBy(
					[({ role }) => coachTypes.findIndex(({ key }) => role == key), "from"],
					["asc", "asc"]
				)
				.value();
			if (currentYear == newState.year) {
				//Just get currently active
				newState.coaches = coaches.filter(c => {
					return new Date(c.from) < now && (c.to == null || new Date(c.to) > now);
				});
			} else {
				//Get all for the year in question
				const year = Number(newState.year);
				newState.coaches = coaches.filter(c => {
					return (
						new Date(c.from) < new Date(`${year + 1}-01-01`) &&
						(c.to == null || new Date(c.to) > new Date(`${year}-01-01`))
					);
				});
			}
			newState.coaches = _.uniqBy(newState.coaches, "_person._id");
		}

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

		return <SubMenu items={[...dummyLinks, ...links]} rootUrl={"/squads/"} />;
	}

	generateSquadList() {
		const { squad, coaches } = this.state;
		const playerCards = _.map(squad, player => {
			return (
				<PersonCard
					person={player._player}
					personType="player"
					key={player._player._id}
					number={player.number}
				/>
			);
		});
		let coachCards;
		if (coaches && coaches.length) {
			coachCards = coaches.map(coach => {
				return (
					<PersonCard
						person={coach._person}
						personType="coach"
						key={coach._id}
						coachingRole={coach.role}
					/>
				);
			});
		}

		return (
			<div className="person-card-grouping">
				{playerCards}
				{coachCards}
			</div>
		);
	}

	generateHelmet() {
		const { year, teamType, years } = this.state;
		const { teamTypes } = this.props;
		const teamTypeObject = _.find(teamTypes, t => t._id === teamType);
		const specifyTeamTypeInMeta = _.minBy(_.values(teamTypes), "sortOrder")._id !== teamType;
		//Title
		let title = `${year} Huddersfield Giants`;
		if (specifyTeamTypeInMeta) {
			title += ` ${teamTypeObject.name}`;
		}
		title += " Squad";

		//Canonical
		let canonical = "/squads";
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

function mapStateToProps({ config, teams }) {
	const { fullTeams, teamTypes } = teams;
	const { localTeam } = config;
	return { localTeam, fullTeams, teamTypes };
}

export default {
	component: connect(mapStateToProps)(SquadListPage)
};
