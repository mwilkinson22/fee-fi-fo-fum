import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchTeam } from "../actions/teamsActions";
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "../pages/NotFoundPage";
import { NavLink, Link, Switch, Route } from "react-router-dom";

//Pages
import AdminTeamOverview from "../components/admin/teams/AdminTeamOverview";
import AdminTeamSquads from "../components/admin/teams/AdminTeamSquads";
import TeamBanner from "../components/teams/TeamBanner";

class AdminTeamPage extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = {};

		const { match, slugMap, fullTeams, fetchTeam } = nextProps;

		if (slugMap[match.params.slug]) {
			const { id } = slugMap[match.params.slug];
			if (!fullTeams[id]) {
				fetchTeam(id);
				newState.team = undefined;
			} else {
				newState.team = fullTeams[id];
			}
		} else {
			newState.team = false;
		}

		return newState;
	}

	getSubmenu() {
		const { slug } = this.state.team;
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
					to={`/admin/teams/${slug}/${url}`}
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
						path="/admin/teams/:slug/squads/:squad"
						component={AdminTeamSquads}
					/>
					<Route exact path="/admin/teams/:slug/squads" component={AdminTeamSquads} />
					<Route path="/admin/teams/:slug" exact component={AdminTeamOverview} />
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
	const { fullTeams, slugMap } = teams;
	return { fullTeams, slugMap };
}
export default connect(
	mapStateToProps,
	{ fetchTeam }
)(AdminTeamPage);
