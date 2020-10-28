//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../LoadingPage";
import TeamImage from "../teams/TeamImage";

//Actions
import { fetchGames, fetchGameList } from "~/client/actions/gamesActions";
import { fetchNeutralGames } from "~/client/actions/neutralGamesActions";

class TeamFormPerTeam extends Component {
	constructor(props) {
		super(props);
		const { neutralGames, fetchNeutralGames, game, gameList, fetchGameList } = props;

		const isSSR = typeof window === "undefined";

		let isLoadingNeutral = false;
		if (!isSSR) {
			//Load Neutral Games for game year and previous year
			const year = game.date.getFullYear();
			if (!neutralGames || !neutralGames[year]) {
				isLoadingNeutral = true;
				fetchNeutralGames(year);
			}
			if (!neutralGames || !neutralGames[year - 1]) {
				isLoadingNeutral = true;
				fetchNeutralGames(year - 1);
			}

			if (!gameList) {
				fetchGameList();
			}
		}

		this.state = { isLoadingNeutral, isSSR };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { allCompetitions, game, neutralGames, fullGames, gameList, fetchGames } = nextProps;
		const { gamesRequired } = prevState;
		const newState = { gamesRequired, isLoadingLists: false };

		//Get the year of the main reference game
		const year = game.date.getFullYear();

		//Wait on all neutral games and the gameList to be loaded
		if (!gameList || !neutralGames || !neutralGames[year] || !neutralGames[year - 1]) {
			newState.isLoadingLists = true;
			return newState;
		}

		//On initial load, or if the game changes, work out the games we actually need to load
		if (!prevState.game || prevState.game._id != nextProps.game._id) {
			//Add the game to state. We do this here rather than in the initial
			//declaration of newState to prevent errors if neutralGames isn't loaded
			newState.game = game;

			//A basic function to validate both local and neutral games
			const validateGame = g =>
				g.date < game.date &&
				g._teamType == game._teamType &&
				(allCompetitions || g._competition == game._competition._id);

			//First, we get the last five games for localteam
			newState.lastFiveLocal = _.chain(gameList)
				.filter(validateGame)
				.orderBy("date", "desc")
				.map("_id")
				.chunk(5)
				.value()[0];

			//Then we load the last five neutral games for the opposition
			const oppositionId = game._opposition._id;
			const lastTwoYearsOfNeutralGames = { ...neutralGames[year], ...neutralGames[year - 1] };
			const lastFiveNeutral =
				_.chain(lastTwoYearsOfNeutralGames)
					.filter(
						g =>
							validateGame(g) &&
							(g._homeTeam == oppositionId || g._awayTeam == oppositionId)
					)
					.orderBy("date", "desc")
					//Add an isNeutral flag so we know how to handle it later
					.map(obj => ({ ...obj, isNeutral: true }))
					.chunk(5)
					.value()[0] || [];

			//We also need to check if there are any recent local vs opposition games more recent
			//than the last five neutral ones
			const lastFiveHeadToHead =
				_.chain(gameList)
					.filter(g => validateGame(g) && g._opposition == oppositionId)
					.orderBy("date", "desc")
					.chunk(5)
					.value()[0] || [];

			newState.lastFiveOpposition = _.chain([lastFiveNeutral, lastFiveHeadToHead])
				.flatten()
				.orderBy("date", "desc")
				.chunk(5)
				.value()[0];

			//Finally, we use these two values to work out what to load
			const oppositionGamesToLoad = newState.lastFiveOpposition
				.filter(g => !g.isNeutral)
				.map(g => g._id);
			newState.gamesRequired = [...oppositionGamesToLoad, ...newState.lastFiveLocal];
		}

		if (!newState.gamesRequired) {
			return newState;
		}

		//Determine which games we're waiting on
		const gamesToLoad = newState.gamesRequired.filter(id => !fullGames[id]);

		//If "isLoading" hasn't been set to true, and we're missing games
		if (!prevState.isLoading && gamesToLoad.length) {
			fetchGames(gamesToLoad);
			newState.isLoading = true;
		} else if (!gamesToLoad.length) {
			newState.isLoading = false;
		}

		return newState;
	}

