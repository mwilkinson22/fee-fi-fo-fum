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
import AdminGameSquads from "../components/admin/games/AdminGameSquads";
import Select from "../components/admin/fields/Select";

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
		const newState = {};
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
		const { pathname } = this.props.location;
		const { status, slug } = this.state.game;
		const submenuItems = [
			{ label: "Overview", value: "" },
			{ label: "Pregame Squad", value: "pregame" },
			{ label: "Photos", value: "photos" }
		];

		if (status > 1) {
			submenuItems.push(
				{ label: "Pregame Squad Image", value: "pregame-image" },
				{ label: "Match Squads", value: "squads" }
			);
		}
		if (status > 2) {
			submenuItems.push(
				{ label: "Add In-Game Event", value: "event" },
				{ label: "Stats", value: "stats" }
			);
		}

		const currentOption = _.find(submenuItems, i => i.value === pathname.split(slug + "/")[1]);
		return (
			<Select
				options={submenuItems}
				defaultValue={currentOption}
				onChange={option => this.props.history.push(`/admin/game/${slug}/${option.value}`)}
			/>
		);
	}

	getContent() {
		const { game } = this.state;
		return (
			<div>
				<HelmetBuilder key="helmet" title={this.getPageTitle()} />
				<Switch>
					<Route
						path="/admin/game/:slug/squads"
						exact
						render={() => <AdminGameSquads game={game} />}
					/>
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
		const { teamTypes } = this.props;
		if (game === undefined) {
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
	{ fetchGames, fetchGameList }
)(AdminGamePage);
