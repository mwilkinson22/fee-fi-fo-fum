import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchYearsWithSquads, fetchSquad } from "../../actions/teamsActions";
import LoadingPage from "../LoadingPage";
import PersonCard from "../people/PersonCard";
import _ from "lodash";

class SquadList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			squad: null
		};
	}

	async componentDidMount() {
		await this.props.fetchYearsWithSquads();
		await this.setState({ year: this.props.years[0] });
		this.getSquad();
	}

	componentWillReceiveProps(nextProps, nextContext) {
		if (this.state.year) {
			this.setState({ squad: nextProps.squads[this.state.year] });
		}
	}

	async getSquad(val = null) {
		//Either the component has just mounted and set a default active year
		//or the active year has been updated
		const year = val || this.props.years[0];
		const squad = this.props.squads[year];
		if (!squad) await this.props.fetchSquad(year);
		await this.setState({
			year,
			squad: this.props.squads[year]
		});
	}

	generatePageHeader() {
		if (this.props.years) {
			const options = this.props.years.map(year => {
				return (
					<option key={year} value={year}>
						{year}
					</option>
				);
			});
			return [
				<select
					key="year-selector"
					children={options}
					onChange={ev => this.getSquad(ev.target.value)}
					value={this.props.year}
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
	const { squads, years } = teams;
	return { squads, years };
}

export default connect(
	mapStateToProps,
	{ fetchSquad, fetchYearsWithSquads }
)(SquadList);
