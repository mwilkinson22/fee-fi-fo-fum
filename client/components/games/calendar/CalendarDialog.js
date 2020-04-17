//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

//Components
import PopUpDialog from "../../PopUpDialog";

//Dialog Pages
import CalendarTeamTypeSelector from "./CalendarTeamTypeSelector";
import CalendarOptionsSelector from "./CalendarOptionsSelector";
import CalendarOutcome from "./CalendarOutcome";

class CalendarDialog extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	renderContentDialog() {
		const {
			selectedTeamTypes,
			showAllTeamTypes,
			editTeamTypes,
			options,
			editOptions
		} = this.state;

		//First, select competitions
		if (!selectedTeamTypes || editTeamTypes) {
			return (
				<CalendarTeamTypeSelector
					initialTeamTypes={selectedTeamTypes}
					initialShowAll={showAllTeamTypes}
					onNext={(selectedTeamTypes, showAllTeamTypes) =>
						this.setState({ selectedTeamTypes, showAllTeamTypes, editTeamTypes: false })
					}
				/>
			);
		}

		//Set Options
		if (!options || editOptions) {
			return (
				<CalendarOptionsSelector
					initialOptions={options}
					selectedTeamTypes={selectedTeamTypes}
					showAllTeamTypes={showAllTeamTypes}
					onBack={() => this.setState({ editTeamTypes: true })}
					onNext={options => this.setState({ options, editOptions: false })}
				/>
			);
		}

		return (
			<CalendarOutcome
				onBack={() => this.setState({ editOptions: true })}
				options={options}
				selectedTeamTypes={selectedTeamTypes}
				showAllTeamTypes={showAllTeamTypes}
			/>
		);
	}

	render() {
		const { onDestroy } = this.props;

		return (
			<PopUpDialog onDestroy={onDestroy} className="calendar-dialog">
				<h6>Subscribe to Fixtures</h6>
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

export default connect(mapStateToProps)(CalendarDialog);
