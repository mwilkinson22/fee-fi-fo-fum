//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import LoadingPage from "../../components/LoadingPage";

//Cards
import AdminDashboardBirthdays from "../../components/admin/dashboard/AdminDashboardBirthdays";
import AdminDashboardPlayerDetails from "../../components/admin/dashboard/AdminDashboardPlayerDetails";

//Actions
import { fetchTeam } from "~/client/actions/teamsActions";

class AdminDashboard extends Component {
	constructor(props) {
		super(props);

		const { fullTeams, localTeam, fetchTeam } = props;

		//Ensure we have the full team
		if (!fullTeams[localTeam].fullData) {
			fetchTeam(localTeam, "full");
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullTeams, localTeam, teamTypes } = nextProps;

		const newState = { isLoading: false };

		//Await dependencies
		if (!fullTeams[localTeam].fullData) {
			newState.isLoading = true;
			return newState;
		}

		//Define local team
		newState.team = fullTeams[localTeam];

		//Define "First Team" team type
		newState.firstTeam = _.sortBy(teamTypes, "sortOrder")[0];

		return newState;
	}

	render() {
		const { firstTeam, isLoading, team } = this.state;

		//Await dependencies
		if (isLoading) {
			return <LoadingPage />;
		}

		//Render all components.
		//Each component below will either render a component or undefined.
		//We call them as functions rather than using <JSX />
		//so we can more easily access the null data
		const content = [
			AdminDashboardPlayerDetails({ team, firstTeam }),
			AdminDashboardBirthdays({ team })
		].filter(_.identity);

		return (
			<section className="admin-dashboard-page">
				<div className="container">
					<div className="card-wrapper">{content}</div>
				</div>
			</section>
		);
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams, teamTypes } = teams;
	return { fullTeams, localTeam, teamTypes };
}

export default connect(mapStateToProps, { fetchTeam })(AdminDashboard);
