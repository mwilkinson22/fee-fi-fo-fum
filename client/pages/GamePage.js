//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import HelmetBuilder from "../components/HelmetBuilder";
import LoadingPage from "../components/LoadingPage";
import Countdown from "../components/games/Countdown";
import GameHeaderImage from "../components/games/GameHeaderImage";
import NotFoundPage from "./NotFoundPage";
import BroadcasterImage from "../components/broadcasters/BroadcasterImage";
import TeamBanner from "../components/teams/TeamBanner";
import TeamForm from "../components/games/TeamForm";
import PregameSquadList from "../components/games/PregameSquadList";
import MatchSquadList from "../components/games/MatchSquadList";
import GameEvents from "../components/games/GameEvents";
import NewsPostCard from "../components/news/NewsPostCard";
import HeadToHeadStats from "../components/games/HeadToHeadStats";
import FanPotmVoting from "../components/games/FanPotmVoting";
import GameStars from "../components/games/GameStars";
import LeagueTable from "~/client/components/seasons/LeagueTable";
import StatsTables from "~/client/components/games/StatsTables";
import ManOfSteelPoints from "~/client/components/games/ManOfSteelPoints";
import PageSwitch from "../components/PageSwitch";

//Actions
import { fetchGames, fetchGameList } from "../actions/gamesActions";
import { fetchTeam } from "../actions/teamsActions";
import { fetchPostList } from "~/client/actions/newsActions";

//Constants
import { imagePath, gameImagePath } from "../extPaths";
import { Redirect } from "react-router-dom";

//Helpers
import { matchSlugToItem } from "~/helpers/routeHelper";
import { getLastGame } from "~/helpers/gameHelper";
import TeamImage from "~/client/components/teams/TeamImage";
import PlayerStatsHelper from "~/client/helperClasses/PlayerStatsHelper";
import playerStatTypes from "~/constants/playerStatTypes";

