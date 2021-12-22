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
import CalendarSimpleOrAdvancedSelector from "~/client/components/games/calendar/CalendarSimpleOrAdvancedSelector";

class CalendarDialog extends Component {
	constructor(props) {
		super(props);

		this.state = { useCustomOptions: null };
	}

	renderContentDialog() {
		const { selectedTeamTypes, showAllTeamTypes, editTeamTypes, options, editOptions, useCustomOptions } =
			this.state;

		if (useCustomOptions === null) {
			return (
				<CalendarSimpleOrAdvancedSelector onNext={useCustomOptions => this.setState({ useCustomOptions })} />
			);
		}

		if (useCustomOptions) {
			//First, select competitions
			if (!selectedTeamTypes || editTeamTypes) {
				return (
					<CalendarTeamTypeSelector
						initialTeamTypes={selectedTeamTypes}
						initialShowAll={showAllTeamTypes}
						onBack={() => this.setState({ useCustomOptions: null })}
						onNext={(selectedTeamTypes, showAllTeamTypes) =>
							this.setState({
								selectedTeamTypes,
								showAllTeamTypes,
								editTeamTypes: false
							})
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
		}

		const calendarOutcomeProps = {
			selectedTeamTypes,
			showAllTeamTypes,
			useCustomOptions
		};
		if (useCustomOptions) {
			calendarOutcomeProps.options = options;
			calendarOutcomeProps.onBack = () => this.setState({ editOptions: true });
		} else {
			calendarOutcomeProps.onBack = () => this.setState({ useCustomOptions: null });
		}
		return <CalendarOutcome {...calendarOutcomeProps} />;
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

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { activeTeamType, fullTeams, teamTypes } = teams;
	return { localTeam, activeTeamType, fullTeams, teamTypes };
}

export default connect(mapStateToProps)(CalendarDialog);
