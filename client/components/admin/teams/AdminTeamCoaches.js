//Modules
import React, { Component } from "react";
import { connect } from "react-redux";

//Actions
import { updateTeamSquad } from "../../../actions/teamsActions";

//Components
import AdminTeamAddCoach from "~/client/components/admin/teams/AdminTeamAddCoach";
import AdminTeamCurrentCoaches from "~/client/components/admin/teams/AdminTeamCurrentCoaches";

//Constants

class AdminTeamCoaches extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, fullTeams } = nextProps;
		const team = fullTeams[match.params._id];
		return { team };
	}

	getCurrentCoaches() {
		const { team } = this.state;
		if (team.coaches.length) {
			return <AdminTeamCurrentCoaches team={team} />;
		}
	}

	render() {
		const { team } = this.state;
		return (
			<div>
				<AdminTeamAddCoach team={team} />
				{this.getCurrentCoaches()}
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
export default connect(
	mapStateToProps,
	{ updateTeamSquad }
)(AdminTeamCoaches);
