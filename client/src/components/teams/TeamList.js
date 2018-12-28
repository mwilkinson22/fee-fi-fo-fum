import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { fetchYearsWithSquads, fetchSquad } from "../../actions/teamsActions";
import LoadingPage from "../LoadingPage";
import _ from "lodash";

class TeamList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			squad: null
		};
	}

	async componentWillMount() {
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

	generateTeamList() {
		const { squad } = this.state;
		if (!squad) {
			return <LoadingPage />;
		} else {
			const playerList = _.map(squad, player => {
				const { number, slug, name } = player;
				return (
					<li key={player.id}>
						<Link to={`/players/${slug}`}>
							{number}: {name.first} {name.last}
						</Link>
					</li>
				);
			});
			return <ul>{playerList}</ul>;
		}
	}

	render() {
		return (
			<div className="team-list">
				<section className="page-header">
					<div className="container">
						<h1>{this.generatePageHeader()}</h1>
					</div>
				</section>
				<div className="container">{this.generateTeamList()}</div>
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
)(TeamList);