	convertLocalGameToNeutralFormat(_id) {
		const { fullGames, localTeam } = this.props;

		let { date, isAway, score, scoreOverride, _opposition, slug } = fullGames[_id];

		if (!score) {
			score = scoreOverride;
		}

		//Set Teams & Score
		let points = [
			{ team: localTeam, points: score ? score[localTeam] : null },
			{ team: _opposition._id, points: score ? score[_opposition._id] : null }
		];
		if (isAway) {
			points = points.reverse();
		}
		const _homeTeam = points[0].team;
		const homePoints = points[0].points;
		const _awayTeam = points[1].team;
		const awayPoints = points[1].points;

		return {
			_id,
			date,
			_homeTeam,
			homePoints,
			_awayTeam,
			awayPoints,
			slug
		};
	}

	renderTable(renderLocalTeam) {
		const { game, lastFiveLocal, lastFiveOpposition } = this.state;
		const { localTeam, fullTeams, teamList } = this.props;

		//Get the necessary games
		let games;
		if (renderLocalTeam) {
			//For the local team, this is just a list of IDs,
			//so we loop it through the helper function
			games = lastFiveLocal.map(id => this.convertLocalGameToNeutralFormat(id));
		} else {
			//For the opposition, we have an array of game objects,
			//the non-neutral ones will go through the helper function
			games = lastFiveOpposition.map(g => {
				if (g.isNeutral) {
					return g;
				} else {
					return this.convertLocalGameToNeutralFormat(g._id);
				}
			});
		}

		//Ensure we have at least one game
		if (!games || !games.length) {
			return null;
		}

		//Get the team info
		const team = renderLocalTeam ? fullTeams[localTeam] : game._opposition;

		//Render games
		const renderedGames = games.map(g => {
			const { _homeTeam, _awayTeam, homePoints, awayPoints, slug, date } = g;

			//Get key data
			const isAway = _awayTeam == team._id;
			const oppositionId = isAway ? _homeTeam : _awayTeam;

			//Get Score & Result
			const [localScore, oppositionScore] = isAway
				? [awayPoints, homePoints]
				: [homePoints, awayPoints];
			let result;
			if (localScore > oppositionScore) {
				result = "W";
			} else if (localScore < oppositionScore) {
				result = "L";
			} else {
				result = "D";
			}

			//We will either return a link or a div depending on if the game is neutral,
			//so we create the props separately
			const renderedGameProps = {
				key: g._id,
				className: "game"
			};

			renderedGameProps.children = [
				<div className="badge" key="badge">
					<TeamImage team={teamList[oppositionId]} variant="dark" size="medium" />
				</div>,
				<div className="date" key="date">
					{date.toString("dd/MM/yyyy")}
				</div>,
				<div className={`score ${result}`} key="score">
					{homePoints}-{awayPoints}
				</div>
			];

			//Finally, return this box either as a link or a div
			if (slug) {
				return <Link to={`/games/${slug}`} {...renderedGameProps} />;
			} else {
				return <div {...renderedGameProps} />;
			}
		});

		return (
			<div className="team" key={team._id}>
				<div
					style={{ background: team.colours.main, color: team.colours.text }}
					className="header"
				>
					<div>
						<TeamImage team={team} size="medium" />
					</div>
					Last {games.length == 1 ? "game" : `${games.length} games`}
				</div>
				<div className="games">{renderedGames}</div>
			</div>
		);
	}

	render() {
		const { includeHeader } = this.props;
		const { game, gamesRequired, isLoading, isLoadingLists, isSSR } = this.state;

		//Wait on dependencies
		if (isLoading || isLoadingLists || isSSR) {
			return <LoadingPage />;
		} else if (!gamesRequired) {
			return null;
		}

		//Conditionally add header
		let header;
		if (includeHeader) {
			header = <h2>Form</h2>;
		}

		return (
			<div className="per-team-form">
				{header}
				{this.renderTable(!game.isAway)}
				{this.renderTable(game.isAway)}
			</div>
		);
	}
}

TeamFormPerTeam.propTypes = {
	allCompetitions: PropTypes.bool,
	game: PropTypes.object.isRequired,
	includeHeader: PropTypes.bool
};

TeamFormPerTeam.defaultProps = {
	allCompetitions: true,
	includeHeader: true
};

function mapStateToProps({ config, games, teams }) {
	const { localTeam } = config;
	const { gameList, fullGames, neutralGames } = games;
	const { teamList, fullTeams } = teams;
	return { localTeam, gameList, fullGames, neutralGames, fullTeams, teamList };
}

export default connect(mapStateToProps, { fetchGames, fetchGameList, fetchNeutralGames })(
	TeamFormPerTeam
);
