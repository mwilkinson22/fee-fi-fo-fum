import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchGames, fetchGameList } from "../actions/gamesActions";
import { fetchAllTeamTypes } from "../actions/teamsActions";
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "../pages/NotFoundPage";
import { NavLink, Link, Switch, Route } from "react-router-dom";
import AdminGameOverview from "../components/admin/games/AdminGameOverview";
import AdminGamePregameSquads from "../components/admin/games/AdminGamePregameSquads";

class AdminGamePage extends Component {
	constructor(props) {
		super(props);
		const { slugMap, fetchGameList, teamTypes, fetchAllTeamTypes } = props;
		if (!slugMap) {
			fetchGameList();
		}

		if (!teamTypes) {
			fetchAllTeamTypes();
		}
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, slugMap, fullGames, fetchGames, teamTypes } = nextProps;
		const { slug } = match.params;
		const newState = { teamTypes };
		if (!slugMap) {
			return newState;
		}
		if (!slugMap[slug]) {
			newState.game = false;
		}

		const id = slugMap[slug].id;
		if (!fullGames[id]) {
			fetchGames([id]);
			newState.game = undefined;
		} else {
			newState.game = fullGames[id];
		}

		return newState;
	}

	getPageTitle() {
		const { game } = this.state;
		const { localTeam } = this.props;
		const { isAway, scores, _opposition, date } = game;
		let strings;
		if (scores) {
			strings = [
				"Giants",
				" ",
				scores[localTeam],
				"-",
				scores[_opposition._id],
				" ",
				_opposition.name.short
			];
		} else {
			strings = ["Giants", " vs ", _opposition.name.short];
		}
		if (isAway) {
			strings = strings.reverse();
		}

		return strings.join("") + " - " + new Date(date).toString("dd/MM/yyyy");
	}

	getSubmenu() {
		const { status, slug } = this.state.game;
		const submenuItems = {
			0: {
				Overview: "",
				"Pregame Squads": "pregame",
				Images: "images"
			},
			1: {
				"Match Squads": "squads"
			},
			2: {
				"In-Game Events": "events",
				"Set Stats": "stats"
			}
		};
		const submenu = _.map(submenuItems, (items, reqStatus) => {
			if (status >= reqStatus) {
				return _.map(items, (url, title) => {
					return (
						<NavLink
							key={url}
							exact
							to={`/admin/game/${slug}/${url}`}
							activeClassName="active"
						>
							{title}
						</NavLink>
					);
				});
			} else return null;
		});
		return (
			<div className="sub-menu" key="menu">
				{submenu}
			</div>
		);
	}

	getContent() {
		const { game } = this.state;
		return (
			<div>
				<HelmetBuilder key="helmet" title={this.getPageTitle()} />
				<Switch>
					<Route
						path="/admin/game/:slug/pregame"
						exact
						render={() => <AdminGamePregameSquads game={game} />}
					/>
					<Route
						path="/admin/game/:slug"
						exact
						render={() => <AdminGameOverview game={game} />}
					/>
					<Route path="/" component={NotFoundPage} />
				</Switch>
			</div>
		);
	}

	render() {
		const { game, teamTypes } = this.state;
		if (game === undefined || !teamTypes) {
			return <LoadingPage />;
		} else if (!game) {
			return <NotFoundPage message="Game not found" />;
		} else {
			const urlYear = game.date > new Date() ? "fixtures" : game.date.getFullYear();
			const urlSlug = _.find(teamTypes, teamType => teamType._id === game._teamType).slug;
			return (
				<div className="admin-game-page admin-page">
					<section className="page-header">
						<div className="container">
							<Link
								className="nav-card card"
								to={`/admin/games/${urlYear}/${urlSlug}`}
							>
								↩ Return to game list
							</Link>
							<h1 key="header">{this.getPageTitle()}</h1>
							{this.getSubmenu()}
						</div>
					</section>
					{this.getContent()}
				</div>
			);
		}
	}
}

function mapStateToProps({ config, games, teams }, ownProps) {
	const { fullGames, slugMap } = games;
	const { teamTypes } = teams;
	const { localTeam } = config;
	return { localTeam, fullGames, teams, slugMap, teamTypes, ...ownProps };
}
export default connect(
	mapStateToProps,
	{ fetchGames, fetchGameList, fetchAllTeamTypes }
)(AdminGamePage);
