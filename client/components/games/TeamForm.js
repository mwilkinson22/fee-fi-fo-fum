//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Components
import LeagueTable from "../seasons/LeagueTable";
import TeamFormHeadToHead from "./TeamFormHeadToHead";
import TeamFormPerTeam from "./TeamFormPerTeam";

class TeamForm extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { game } = nextProps;
		const newState = { game };

		//Show League Table?
		newState.showTable = game._competition.type === "League";

		return newState;
	}

	renderTable() {
		const { localTeam } = this.props;
		const { game, showTable } = this.state;
		if (showTable) {
			return (
				<div>
					<LeagueTable
						competition={game._competition._id}
						year={game.date.getFullYear()}
						highlightTeams={[localTeam, game._opposition._id]}
					/>
				</div>
			);
		}
	}

	render() {
		const { game, showTable } = this.state;

		return (
			<section className="form">
				<div className="container">
					<h2>Head to Head</h2>
					<TeamFormHeadToHead allCompetitions={true} game={game} />
					<div className="team-form-wrapper">
						<div className={showTable ? "with-table" : null}>
							<TeamFormPerTeam
								allCompetitions={true}
								game={game}
								includeHeader={true}
							/>
							{this.renderTable()}
						</div>
					</div>
				</div>
			</section>
		);
	}
}

TeamForm.propTypes = {
	game: PropTypes.object.isRequired
};

function mapStateToProps({ config }) {
	const { localTeam } = config;
	return { localTeam };
}

export default connect(mapStateToProps)(TeamForm);
