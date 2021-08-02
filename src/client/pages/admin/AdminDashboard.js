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
import { fetchNeutralGames } from "~/client/actions/neutralGamesActions";

class AdminDashboard extends Component {
	constructor(props) {
		super(props);

		const { neutralGames, fetchNeutralGames } = props;

		const thisYear = new Date().getFullYear();
		if (!neutralGames || !neutralGames[thisYear]) {
			fetchNeutralGames(thisYear);
		}

		//Set State
		this.state = { extraDataLoaded: false, entireYearLoaded: false };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { neutralGames } = nextProps;

		const newState = { isLoading: false };

		//Await dependencies
		const thisYear = new Date().getFullYear();
		if (!neutralGames || !neutralGames[thisYear] || !prevState.extraDataLoaded) {
			newState.isLoading = true;
			return newState;
		}

		return newState;
	}

	componentDidMount() {
		//Get dashboard data from server
		//Check "window" to prevent calling twice from SSR
		if (typeof window != "undefined") {
			this.loadData(false);
		}
	}

	loadData(entireYear) {
		const { fetchAdminDashboardData } = this.props;

		this.setState({
			extraDataLoaded: false
		});

		fetchAdminDashboardData(entireYear).then(data =>
			this.setState({ ...data, extraDataLoaded: true, entireYearLoaded: entireYear })
		);
	}

	render() {
		const { neutralGames, teamList, teamTypes } = this.props;
		const {
			birthdays,
			gamesWithIssues,
			isLoading,
			missingPlayerDetails,
			teamsWithoutGrounds,
			entireYearLoaded
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
				AdminDashboardGames({ gamesWithIssues, teamList, teamTypes }),
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

		//Conditionally add "Entire Year" selector
		if (!entireYearLoaded) {
			content.unshift(
				<div className="card-wrapper" key="full-year-selector">
					<div className="form-card">
						<span>By default, Admin Dashboard only checks for the last 2 weeks' worth of games. </span>
						<span className="pseudo-link" onClick={() => this.loadData(true)}>
							Click Here{" "}
						</span>
						<span>to check for the entire year. This may take some time.</span>
					</div>
				</div>
			);
		}

		return (
			<section className="admin-dashboard-page">
				<div className="container">{content}</div>
			</section>
		);
	}
}

function mapStateToProps({ games, teams }) {
	const { neutralGames } = games;
	const { teamList, teamTypes } = teams;
	return { neutralGames, teamList, teamTypes };
}

export default connect(mapStateToProps, {
	fetchAdminDashboardData,
	fetchNeutralGames
})(AdminDashboard);
