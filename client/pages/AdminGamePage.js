import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchGames, fetchGameList } from "../actions/gamesActions";
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "../pages/NotFoundPage";
import TeamImage from "../components/teams/TeamImage";
import { Link, Switch, Route } from "react-router-dom";
import AdminGameOverview from "../components/admin/games/AdminGameOverview";
import AdminGamePregameSquads from "../components/admin/games/AdminGamePregameSquads";
import AdminGamePregameImage from "../components/admin/games/AdminGamePregameImage";
import AdminGameSquads from "../components/admin/games/AdminGameSquads";
import AdminGameSquadImage from "../components/admin/games/AdminGameSquadImage";
import AdminGameEvent from "../components/admin/games/AdminGameEvent";
import AdminGameStats from "../components/admin/games/AdminGameStats";
import AdminGameManOfSteel from "../components/admin/games/AdminGameManOfSteel";
import AdminGameManOfTheMatch from "../components/admin/games/AdminGameManOfTheMatch";
import Select from "../components/admin/fields/Select";
import { getLastGame, getNextGame } from "~/helpers/gameHelper";

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
			lastGameId = newState.lastGameId = getLastGame(id, gameList);
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

			//Check for man of steel
			newState.manOfSteelPoints = newState.game._competition.instance.manOfSteelPoints;
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
		const { manOfSteelPoints, game } = this.state;
		const { status, slug, pregameSquads, playerStats, _competition } = game;
		const { usesPregameSquads } = _competition.instance;
		const groups = ["Pre-game", "Match Day", "Post-game"];
		const submenuItems = [
			{ label: "Overview", value: "", group: 0 },
			{ label: "Photos", value: "photos", group: 0 }
		];

		if (usesPregameSquads) {
			submenuItems.push({ label: "Pregame Squad", value: "pregame", group: 0 });
			if (pregameSquads.length) {
				submenuItems.push({
					label: "Pregame Squad Image",
					value: "pregame-image",
					group: 0
				});
			}
		}

		if (status >= 1) {
			submenuItems.push({ label: "Squads", value: "squads", group: 1 });
		}

		if (_.keys(_.groupBy(playerStats, "_team")).length >= 1) {
			submenuItems.push({ label: "Squad Image", value: "squad-images", group: 1 });
		}

		if (status >= 2) {
			submenuItems.push(
				{ label: "Add In-Game Event", value: "event", group: 1 },
				{ label: "Scores", value: "scores", group: 1 },
				{ label: "Stats", value: "stats", group: 2 },
				{ label: "Man of the Match", value: "motm", group: 2 }
			);
			if (manOfSteelPoints) {
				submenuItems.push({ label: "Man of Steel", value: "man-of-steel", group: 2 });
			}
		}

		const currentPath = pathname.split(slug)[1].replace(/^\//, "");
		const currentOption = _.find(submenuItems, i => i.value === currentPath);
		const options = _.chain(submenuItems)
			.groupBy(({ group }) => groups[group])
			.map((options, label) => ({
				label,
				options
			}))
			.value();
		return (
			<Select
				options={options}
				defaultValue={currentOption}
				isSearchable={false}
				onChange={option => this.props.history.push(`/admin/game/${slug}/${option.value}`)}
			/>
		);
	}

	getNavigation() {
		const { gameList, teamList, teamTypes } = this.props;
		const { game } = this.state;

		//Get Next and Last links
		const gameIds = {
			last: getLastGame(game._id, gameList),
			next: getNextGame(game._id, gameList)
		};
		const links = _.mapValues(gameIds, (id, type) => {
			const game = gameList[id];
			if (!game) {
				return null;
			}
			const { slug, date, _opposition } = game;
			const team = teamList[_opposition];
			return (
				<Link
					to={`/admin/game/${slug}`}
					key={type}
					className={`card nav-card ${type}`}
					style={{ background: team.colours.main, color: team.colours.text }}
				>
					<span>{date.toString("ddd dS MMM")}</span>
					<TeamImage team={team} />
					<span>{type == "last" ? "🡸" : "🡺"}</span>
				</Link>
			);
		});

		//Get Main Link Info
		const urlYear = game.date > new Date() ? "fixtures" : game.date.getFullYear();
		const urlSlug = _.find(teamTypes, teamType => teamType._id === game._teamType).slug;

		return (
			<div className="navigation">
				{links.last}
				<Link className="nav-card card main" to={`/admin/games/${urlYear}/${urlSlug}`}>
					Return to {urlYear === "fixtures" ? "Fixtures" : `${urlYear} Results`}
				</Link>
				{links.next}
			</div>
		);
	}

	getContent() {
		const { game, lastGame, manOfSteelPoints } = this.state;
		return (
			<div>
				<HelmetBuilder title={this.getPageTitle()} canonical={`/admin/game/${game.slug}`} />
				<Switch>
					<Route
						path="/admin/game/:slug/man-of-steel"
						exact
						render={() =>
							manOfSteelPoints ? (
								<AdminGameManOfSteel game={game} />
							) : (
								<NotFoundPage />
							)
						}
					/>
					<Route
						path="/admin/game/:slug/motm"
						exact
						render={() => <AdminGameManOfTheMatch game={game} />}
					/>
					<Route
						path="/admin/game/:slug/stats"
						exact
						render={() => <AdminGameStats game={game} scoreOnly={false} />}
					/>
					<Route
						path="/admin/game/:slug/scores"
						exact
						render={() => <AdminGameStats game={game} scoreOnly={true} />}
					/>
					<Route
						path="/admin/game/:slug/event"
						exact
						render={() => <AdminGameEvent game={game} />}
					/>
					<Route
						path="/admin/game/:slug/squad-images"
						exact
						render={() => <AdminGameSquadImage game={game} />}
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
		if (game === undefined) {
			return <LoadingPage />;
		} else if (!game) {
			return <NotFoundPage message="Game not found" />;
		} else {
			return (
				<div className="admin-game-page admin-page">
					<section className="page-header">
						<div className="container">
							<h1 key="header">{this.getPageTitle()}</h1>
							{this.getNavigation()}
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
	const { teamTypes, teamList } = teams;
	const { localTeam } = config;
	return { localTeam, fullGames, teamList, slugMap, gameList, teamTypes, ...ownProps };
}
export default connect(
	mapStateToProps,
	{ fetchGames, fetchGameList }
)(AdminGamePage);
