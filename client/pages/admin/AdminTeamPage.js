import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchTeam } from "../../actions/teamsActions";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "../../components/HelmetBuilder";
import NotFoundPage from "../NotFoundPage";
import { NavLink, Link, Switch, Route } from "react-router-dom";

//Pages
import AdminTeamOverview from "../../components/admin/teams/AdminTeamOverview";
import AdminTeamSquads from "../../components/admin/teams/AdminTeamSquads";
import TeamBanner from "../../components/teams/TeamBanner";

class AdminTeamPage extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = {};

		const { match, teamList, fullTeams, fetchTeam } = nextProps;

		const { _id } = match.params;

		if (teamList[_id]) {
			newState.team = fullTeams[_id];
			if (!newState.team) {
				fetchTeam(_id);
			}
		} else {
			newState.team = false;
		}

		return newState;
	}

	getSubmenu() {
		const { _id } = this.state.team;
		const submenuItems = {
			Overview: "",
			Squads: "squads",
			Shirts: "shirts"
		};
		const submenu = _.map(submenuItems, (url, title) => {
			return (
				<NavLink
					key={url}
					exact={url.length === 0}
					to={`/admin/teams/${_id}/${url}`}
					activeClassName="active"
				>
					{title}
				</NavLink>
			);
		});
		return (
			<div className="sub-menu" key="menu">
				{submenu}
			</div>
		);
	}

	getContent() {
		return (
			<div>
				<HelmetBuilder title={this.state.team.name.long} />
				<Switch>
					<Route
						exact
						path="/admin/teams/:_id/squads/:squad"
						component={AdminTeamSquads}
					/>
					<Route exact path="/admin/teams/:_id/squads" component={AdminTeamSquads} />
					<Route path="/admin/teams/:_id" exact component={AdminTeamOverview} />
					<Route path="/" component={NotFoundPage} />
				</Switch>
			</div>
		);
	}

	render() {
		const { team } = this.state;
		if (team === undefined) {
			return <LoadingPage />;
		} else if (!team) {
			return <NotFoundPage message="Team not found" />;
		} else {
			return (
				<div className="admin-team-page admin-page">
					<section className="page-header">
						<div className="container">
							<Link className="nav-card card" to="/admin/teams/">
								↩ Return to team list
							</Link>
						</div>
						<TeamBanner team={team} />
						<div className="container">{this.getSubmenu()}</div>
					</section>
					{this.getContent()}
				</div>
			);
		}
	}
}

function mapStateToProps({ teams }) {
	const { fullTeams, teamList } = teams;
	return { fullTeams, teamList };
}
export default connect(
	mapStateToProps,
	{ fetchTeam }
)(AdminTeamPage);
