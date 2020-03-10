//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, Switch, Route } from "react-router-dom";

//Components
import ErrorBoundary from "../../components/ErrorBoundary";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "../../components/HelmetBuilder";
import NotFoundPage from "../NotFoundPage";
import TeamImage from "../../components/teams/TeamImage";
import AdminGamePageNavigation from "../../components/admin/games/AdminGamePageNavigation";

//Forms
import AdminGameOverview from "../../components/admin/games/AdminGameOverview";
import AdminGameImages from "../../components/admin/games/AdminGameImages";
import AdminGamePregameSquads from "../../components/admin/games/AdminGamePregameSquads";
import AdminGamePregameImage from "../../components/admin/games/AdminGamePregameImage";
import AdminGameSquads from "../../components/admin/games/AdminGameSquads";
import AdminGameSquadImage from "../../components/admin/games/AdminGameSquadImage";
import AdminGameEvent from "../../components/admin/games/AdminGameEvent";
import AdminGameStats from "../../components/admin/games/AdminGameStats";
import AdminGamePostGame from "../../components/admin/games/AdminGamePostGame";
import AdminGamePostGameEvents from "../../components/admin/games/AdminGamePostGameEvents";

//Actions
import { fetchGames, reloadGames, fetchGameList } from "../../actions/gamesActions";

//Helpers
import { getLastGame, getNextGame, getScoreString } from "~/helpers/gameHelper";

class AdminGamePage extends Component {
	constructor(props) {
		super(props);
		const { gameList, fetchGameList } = props;
		if (!gameList) {
			fetchGameList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, gameList, fullGames, fetchGames } = nextProps;
		const newState = { isLoadingList: false };
		const { _id } = match.params;

		//Create or Edit
		newState.isNew = !_id;

		if (!newState.isNew) {
			//Await Game List
			if (!gameList) {
				return { isLoadingList: true };
			}

			//Check Game Exists
			if (!gameList[_id]) {
				newState.game = false;
				return newState;
			}

			if (fullGames[_id] && fullGames[_id].adminData) {
				newState.game = fullGames[_id];
				newState.isLoadingGame = false;
			} else {
				fetchGames([_id], "admin");
				newState.game = undefined;
				newState.isLoadingGame = true;
				return newState;
			}
		}

		return newState;
	}

	getPageTitle() {
		const { game } = this.state;
		const { fullTeams, localTeam } = this.props;

		//Use helper to try and get a score string
		let string = getScoreString(game, fullTeams[localTeam]);

		//If this fails (i.e. if there are no scores), create a simple H vs A
		if (!string) {
			const teams = [fullTeams[localTeam].nickname, "vs", game._opposition.name.short];
			if (game.isAway) {
				teams.reverse();
			}
			string = teams.join(" ");
		}

		return `${string} - ${game.date.toString("dd/MM/yyyy")}`;
	}

	renderAdjacentGameLinks() {
		const { gameList, teamList, teamTypes } = this.props;
		const { game, isNew } = this.state;

		//Only for existing games
		if (isNew) {
			return null;
		}

		//Get Next and Last links
		const gameIds = {
			last: getLastGame(game._id, gameList),
			next: getNextGame(game._id, gameList)
		};

		//Convert to links
		//Returns { last: <Link />, next: <Link />}
		const links = _.mapValues(gameIds, (id, type) => {
			const adjacentGame = gameList[id];

			//Ignore if no game is found
			if (!adjacentGame) {
				return null;
			}

			//Get the opposition team
			const team = teamList[adjacentGame._opposition];

			return (
				<Link
					to={`/admin/game/${adjacentGame._id}`}
					key={type}
					className={`card nav-card ${type}`}
					style={{ background: team.colours.main, color: team.colours.text }}
				>
					<span>{adjacentGame.date.toString("ddd dS MMM")}</span>
					<TeamImage team={team} size="small" />
					<span>{type == "last" ? "\u25c0" : "\u25b6"}</span>
				</Link>
			);
		});

		//Add in the link to the corresponding game list
		const listYear = game.date > new Date() ? "fixtures" : game.date.getFullYear();
		const listTeamType = _.find(teamTypes, teamType => teamType._id === game._teamType).slug;
		const listUrl = `/admin/games/${listYear}/${listTeamType}`;
		const listText = listYear === "fixtures" ? "Fixtures" : `${listYear} Results`;

		//Convert this into a nav-card
		links.list = (
			<Link className="nav-card card main" to={listUrl}>
				Return to {listText}
			</Link>
		);

		return (
			<div className="navigation">
				{links.last}
				{links.list}
				{links.next}
			</div>
		);
	}

