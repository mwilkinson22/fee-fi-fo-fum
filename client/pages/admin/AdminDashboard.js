//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import LoadingPage from "../../components/LoadingPage";

//Cards
import AdminDashboardGames from "../../components/admin/dashboard/AdminDashboardGames";
import AdminDashboardNeutralGames from "../../components/admin/dashboard/AdminDashboardNeutralGames";
import AdminDashboardTeamsWithoutGrounds from "../../components/admin/dashboard/AdminDashboardTeamsWithoutGrounds";
import AdminDashboardPlayerDetails from "../../components/admin/dashboard/AdminDashboardPlayerDetails";
import AdminDashboardBirthdays from "../../components/admin/dashboard/AdminDashboardBirthdays";

//Actions
import { fetchAdminDashboardData } from "~/client/actions/adminActions";
import { fetchGameList } from "~/client/actions/gamesActions";
import { fetchNeutralGames } from "~/client/actions/neutralGamesActions";

class AdminDashboard extends Component {
	constructor(props) {
		super(props);

		const {
			gameList,
			fetchGameList,
			neutralGames,
			fetchNeutralGames,
			fetchAdminDashboardData
		} = props;

		//Ensure we have all games loaded
		if (!gameList) {
			fetchGameList();
		}

		const thisYear = new Date().getFullYear();
		if (!neutralGames || !neutralGames[thisYear]) {
			fetchNeutralGames(thisYear);
		}

		//Set State
		this.state = { extraDataLoaded: false };

		//Get dashboard data from server
		//Check "window" to prevent calling twice from SSR
		if (typeof window != "undefined") {
			fetchAdminDashboardData().then(data =>
				this.setState({ ...data, extraDataLoaded: true })
			);
		}
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { gameList, neutralGames } = nextProps;

		const newState = { isLoading: false };

		//Await dependencies
		const thisYear = new Date().getFullYear();
		if (!gameList || !neutralGames || !neutralGames[thisYear] || !prevState.extraDataLoaded) {
			newState.isLoading = true;
			return newState;
		}

		return newState;
	}

	render() {
		const { gameList, neutralGames, teamList, teamTypes } = this.props;
		const {
			birthdays,
			gamesWithIssues,
			isLoading,
			missingPlayerDetails,
			teamsWithoutGrounds
		} = this.state;

		//Await dependencies
		if (isLoading) {
			return <LoadingPage />;
		}

		//Render all components.
		//Each function below will either render a component or null/undefined.
		//We call them as functions rather than using <JSX />
		//so we can more easily check for null/undefined and not show
		//headers for empty sections
		const componentGroups = {
			"Immediate Action Required": [
				AdminDashboardTeamsWithoutGrounds({ teams: teamsWithoutGrounds }),
				AdminDashboardGames({ gamesWithIssues, gameList, teamList, teamTypes }),
				AdminDashboardNeutralGames({ neutralGames, teamTypes })
			],
			"Action Required": [AdminDashboardPlayerDetails({ missingPlayerDetails })],
			"No Action Required": [AdminDashboardBirthdays({ birthdays })]
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

function mapStateToProps({ games, teams }) {
	const { gameList, neutralGames } = games;
	const { teamList, teamTypes } = teams;
	return { gameList, neutralGames, teamList, teamTypes };
}

export default connect(mapStateToProps, {
	fetchAdminDashboardData,
	fetchGameList,
	fetchNeutralGames
})(AdminDashboard);
