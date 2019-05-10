import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchGames, fetchGameList } from "../actions/gamesActions";
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "../pages/NotFoundPage";
import { Link, Switch, Route } from "react-router-dom";
import AdminGameOverview from "../components/admin/games/AdminGameOverview";
import AdminGameTestImage from "../components/admin/games/AdminGameTestImage";
import AdminGamePregameSquads from "../components/admin/games/AdminGamePregameSquads";
import AdminGamePregameImage from "../components/admin/games/AdminGamePregameImage";
import AdminGameSquads from "../components/admin/games/AdminGameSquads";
import AdminGameEvent from "../components/admin/games/AdminGameEvent";
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

	static getDerivedStateFromProps(nextProps, prevState) {
		const { match, slugMap, gameList, fullGames, fetchGames } = nextProps;
		const { slug } = match.params;
		let { lastGameId } = prevState;
		const newState = {};
		if (!slugMap) {
			return newState;
		}
		if (!slugMap[slug]) {
			newState.game = false;
		}

		//Get Game Id
		const id = slugMap[slug].id;

		//Get Previous Game Id
		if (lastGameId === undefined) {
			const { _teamType, date } = gameList[id];
			const lastGameList = _.chain(gameList)
				.filter(g => g._teamType == _teamType)
				.filter(g => g.date < date)
				.orderBy(["date"], ["desc"])
				.map(g => g._id)
				.value();
			lastGameId = newState.lastGameId = lastGameList.length ? lastGameList[0] : false;
		}

		//Get Games To Load
		const gamesRequired = [id];
		if (lastGameId) {
			gamesRequired.push(lastGameId);
		}
		const gamesToLoad = _.reject(gamesRequired, id => fullGames[id]);

		if (gamesToLoad.length) {
			fetchGames(gamesToLoad);
			newState.game = undefined;
			newState.lastGame = undefined;
		} else {
			newState.game = fullGames[id];
			newState.lastGame = lastGameId ? fullGames[lastGameId] : false;
		}

		return newState;
	}

	getPageTitle() {
		const { game } = this.state;
		const { localTeam } = this.props;
		const { isAway, score, _opposition, date } = game;
		let strings;
		if (score) {
			strings = [
				"Giants",
				" ",
				score[localTeam],
				"-",
				score[_opposition._id],
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
		const { status, slug, pregameSquads } = this.state.game;
		const submenuItems = [
			{ label: "TEST - Fixture Image", value: "test-image" },
			{ label: "Overview", value: "" },
			{ label: "Pregame Squad", value: "pregame" },
			{ label: "Photos", value: "photos" }
		];

		if (pregameSquads.length) {
			submenuItems.push({ label: "Pregame Squad Image", value: "pregame-image" });
		}

		if (status >= 1) {
			submenuItems.push({ label: "Match Squads", value: "squads" });
		}
		if (status >= 2) {
			submenuItems.push(
				{ label: "Add In-Game Event", value: "event" },
				{ label: "Stats", value: "stats" }
			);
		}

		const currentPath = pathname.split(slug)[1].replace(/^\//, "");
		const currentOption = _.find(submenuItems, i => i.value === currentPath);
		return (
			<Select
				options={submenuItems}
				defaultValue={currentOption}
				isSearchable={false}
				onChange={option => this.props.history.push(`/admin/game/${slug}/${option.value}`)}
			/>
		);
	}

	getContent() {
		const { game, lastGame } = this.state;
		return (
			<div>
				<HelmetBuilder key="helmet" title={this.getPageTitle()} />
				<Switch>
					<Route
						path="/admin/game/:slug/test-image"
						exact
						render={() => <AdminGameTestImage game={game} />}
					/>
					<Route
						path="/admin/game/:slug/event"
						exact
						render={() => <AdminGameEvent game={game} />}
					/>
					<Route
						path="/admin/game/:slug/squads"
						exact
						render={() => <AdminGameSquads game={game} />}
					/>
					<Route
						path="/admin/game/:slug/pregame-image"
						exact
						render={() => <AdminGamePregameImage game={game} lastGame={lastGame} />}
					/>
					<Route
						path="/admin/game/:slug/pregame"
						exact
						render={() => <AdminGamePregameSquads game={game} lastGame={lastGame} />}
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
	const { fullGames, slugMap, gameList } = games;
	const { teamTypes } = teams;
	const { localTeam } = config;
	return { localTeam, fullGames, teams, slugMap, gameList, teamTypes, ...ownProps };
}
export default connect(
	mapStateToProps,
	{ fetchGames, fetchGameList }
)(AdminGamePage);
