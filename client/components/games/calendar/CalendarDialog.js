//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

//Components
import PopUpDialog from "../../PopUpDialog";

//Dialog Pages
import CalendarCompetitionSelector from "./CalendarCompetitionSelector";
import CalendarGameSelector from "./CalendarGameSelector";
import CalendarOptionsSelector from "./CalendarOptionsSelector";

//Actions
import { fetchGames, getCalendar } from "../../../actions/gamesActions";

class CalendarDialog extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	renderContentDialog() {
		const { competitions, editCompetitions, games, editGames } = this.state;

		//First, select competitions
		if (!competitions || editCompetitions) {
			return (
				<CalendarCompetitionSelector
					initialCompetitions={competitions}
					onNext={competitions =>
						this.setState({ competitions, editCompetitions: false })
					}
				/>
			);
		}

		//Select games
		if (!games || editGames) {
			return (
				<CalendarGameSelector
					competitions={competitions}
					initialGames={games}
					onBack={() => this.setState({ editCompetitions: true, games: null })}
					onNext={games => this.setState({ games, editGames: false })}
				/>
			);
		}

		//Set Options
		return (
			<CalendarOptionsSelector
				games={games}
				onBack={() => this.setState({ editGames: true })}
			/>
		);
	}

	render() {
		const { onDestroy } = this.props;

		return (
			<PopUpDialog onDestroy={onDestroy} className="calendar-dialog">
				<h6>Download Fixture Calendar</h6>
				{this.renderContentDialog()}
			</PopUpDialog>
		);
	}
}

CalendarDialog.propTypes = {
	onDestroy: PropTypes.func.isRequired
};

function mapStateToProps({ config, games, teams }) {
	const { localTeam } = config;
	const { fullGames, gameList } = games;
	const { activeTeamType, fullTeams, teamTypes } = teams;
	return { localTeam, gameList, fullGames, activeTeamType, fullTeams, teamTypes };
}

export default connect(mapStateToProps, { fetchGames, getCalendar })(CalendarDialog);
