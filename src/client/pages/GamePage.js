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
import GameTeamSelector from "../components/games/GameTeamSelector";
import MatchSquadList from "../components/games/MatchSquadList";
import GameEvents from "../components/games/GameEvents";
import NewsPostCard from "../components/news/NewsPostCard";
import NewsPostCardPlaceholder from "~/client/components/news/NewsPostCardPlaceholder";
import HeadToHeadStats from "../components/games/HeadToHeadStats";
import FanPotmVoting from "../components/games/FanPotmVoting";
import GameStars from "../components/games/GameStars";
import LeagueTable from "~/client/components/seasons/LeagueTable";
import StatsTables from "~/client/components/games/StatsTables";
import ManOfSteelPoints from "~/client/components/games/ManOfSteelPoints";
import GameGround from "../components/games/GameGround";
import PageSwitch from "../components/PageSwitch";
import TeamImage from "~/client/components/teams/TeamImage";

//Actions
import { fetchGames, fetchGameFromSlug } from "../actions/gamesActions";
import { fetchPostList } from "~/client/actions/newsActions";

//Helpers
import { calculateAdditionalStats } from "~/helpers/statsHelper";
import { getOrdinalNumber, scrollToElement } from "~/helpers/genericHelper";
import { isUnusedExtraInterchange, formatDate, getScoreString } from "~/helpers/gameHelper";

class GamePage extends Component {
	constructor(props) {
		super(props);

		const { match, slugMap, fetchGameFromSlug, fullGames } = props;

		//Work out whether to load game
		const { slug } = match.params;
		let loadGame = false;

		//If we've not tried to load it yet, then we need to do so
		if (slugMap[slug] === undefined) {
			loadGame = true;
		}

		//Alternatively if we've loaded the game but not with the
		//game page data level, we do so here:
		else if (slugMap[slug] !== false) {
			const game = fullGames[slugMap[slug]];
			loadGame = !(game && game.pageData);
		}

		if (loadGame) {
			fetchGameFromSlug(slug);
		}
		this.state = { isLoadingGame: loadGame, statTableTeam: "both" };
	}

	componentDidMount() {
		const scrollableElements = {
			selector: ".game-page-team-selector"
		};
		scrollToElement(this.props.location, scrollableElements);
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { match, slugMap, fullGames, postList, fetchPostList } = nextProps;
		const { slug } = match.params;
		const newState = {};

		//Ensure slug map is loaded
		if (slugMap[slug] !== undefined) {
			//We've had a result from fetchPersonFromGame
			newState.isLoadingGame = false;

			if (slugMap[slug] === false) {
				//404
				newState.game = false;
			} else {
				const _id = slugMap[slug];
				newState.game = fullGames[_id];
				newState.isFixture = newState.game.date >= new Date();

				//Get news post
				if (newState.game.newsPosts) {
					const missingPosts = newState.game.newsPosts.filter(id => !postList[id]);
					if (missingPosts.length) {
						if (!prevState.isLoadingPosts) {
							fetchPostList(missingPosts);
							newState.isLoadingPosts = true;
						}
					}
				}
				newState.isLoadingPosts = false;
			}
		}

		return newState;
	}

