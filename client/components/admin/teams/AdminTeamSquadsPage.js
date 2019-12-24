//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import Select from "react-select";

//Components
import NotFoundPage from "~/client/pages/NotFoundPage";
import AdminTeamSquadsCreate from "./AdminTeamSquadsCreate";
import AdminTeamSquadsEdit from "./AdminTeamSquadsEdit";

//Constants
import selectStyling from "~/constants/selectStyling";

//Helpers
import { getSquadsAsDropdown } from "~/helpers/teamHelper";

class AdminTeamSquadsPage extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, fullTeams } = nextProps;
		const { teamId, squadId } = match.params;
		const newState = {};

		//Get Current Team
		newState.team = fullTeams[teamId];

		//Determine pagetype
		if (!squadId) {
			newState.pageType = "root";
		} else if (squadId === "new") {
			newState.pageType = "new";
		} else {
			newState.pageType = "edit";
		}

		//If editing, we need the existing squad
		if (!newState.isNew) {
			newState.squad = newState.team.squads.find(({ _id }) => _id == squadId);
		}

		return newState;
	}

	renderSquadSelector() {
		const { squad, team } = this.state;
		const { match, history, teamTypes } = this.props;
		const { squadId } = match.params;

		const newOption = { value: "new", label: "Add New Squad" };
		const options = [newOption, ...getSquadsAsDropdown(team.squads, teamTypes)];

		//Get Default
		let value;
		if (squadId === "new") {
			value = newOption;
		} else if (squad) {
			value = { label: `${squad.year} ${teamTypes[squad._teamType].name}`, value: squad._id };
		}

		return (
			<div className="block-card team-squad-list">
				<Select
					styles={selectStyling}
					options={options}
					onChange={({ value }) => {
						if (value !== match.params.squad) {
							history.push(`/admin/teams/${team._id}/squads/${value}`);
						}
					}}
					value={value}
				/>
			</div>
		);
	}

	renderContent() {
		const { pageType, team, squad } = this.state;

		if (pageType === "new") {
			return <AdminTeamSquadsCreate team={team} />;
		} else if (pageType === "edit") {
			return <AdminTeamSquadsEdit team={team} squad={squad} />;
		}
	}

	render() {
		const { squad, pageType } = this.state;

		//Check for 404
		if (pageType === "edit" && !squad) {
			return <NotFoundPage message="Squad Not Found" />;
		}

		//Render
		return (
			<div className="container admin-team-squad-page">
				{this.renderSquadSelector()}
				{this.renderContent()}
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ teams }) {
	const { fullTeams, teamTypes } = teams;
	return { fullTeams, teamTypes };
}

// export default form;
export default connect(mapStateToProps)(AdminTeamSquadsPage);