class GamePage extends Component {
	constructor(props) {
		super(props);

		const { gameList, fetchGameList, postList, fetchPostList } = props;

		if (!gameList) {
			fetchGameList();
		}

		if (!postList) {
			fetchPostList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = { redirect: null };

		const {
			match,
			redirects,
			gameList,
			fullGames,
			fetchGames,
			fullTeams,
			localTeam
		} = nextProps;

		if (gameList && fullTeams[localTeam]) {
			const { item, redirect } = matchSlugToItem(match.params.slug, gameList, redirects);

			if (redirect) {
				newState.redirect = `/games/${item.slug}`;
			} else if (!item) {
				newState.game = false;
			} else {
				const { _id } = item;
				const previousId = getLastGame(_id, gameList);

				//Get Previous Id
				const gamesRequired = [_id];
				if (previousId) {
					gamesRequired.push(previousId);
				}

				//Check for missing games
				const gamesToLoad = gamesRequired.filter(
					id => !fullGames[id] || !fullGames[id].pageData
				);

				if (gamesToLoad.length) {
					fetchGames(gamesToLoad, "gamePage");
					newState.game = undefined;
				} else {
					newState.game = fullGames[_id];
					newState.previousGame = fullGames[previousId];
					newState.isFixture = newState.game.date >= new Date();

					//Update Stat Table on game change
					if (newState.game != prevState.game) {
						newState.statTableTeam = "both";
					}
				}
			}
		}

		return newState;
	}

	generateHeaderInfoBar() {
		const { game } = this.state;
		const fields = [
			<span key="ground">
				{game._ground.name}, {game._ground.address._city.name}
			</span>,
			<span key="date">{game.date.toString("dddd dS MMM yyyy H:mm")}</span>,
			<span key="title">{game.title}</span>
		];

		if (game.hashtags && game.hashtags.length) {
			fields.push(
				<span key="hashtag" className="hashtag">
					#{game.hashtags[0]}
				</span>
			);
		}

		if (game._broadcaster) {
			fields.push(<BroadcasterImage broadcaster={game._broadcaster} />);
		}

		return (
			<ul>
				{fields.map((field, i) => (
					<li key={i}>{field}</li>
				))}
			</ul>
		);
	}

	generateTeamBanners() {
		const { game } = this.state;
		const { isAway, _opposition } = game;
		const score = game.score || game.scoreOverride;
		const { localTeam, fullTeams } = this.props;
		let teams = [fullTeams[localTeam], _opposition];
		if (isAway) {
			teams = teams.reverse();
		}

		return teams.map(team => (
			<TeamBanner key={team._id} team={team} score={score ? score[team._id] : null} />
		));
	}

	generateEditLink() {
		const { authUser } = this.props;
		const { game } = this.state;
		if (authUser) {
			return (
				<Link to={`/admin/game/${game._id}`} className="nav-card">
					Edit this game
				</Link>
			);
		} else {
			return null;
		}
	}

	generateCountdown() {
		const { isFixture, game } = this.state;
		if (isFixture) {
			return (
				<section className="countdown">
					<div className="container">
						<h3>Countdown to Kickoff</h3>
						<Countdown
							date={game.date}
							onFinish={() => this.setState({ isFixture: false })}
						/>
					</div>
				</section>
			);
		} else {
			return null;
		}
	}

	generatePregameList() {
		const { game, previousGame } = this.state;
		if (!game._competition.instance.usesPregameSquads || game.squadsAnnounced) {
			return null;
		} else {
			return <PregameSquadList game={game} previousGame={previousGame} />;
		}
	}

	generateEvents() {
		const { game } = this.state;
		if (game.squadsAnnounced && _.sum(_.values(game.score))) {
			return (
				<section className="game-events">
					<div className="container">
						<GameEvents game={game} />
					</div>
				</section>
			);
		} else {
			return null;
		}
	}

	generateManOfSteel() {
		const { manOfSteel, _competition } = this.state.game;
		if (_competition.instance.manOfSteelPoints && manOfSteel && manOfSteel.length) {
			return <ManOfSteelPoints game={this.state.game} />;
		} else {
			return null;
		}
	}

	generateSquads() {
		const { game } = this.state;
		if (game.squadsAnnounced) {
			return <MatchSquadList game={game} />;
		} else {
			return null;
		}
	}

	generateForm() {
		if (this.state.isFixture) {
			return <TeamForm game={this.state.game} />;
		} else {
			return null;
		}
	}

	generateNewsPosts() {
		const { postList } = this.props;
		const { game } = this.state;
		let gamePosts = [];
		if (postList) {
			gamePosts = _.chain(postList)
				.filter(p => p._game == game._id)
				.sortBy("dateCreated")
				.reverse()
				.map(p => <NewsPostCard post={p} key={p._id} />)
				.value();
		}

		if (gamePosts.length) {
			return (
				<section className="news">
					<h2>News</h2>
					<div className="container">
						<div className="post-list">{gamePosts}</div>
					</div>
				</section>
			);
		} else {
			return null;
		}
	}

	getPageTitle() {
		const { isAway, scores, _opposition, date } = this.state.game;
		let strings;
		if (scores) {
			strings = [
				"Huddersfield Giants",
				" ",
				scores["5c041478e2b66153542b3742"],
				"-",
				scores[_opposition._id],
				" ",
				_opposition.name.long
			];
		} else {
			strings = ["Huddersfield Giants", " vs ", _opposition.name.long];
		}
		if (isAway) {
			strings = strings.reverse();
		}

		return strings.join("") + " - " + date.toString("dd/MM/yyyy");
	}

	generateFanPotm() {
		const { fan_potm, _id } = this.state.game;
		if (fan_potm) {
			const { options, deadline } = fan_potm;
			if (options && options.length && deadline) {
				return (
					<section className="fan-potm-section">
						<div className="container">
							<FanPotmVoting id={_id} />
						</div>
					</section>
				);
			}
		}
	}

	generateStats() {
		const { game } = this.state;
		if (game._competition.instance.scoreOnly || game.status < 3) {
			return null;
		} else {
			return [
				<HeadToHeadStats game={game} key="head-to-head" />,
				<GameStars game={game} key="game-stars" />,
				this.generateStatsTableSection()
			];
		}
	}

	generateStatsTableSection() {
		const { localTeam, fullTeams } = this.props;
		const { game, statTableTeam } = this.state;

		//Generate Team Selector Data
		let tableSelectorOptions = [
			{ value: localTeam, label: fullTeams[localTeam].name.short },
			{ value: "both", label: "Both Teams" },
			{ value: game._opposition._id, label: game._opposition.name.short }
		];
		if (game.isAway) {
			tableSelectorOptions = tableSelectorOptions.reverse();
		}

		let filteredGame = _.clone(game);
		if (statTableTeam != "both") {
			filteredGame.playerStats = filteredGame.playerStats.filter(
				({ _team }) => _team == statTableTeam
			);
		}

		//Process game stats into rows
		const { isAway, _opposition, eligiblePlayers } = game;
		const rows = _.chain(filteredGame.playerStats)
			.map(p => ({ ...p, isAway: p._team == _opposition._id ? !isAway : isAway }))
			.orderBy(["isAway", "position"], ["asc", "asc"])
			.map((p, sortValue) => {
				const { _player, _team, stats } = p;
				const player = eligiblePlayers[_team].find(p => p._player._id == _player);

				const { number } = player;
				const { name, slug } = player._player;

				let first;
				const firstContent = [
					<div className="badge-wrapper" key="image">
						<TeamImage
							team={_team == _opposition._id ? _opposition : fullTeams[localTeam]}
							variant="dark"
							key="image"
						/>
					</div>,
					<div key="name" className="name">
						<div>{`${number ? `${number}. ` : ""}${name.first}`}</div>
						<div>{name.last}</div>
					</div>
				];

				if (_team == _opposition._id) {
					first = {
						content: <span>{firstContent}</span>,
						sortValue
					};
				} else {
					first = {
						content: <Link to={`/players/${slug}`}>{firstContent}</Link>,
						sortValue
					};
				}

				const formattedStats = _.chain(PlayerStatsHelper.processStats(stats))
					.mapValues()
					.mapValues((val, key) => {
						if (!playerStatTypes[key]) {
							return null;
						}
						return {
							content: PlayerStatsHelper.toString(key, val),
							sortValue: val
						};
					})
					.pickBy(_.identity)
					.value();

				const data = {
					first,
					...formattedStats
				};
				return { key: slug, data };
			})
			.value();

		return (
			<section className="stats-table" key="stats-table">
				<div className="container">
					<h2>Stats</h2>
					<PageSwitch
						currentValue={statTableTeam}
						onChange={statTableTeam => this.setState({ statTableTeam })}
						options={tableSelectorOptions}
					/>
					<StatsTables rows={rows} firstColumnHeader="Player" />
				</div>
			</section>
		);
	}

	generateLeagueTable() {
		const { localTeam } = this.props;
		const { _competition, date, status, _opposition } = this.state.game;
		if (status >= 2 && _competition.type == "League") {
			const dayOfWeek = date.getDay();
			let toDate;
			if (dayOfWeek == 1) {
				//If it's a Monday, advance to tuesday
				toDate = _.clone(date)
					.next()
					.tuesday();
			} else {
				//Otherwise get midnight the next monday
				toDate = _.clone(date)
					.next()
					.monday()
					.at("00:00:00");
			}

			return (
				<section className="league-table">
					<div className="container">
						<h2>After this round</h2>
						<LeagueTable
							competition={_competition._id}
							year={date.getFullYear()}
							toDate={toDate}
							highlightTeams={[localTeam, _opposition._id]}
						/>
					</div>
				</section>
			);
		}
	}

	render() {
		const { postList } = this.props;
		const { game, redirect } = this.state;
		if (redirect) {
			return <Redirect to={redirect} />;
		} else if (game === undefined) {
			return <LoadingPage />;
		} else if (!game) {
			return <NotFoundPage message="Game not found" />;
		} else if (!postList) {
			return <LoadingPage />;
		} else {
			//Get Helmet Image
			let cardImage;
			if (game.images.header) {
				cardImage = gameImagePath + "header/" + game.images.header;
			} else if (game.images.midpage) {
				cardImage = gameImagePath + "midpage/" + game.images.midpage;
			} else {
				cardImage =
					gameImagePath + "social/" + game._id + ".jpg?v=" + game.socialImageVersion;
			}

			return (
				<div className="game-page">
					<HelmetBuilder
						title={this.getPageTitle()}
						canonical={`/games/${game.slug}`}
						cardImage={cardImage}
						cardType="summary_large_image"
					/>
					<section className="header">
						<GameHeaderImage game={game} className="game-header-image" />
						<div className="game-details">
							<div className="container">{this.generateHeaderInfoBar()}</div>
						</div>
						<div className="team-banners">{this.generateTeamBanners()}</div>
						{this.generateEditLink()}
					</section>
					{this.generateCountdown()}
					{this.generateEvents()}
					{this.generateManOfSteel()}
					{this.generateFanPotm()}
					{this.generateNewsPosts()}
					{this.generatePregameList()}
					{this.generateForm()}
					{this.generateSquads()}
					{this.generateStats()}
					{this.generateLeagueTable()}
				</div>
			);
		}
	}
}

function mapStateToProps({ games, config, teams, news }) {
	const { fullGames, redirects, gameList } = games;
	const { localTeam, authUser } = config;
	const { fullTeams } = teams;
	const { postList } = news;
	return { fullGames, redirects, postList, localTeam, authUser, gameList, fullTeams };
}

async function loadData(store, path) {
	const slug = path.split("/")[2];
	const { localTeam } = store.getState().config;
	await Promise.all([
		store.dispatch(fetchPostList()),
		store.dispatch(fetchGameList()),
		store.dispatch(fetchTeam(localTeam))
	]);

	const { gameList, redirects } = store.getState().games;

	const { item } = matchSlugToItem(slug, gameList, redirects);

	if (item) {
		const gamesToLoad = [item._id];
		const previousId = getLastGame(item._id, gameList);
		if (previousId) {
			gamesToLoad.push(previousId);
		}

		return store.dispatch(fetchGames(gamesToLoad, "gamePage"));
	}
}

export default {
	component: connect(mapStateToProps, { fetchGames, fetchGameList, fetchTeam, fetchPostList })(
		GamePage
	),
	loadData
};
