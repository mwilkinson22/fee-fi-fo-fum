import React, { Component } from "react";
import { connect } from "react-redux";
import { localTeam } from "../../config/keys";
import { fetchYearsWithSquads, fetchSquad } from "../actions/teamsActions";
import LoadingPage from "../components/LoadingPage";
import PersonCard from "../components/people/PersonCard";
import _ from "lodash";
import HelmetBuilder from "../components/HelmetBuilder";
const firstTeam = "5c34e00a0838a5b090f8c1a7";

class SquadListPage extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = {};
		const { squads, fetchSquad, fetchYearsWithSquads } = nextProps;
		const years = _.keys(squads);

		if (squads) {
			const year = prevState.year || _.max(years);
			if (!squads[year][firstTeam]) {
				fetchSquad(year, localTeam, firstTeam);
			} else {
				newState.squad = squads[year];
			}

			return { year, ...newState };
		} else {
			fetchYearsWithSquads(localTeam);
			return {};
		}
	}

	generatePageHeader() {
		if (this.props.squads) {
			const options = _.chain(this.props.squads)
				.keys()
				.sort()
				.reverse()
				.map(year => {
					return (
						<option key={year} value={year}>
							{year}
						</option>
					);
				})
				.value();
			return [
				<select
					key="year-selector"
					onChange={ev => this.setState({ year: ev.target.value })}
					value={this.state.year}
				>
					{options}
				</select>,
				<span key="results-header"> Squad</span>
			];
		} else {
			return <LoadingPage />;
		}
	}

	generateSquadList() {
		const { squad } = this.state;
		if (!squad) {
			return <LoadingPage />;
		} else {
			const players = _.map(squad[firstTeam], player => {
				return <PersonCard person={player} personType="player" key={player._id} />;
			});
			return <div className="squad-list">{players}</div>;
		}
	}

	render() {
		return (
			<div className="team-page">
				<HelmetBuilder
					title={`${this.state.year} Huddersfield Giants Squad`}
					canonical={`squads`}
				/>
				<section className="page-header">
					<div className="container">
						<h1>{this.generatePageHeader()}</h1>
					</div>
				</section>
				{this.generateSquadList()}
			</div>
		);
	}
}

async function loadData(store) {
	await store.dispatch(fetchYearsWithSquads(localTeam));
	const years = _.keys(store.getState().teams.squads[localTeam]);
	const firstYear = _.max(years);
	return store.dispatch(fetchSquad(firstYear, localTeam));
}

function mapStateToProps({ teams }) {
	const { squads } = teams;
	return { squads: squads[localTeam] };
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchSquad, fetchYearsWithSquads }
	)(SquadListPage),
	loadData
};