	renderHeader() {
		const { game, isNew } = this.state;
		const { reloadGames } = this.props;

		let viewLink, submenu, refreshButton;
		if (!isNew) {
			//Frontend Link
			viewLink = (
				<Link to={`/games/${game.slug}`} className="card nav-card">
					View on frontend
				</Link>
			);

			//Dropdown Nav
			submenu = <AdminGamePageNavigation game={game} />;

			//Refresh Button
			refreshButton = (
				<span className="refresh" onClick={() => reloadGames([game._id], "admin")}>
					↺
				</span>
			);
		}

		//Page Title
		const title = isNew ? "Add New Game" : this.getPageTitle();

		return (
			<section className="page-header">
				<HelmetBuilder title={title} />
				<div className="container">
					<h1 key="header">
						{title} {refreshButton}
					</h1>
					{this.renderAdjacentGameLinks()}
					{viewLink}
					{submenu}
				</div>
			</section>
		);
	}

	renderContent() {
		const { game, isNew } = this.state;
		let content;

		if (isNew) {
			content = <Route path="/" component={AdminGameOverview} />;
		} else {
			const { scoreOnly } = game._competition.instance;
			const path = `/admin/game/:_id`;
			content = (
				<Switch>
					<Route path={`${path}/post-game-events`} component={AdminGamePostGameEvents} />
					<Route path={`${path}/post-game`} component={AdminGamePostGame} />
					<Route
						path={`${path}/stats`}
						render={() => <AdminGameStats scoreOnly={scoreOnly} />}
					/>
					<Route
						path={`${path}/scores`}
						render={() => <AdminGameStats scoreOnly={true} />}
					/>
					<Route path={`${path}/event`} component={AdminGameEvent} />
					<Route path={`${path}/squad-images`} component={AdminGameSquadImage} />
					<Route path={`${path}/squads`} component={AdminGameSquads} />
					<Route path={`${path}/pregame-image`} component={AdminGamePregameImage} />
					<Route path={`${path}/images`} component={AdminGameImages} />
					<Route path={`${path}/pregame`} component={AdminGamePregameSquads} />
					<Route path={path} exact component={AdminGameOverview} />
					<Route path="/" component={NotFoundPage} />
				</Switch>
			);
		}

		return (
			<section className="form">
				<div className="container">
					<ErrorBoundary>{content}</ErrorBoundary>
				</div>
			</section>
		);
	}

	render() {
		const { game, isLoadingList, isLoadingGame, isNew } = this.state;

		//Await all data
		if (isLoadingList || isLoadingGame) {
			return <LoadingPage />;
		}

		//404
		if (!isNew && !game) {
			return <NotFoundPage message="Game not found" />;
		}

		return (
			<div className="admin-game-page admin-page">
				{this.renderHeader()}
				{this.renderContent()}
			</div>
		);
	}
}

function mapStateToProps({ config, games, teams }) {
	const { fullGames, gameList } = games;
	const { fullTeams, teamTypes, teamList } = teams;
	const { localTeam } = config;
	return { localTeam, fullGames, teamList, gameList, teamTypes, fullTeams };
}
export default connect(mapStateToProps, { fetchGames, reloadGames, fetchGameList })(AdminGamePage);
