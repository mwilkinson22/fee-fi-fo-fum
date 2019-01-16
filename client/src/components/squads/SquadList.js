import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchYearsWithSquads, fetchSquad } from "../../actions/teamsActions";
import LoadingPage from "../LoadingPage";
import PersonCard from "../people/PersonCard";
import _ from "lodash";

class SquadList extends Component {
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
			console.log(year);
			if (!squads[year]) {
				fetchSquad(year);
			} else {
				newState.squad = squads[year];
			}

			return { year, ...newState };
		} else {
			fetchYearsWithSquads();
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
					children={options}
					onChange={ev => this.setState({ year: ev.target.value })}
					value={this.state.year}
				/>,
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
			const players = _.map(squad, player => {
				return <PersonCard person={player} personType="player" key={player._id} />;
			});
			return <div className="squad-list">{players}</div>;
		}
	}

	render() {
		return (
			<div className="team-page">
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

function mapStateToProps({ teams }) {
	const { squads } = teams;
	return { squads };
}

export default connect(
	mapStateToProps,
	{ fetchSquad, fetchYearsWithSquads }
)(SquadList);
