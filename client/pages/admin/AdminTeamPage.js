//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, Switch, Route } from "react-router-dom";

//Components
import AdminTeamCoaches from "../../components/admin/teams/AdminTeamCoaches";
import AdminTeamGrounds from "../../components/admin/teams/AdminTeamGrounds";
import AdminTeamOverview from "../../components/admin/teams/AdminTeamOverview";
import AdminTeamSquadsPage from "../../components/admin/teams/AdminTeamSquadsPage";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "../../components/HelmetBuilder";
import NotFoundPage from "../NotFoundPage";
import TeamBanner from "../../components/teams/TeamBanner";
import SubMenu from "../../components/SubMenu";

//Actions
import { fetchTeam } from "../../actions/teamsActions";

class AdminTeamPage extends Component {
	constructor(props) {
		super(props);

		const { fullTeams, teamList, match, fetchTeam } = props;
		const { _id } = match.params;

		//Team exists, but full team is not yet loaded
		if (_id && teamList[_id] && !fullTeams[_id]) {
			fetchTeam(_id);
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, teamList, fullTeams } = nextProps;
		const { _id } = match.params;
		const newState = { isLoading: false };

		//Create or edit
		newState.isNew = !_id;

		//Validate existing entries
		if (!newState.isNew) {
			//Check for a valid id
			if (!teamList[_id]) {
				newState.team = false;
				return newState;
			}

			//Ensure full team has loaded
			if (!fullTeams[_id]) {
				newState.isLoading = true;
				return newState;
			}

			//Otherwise, assign the team to state
			newState.team = fullTeams[_id];
		}

		return newState;
	}

	getHeader() {
		const { isNew, team } = this.state;

		//Create Submenu
		let submenu;
		if (!isNew) {
			const items = [
				{ label: "Overview", slug: "", isExact: true },
				{ label: "Grounds", slug: "grounds" },
				{ label: "Squads", slug: "squads" },
				{ label: "Coaches", slug: "coaches" }
			];

			submenu = (
				<div className="container">
					<SubMenu items={items} rootUrl={`/admin/teams/${team._id}/`} />
				</div>
			);
		}

		//Header Text, Banner and Title
		let headerText, banner, title;
		if (isNew) {
			title = "Add New Team";
			headerText = <h1>{title}</h1>;
		} else {
			title = team.name.long;
			banner = <TeamBanner team={team} />;
		}

		return (
			<section className="page-header">
				<HelmetBuilder title={title} />
				<div className="container">
					<Link className="nav-card card" to="/admin/teams/">
						↩ Return to team list
					</Link>
					{headerText}
				</div>
				{banner}
				{submenu}
			</section>
		);
	}

	getContent() {
		return (
			<div className="container">
				<Switch>
					<Route path="/admin/teams/new" component={AdminTeamOverview} />

					<Route exact path="/admin/teams/:_id/coaches" component={AdminTeamCoaches} />
					<Route
						exact
						path="/admin/teams/:teamId/squads/:squadId"
						component={AdminTeamSquadsPage}
					/>
					<Route
						exact
						path="/admin/teams/:teamId/squads"
						component={AdminTeamSquadsPage}
					/>
					<Route path="/admin/teams/:_id/grounds" exact component={AdminTeamGrounds} />
					<Route path="/admin/teams/:_id" exact component={AdminTeamOverview} />
					<Route path="/" component={NotFoundPage} />
				</Switch>
			</div>
		);
	}

	render() {
		const { isLoading, isNew, team } = this.state;
		if (isLoading) {
			return <LoadingPage />;
		}

		if (!isNew && team === false) {
			return <NotFoundPage message="Team not found" />;
		}

		return (
			<div className="admin-team-page admin-page">
				{this.getHeader()}
				{this.getContent()}
			</div>
		);
	}
}

function mapStateToProps({ teams }) {
	const { fullTeams, teamList } = teams;
	return { fullTeams, teamList };
}
export default connect(mapStateToProps, { fetchTeam })(AdminTeamPage);
