import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchGames, fetchGameList } from "../actions/gamesActions";
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "../pages/NotFoundPage";
import { NavLink, Link, Switch, Route } from "react-router-dom";
import AdminGameOverview from "../components/admin/games/AdminGameOverview";
import AdminGamePregameSquads from "../components/admin/games/AdminGamePregameSquads";

class AdminGamePage extends Component {
	constructor(props) {
		super(props);
		const { slugMap, fetchGameList } = props;
		if (!slugMap) {
			fetchGameList();
		}
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, slugMap, fullGames, fetchGames } = nextProps;
		const { slug } = match.params;
		if (!slugMap) {
			return {};
		}
		if (!slugMap[slug]) {
			return { game: false };
		}

		const id = slugMap[slug].id;
		if (!fullGames[id]) {
			fetchGames([id]);
			return { game: undefined };
		} else {
			return { game: fullGames[id] };
		}
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
		const { game } = this.state;
		if (game === undefined) {
			return <LoadingPage />;
		} else if (!game) {
			return <NotFoundPage message="Game not found" />;
		} else {
			const date = new Date(game.date);
			return (
				<div className="admin-game-page admin-page">
					<section className="page-header">
						<div className="container">
							<Link
								className="nav-card card"
								to={`/admin/games/${
									date > new Date() ? "fixtures" : date.getFullYear()
								}`}
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

function mapStateToProps({ config, games }, ownProps) {
	const { fullGames, slugMap } = games;
	const { localTeam } = config;
	return { localTeam, fullGames, slugMap, ...ownProps };
}
export default connect(
	mapStateToProps,
	{ fetchGames }
)(AdminGamePage);
