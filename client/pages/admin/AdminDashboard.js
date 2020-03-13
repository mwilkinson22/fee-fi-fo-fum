//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import LoadingPage from "../../components/LoadingPage";

//Cards
import AdminDashboardNeutralGames from "../../components/admin/dashboard/AdminDashboardNeutralGames";
import AdminDashboardPlayerDetails from "../../components/admin/dashboard/AdminDashboardPlayerDetails";
import AdminDashboardBirthdays from "../../components/admin/dashboard/AdminDashboardBirthdays";

//Actions
import { fetchNeutralGames } from "~/client/actions/neutralGamesActions";
import { fetchTeam } from "~/client/actions/teamsActions";

class AdminDashboard extends Component {
	constructor(props) {
		super(props);

		const { fullTeams, localTeam, fetchTeam, neutralGames, fetchNeutralGames } = props;

		//Ensure we have the full team
		if (!fullTeams[localTeam].fullData) {
			fetchTeam(localTeam, "full");
		}

		//Ensure we have current neutralGames
		const thisYear = new Date().getFullYear();
		if (!neutralGames || !neutralGames[thisYear]) {
			fetchNeutralGames(2021);
			fetchNeutralGames(thisYear);
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullTeams, localTeam, teamTypes, neutralGames } = nextProps;

		const newState = { isLoading: false };

		//Await dependencies
		const thisYear = new Date().getFullYear();
		if (!fullTeams[localTeam].fullData || !neutralGames || !neutralGames[thisYear]) {
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
		const { neutralGames, teamTypes } = this.props;
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
			AdminDashboardNeutralGames({ neutralGames, teamTypes }),
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

function mapStateToProps({ config, games, teams }) {
	const { localTeam } = config;
	const { neutralGames } = games;
	const { fullTeams, teamTypes } = teams;
	return { fullTeams, localTeam, neutralGames, teamTypes };
}

export default connect(mapStateToProps, { fetchTeam, fetchNeutralGames })(AdminDashboard);
