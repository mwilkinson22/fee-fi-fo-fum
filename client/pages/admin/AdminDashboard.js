//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import LoadingPage from "../../components/LoadingPage";

//Cards
import AdminDashboardNeutralGames from "../../components/admin/dashboard/AdminDashboardNeutralGames";
import AdminDashboardTeamsWithoutGrounds from "../../components/admin/dashboard/AdminDashboardTeamsWithoutGrounds";
import AdminDashboardPlayerDetails from "../../components/admin/dashboard/AdminDashboardPlayerDetails";
import AdminDashboardBirthdays from "../../components/admin/dashboard/AdminDashboardBirthdays";

//Actions
import { fetchNeutralGames } from "~/client/actions/neutralGamesActions";
import { fetchTeam, fetchTeamsWithoutGrounds } from "~/client/actions/teamsActions";

class AdminDashboard extends Component {
	constructor(props) {
		super(props);

		const {
			fullTeams,
			localTeam,
			fetchTeam,
			neutralGames,
			fetchNeutralGames,
			fetchTeamsWithoutGrounds
		} = props;

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

		//Set State
		this.state = {};

		//Get teams without grounds
		fetchTeamsWithoutGrounds().then(teamsWithoutGrounds =>
			this.setState({ teamsWithoutGrounds })
		);
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { teamsWithoutGrounds } = prevState;
		const { fullTeams, localTeam, teamTypes, neutralGames } = nextProps;

		const newState = { isLoading: false };

		//Await dependencies
		const thisYear = new Date().getFullYear();
		if (
			!fullTeams[localTeam].fullData ||
			!neutralGames ||
			!neutralGames[thisYear] ||
			!teamsWithoutGrounds
		) {
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
		const { firstTeam, isLoading, team, teamsWithoutGrounds } = this.state;

		//Await dependencies
		if (isLoading) {
			return <LoadingPage />;
		}

		//Render all components.
		//Each function below will either render a component or null/undefined.
		//We call them as functions rather than using <JSX />
		//so we can more easily access the null data
		const componentGroups = {
			"Immediate Action Required": [
				AdminDashboardTeamsWithoutGrounds({ teams: teamsWithoutGrounds }),
				AdminDashboardNeutralGames({ neutralGames, teamTypes })
			],
			"Action Required": [AdminDashboardPlayerDetails({ team, firstTeam })],
			"No Action Required": [AdminDashboardBirthdays({ team })]
		};

		const content = _.map(componentGroups, (allComponents, label) => {
			const components = allComponents.filter(_.identity);
			if (components.length) {
				return (
					<div className="card-wrapper" key={label}>
						<h2>{label}</h2>
						{components}
					</div>
				);
			}
		}).filter(_.identity);

		return (
			<section className="admin-dashboard-page">
				<div className="container">{content}</div>
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

export default connect(mapStateToProps, { fetchTeam, fetchTeamsWithoutGrounds, fetchNeutralGames })(
	AdminDashboard
);