	generateHeaderInfoBar() {
		const { game } = this.state;
		const groundString = game._ground ? `${game._ground.name}, ${game._ground.address._city.name}` : "Venue TBD";

		const fields = [
			<span key="ground">{groundString}</span>,
			<span key="date">{formatDate(game, "MMM")}</span>,
			<span key="title">{game.title}</span>
		];

		if (game.date.getFullYear() > 2006 && game.hashtags && game.hashtags.length) {
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
		const { score } = game;
		return game.teams.map(team => <TeamBanner key={team._id} team={team} score={score ? score[team._id] : null} />);
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
		if (isFixture && !game.dateRange) {
			return (
				<section className="countdown">
					<div className="container">
						<h2>Countdown to Kickoff</h2>
						<Countdown date={game.date} onFinish={() => this.setState({ isFixture: false })} />
					</div>
				</section>
			);
		} else {
			return null;
		}
	}

	generatePregameList() {
		const { game } = this.state;
		if (!game._competition.instance.usesPregameSquads || game.squadsAnnounced) {
			return null;
		} else {
			return <PregameSquadList game={game} />;
		}
	}

	generateTeamSelector() {
		const { localTeam } = this.props;
		const { game, isFixture } = this.state;

		//Ensure it's a fixture with no squads announced
		if (game.squadsAnnounced || !isFixture) {
			return null;
		}

		//Check we have eligible players
		let showSelector = game.eligiblePlayers[localTeam].length;
		if (game._competition.instance.usesPregameSquads) {
			const pregameSquad = game.pregameSquads.find(({ _team }) => _team == localTeam);
			showSelector = pregameSquad && pregameSquad.squad && pregameSquad.squad.length;
		}

		if (showSelector) {
			return <GameTeamSelector game={game} />;
		}
	}

	generateEvents() {
		const { game } = this.state;
		if (game.squadsAnnounced && _.sum(_.values(game.score))) {
			return (
				<section className="game-events">
					<div className="container">
						<GameEvents game={game} includeDetails={true} />
					</div>
				</section>
			);
		} else {
			return null;
		}
	}

	generateManOfSteel() {
		const { game } = this.state;
		const { manOfSteel, _competition } = game;
		if (_competition.instance.manOfSteelPoints && manOfSteel && manOfSteel.length) {
			return <ManOfSteelPoints game={game} />;
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
		if (game.newsPosts && game.newsPosts.length) {
			const cards = game.newsPosts.map(id => {
				if (postList[id]) {
					return <NewsPostCard post={postList[id]} key={id} />;
				} else {
					return <NewsPostCardPlaceholder key={id} />;
				}
			});

			return (
				<section className="news">
					<h2>News</h2>
					<div className="container">
						<div className="news-post-list">{cards}</div>
					</div>
				</section>
			);
		}
	}

	getPageTitle() {
		const { game } = this.state;

		//Use helper to try and get a score string
		let string = getScoreString(game, true);

		//If this fails (i.e. if there are no scores), create a simple H vs A
		if (!string) {
			string = game.teams.map(t => t.name.long).join(" vs ");
		}

		return `${string} - ${game.date.toString("dd/MM/yyyy")}`;
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

	generateGameGround() {
		const { fansCanAttend } = this.props;
		const { game, isFixture } = this.state;

		if (fansCanAttend && isFixture && game._ground) {
			return <GameGround ground={game._ground} />;
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
		const { game, statTableTeam } = this.state;
		const { teams } = game;

		//Generate Team Selector Data
		let tableSelectorOptions = [
			{ value: teams[0]._id, label: teams[0].name.short },
			{ value: "both", label: "Both Teams" },
			{ value: teams[1]._id, label: teams[1].name.short }
		];
		if (game.isAway) {
			tableSelectorOptions = tableSelectorOptions.reverse();
		}

		let filteredGame = _.clone(game);
		if (statTableTeam != "both") {
			filteredGame.playerStats = filteredGame.playerStats.filter(({ _team }) => _team == statTableTeam);
		}

		//Process game stats into rows
		const { isAway, _opposition, eligiblePlayers } = game;
		const rowData = _.chain(filteredGame.playerStats)
			.map(p => ({ ...p, isAway: p._team == _opposition._id ? !isAway : isAway }))
			.orderBy(["isAway", "position"], ["asc", "asc"])
			.filter(p => !isUnusedExtraInterchange(p))
			.map((p, sortValue) => {
				const { _player, _team, stats, isExtraInterchange, position } = p;
				const player = eligiblePlayers[_team].find(p => p._id == _player);

				const { number, name, slug } = player;

				let nameFirstRow = `${number ? `${number}. ` : ""}${name.first}`;
				let nameSecondRow;
				if (isExtraInterchange) {
					nameFirstRow += ` ${name.last}`;
					nameSecondRow = `(${getOrdinalNumber(position)} ${game.genderedString})`;
				} else {
					nameSecondRow = name.last;
				}
				const firstContent = [
					<div className="badge-wrapper" key="image">
						<TeamImage team={teams.find(t => t._id == _team)} variant="dark" size="medium" key="image" />
					</div>,
					<div key="name" className="name">
						<div>{nameFirstRow}</div>
						<div>{nameSecondRow}</div>
					</div>
				];

				let first;
				if (_team == _opposition._id) {
					first = {
						content: <div>{firstContent}</div>,
						sortValue
					};
				} else {
					first = {
						content: <Link to={`/players/${slug}`}>{firstContent}</Link>,
						sortValue,
						className: "mobile-wrap"
					};
				}

				const calculatedStats = calculateAdditionalStats(stats, filteredGame.date.getFullYear());

				const data = {
					first,
					...calculatedStats
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
					<StatsTables rowData={rowData} firstColumnHeader="Player" yearForPoints={game.date.getFullYear()} />
				</div>
			</section>
		);
	}

	generateLeagueTable() {
		const { _competition, date, status, teams } = this.state.game;
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

			let content;
			if (typeof window === "undefined") {
				content = <LoadingPage />;
			} else {
				content = (
					<LeagueTable
						competition={_competition._id}
						year={date.getFullYear()}
						toDate={toDate}
						highlightTeams={teams.map(t => t._id)}
					/>
				);
			}

			return (
				<section className="league-table">
					<div className="container">
						<h2>After this round</h2>
						{content}
					</div>
				</section>
			);
		}
	}

	render() {
		const { bucketPaths, postList } = this.props;
		const { game, isLoadingGame } = this.state;
		if (isLoadingGame) {
			return <LoadingPage />;
		} else if (!game) {
			return <NotFoundPage message="Game not found" />;
		} else if (!postList) {
			return <LoadingPage />;
		} else {
			//Get Helmet Image
			let cardImage;
			if (game.images.header) {
				cardImage = bucketPaths.images.games + "header/" + game.images.header;
			} else if (game.images.midpage) {
				cardImage = bucketPaths.images.games + "midpage/" + game.images.midpage;
			} else {
				cardImage = bucketPaths.images.games + "social/" + game._id + ".jpg?v=" + game.socialImageVersion;
			}

			return (
				<div className="game-page">
					<HelmetBuilder
						title={this.getPageTitle()}
						canonical={`/games/${game.slug}`}
						cardImage={cardImage}
						cardType="summary_large_image"
					/>
					<section className={`header ${game.hideGame ? "hidden-game" : ""}`}>
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
					{this.generateTeamSelector()}
					{this.generateForm()}
					{this.generateGameGround()}
					{this.generateSquads()}
					{this.generateStats()}
					{this.generateLeagueTable()}
				</div>
			);
		}
	}
}

function mapStateToProps({ games, config, news }, connectedProps) {
	const { fullGames, redirects, slugMap } = games;
	const { localTeam, authUser, bucketPaths, fansCanAttend } = config;
	const { postList } = news;
	return {
		key: connectedProps.match.params.slug,
		fullGames,
		redirects,
		postList,
		localTeam,
		authUser,
		bucketPaths,
		slugMap,
		fansCanAttend
	};
}

async function loadData(store, path) {
	const slug = path.split("/")[2];
	return store.dispatch(fetchGameFromSlug(slug));
}

export default {
	component: connect(mapStateToProps, {
		fetchGames,
		fetchPostList,
		fetchGameFromSlug
	})(GamePage),
	loadData
};
