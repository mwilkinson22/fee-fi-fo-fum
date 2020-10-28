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

class TeamFormHeadToHead extends Component {
	constructor(props) {
		super(props);

		const { gameList, fetchGameList } = this.props;

		if (!gameList) {
			fetchGameList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { allCompetitions, game, fullGames, gameList, fetchGames } = nextProps;
		const { gamesRequired } = prevState;
		const newState = { isLoadingList: false, gamesRequired, isSSR: false };

		//Wait on game list (only necessary within news posts)
		if (!gameList) {
			newState.isLoadingList = true;
			return newState;
		}

		//Only run on initial load and game change
		if (!prevState.game || prevState.game._id != nextProps.game._id) {
			//Add Game to state
			newState.game = game;

			//Get Last 5 Head To Head
			newState.gamesRequired = _.chain(gameList)
				.filter(g => {
					return (
						g.date < game.date &&
						g._teamType == game._teamType &&
						g._opposition == game._opposition._id &&
						(allCompetitions || g._competition == game._competition._id)
					);
				})
				.orderBy("date", "desc")
				.map("_id")
				.chunk(5)
				.value()[0];
		}

		//If no games are required, we return nothing
		if (!newState.gamesRequired) {
			newState.isLoading = false;
			return newState;
		}

		//Determine which games we're waiting on
		const gamesToLoad = newState.gamesRequired.filter(id => !fullGames[id]);

		//Prevent loading games on SSR
		if (typeof window === "undefined") {
			newState.isSSR = true;
			return newState;
		}

		//If "isLoading" hasn't been set to true, and we're missing games
		if (!prevState.isLoading && gamesToLoad.length) {
			fetchGames(gamesToLoad);
			newState.isLoading = true;
			newState.games = null;
		} else if (!gamesToLoad.length) {
			newState.isLoading = false;
		}

		return newState;
	}

	renderBoxes() {
		const { fullGames, fullTeams, localTeam } = this.props;
		const { gamesRequired, game } = this.state;

		//Aggregate Stats
		const results = {
			W: 0,
			L: 0,
			D: 0
		};
		const points = {
			[localTeam]: 0,
			[game._opposition._id]: 0
		};

		//Badges
		const badges = {
			[localTeam]: <TeamImage team={fullTeams[localTeam]} size="medium" />,
			[game._opposition._id]: <TeamImage team={game._opposition} size="medium" />
		};

		//Loop through game IDs
		const games = gamesRequired
			.map(id => {
				const game = fullGames[id];

				//Get the teams, in order
				let teams = [fullTeams[localTeam], game._opposition];
				if (game.isAway) {
					teams = teams.reverse();
				}

				//Format the date string, only show the year if it's not this year
				const sameYear = game.date.getFullYear() == new Date().getFullYear();
				const date = game.date.toString(`dS MMM${sameYear ? "" : " yyyy"}`);

				//Check the result, update the results and points objects,
				//stylize the date block to the winning team
				let dateColours = { main: "#444", text: "#DDD" };
				const score = game.score || game.scoreOverride;
				if (score && Object.keys(score).length >= 2) {
					//Result
					if (score[localTeam] > score[game._opposition._id]) {
						results["W"]++;
						dateColours = fullTeams[localTeam].colours;
					} else if (score[localTeam] < score[game._opposition._id]) {
						results["L"]++;
						dateColours = game._opposition.colours;
					} else {
						results["D"]++;
					}

					//Points
					points[localTeam] += score[localTeam];
					points[game._opposition._id] += score[game._opposition._id];
				}

				//Render the boxes for each team
				const teamBoxes = teams.map((team, i) => (
					<div
						key={i}
						className="team-boxes"
						style={{ background: team.colours.main, color: team.colours.text }}
					>
						{badges[team._id]}
						{score ? score[team._id] : null}
					</div>
				));

				return (
					<Link key={game._id} to={`/games/${game.slug}`} className="game">
						{teamBoxes}
						<div
							className="details"
							style={{
								background: dateColours.main,
								color: dateColours.text
							}}
						>
							<div className="date">{date}</div>
							<div className="title">{game.title}</div>
						</div>
					</Link>
				);
			})
			.reverse();

		//Only show the draw tally if there are any
		let drawsDiv;
		if (results.D) {
			drawsDiv = <div>Draws: {results.D}</div>;
		}

		return (
			<div className="head-to-head-form">
				<div className="games">{games}</div>
				<div className="summary">
					<div>
						{fullTeams[localTeam].name.short} wins: {results.W}
					</div>
					{drawsDiv}
					<div>
						{game._opposition.name.short} wins: {results.L}
					</div>
				</div>
				<div className="summary">
					<div>
						{fullTeams[localTeam].name.short} points: {points[localTeam]}
					</div>
					<div>
						{game._opposition.name.short} points: {points[game._opposition._id]}
					</div>
				</div>
			</div>
		);
	}

	render() {
		const { isLoading, isLoadingList, isSSR } = this.state;
		if (isLoading || isLoadingList || isSSR) {
			return <LoadingPage />;
		}

		return this.renderBoxes();
	}
}

TeamFormHeadToHead.propTypes = {
	allCompetitions: PropTypes.bool,
	game: PropTypes.object.isRequired
};

TeamFormHeadToHead.defaultProps = {
	allCompetitions: true
};

function mapStateToProps({ config, games, teams }) {
	const { localTeam } = config;
	const { gameList, fullGames } = games;
	const { fullTeams } = teams;
	return { localTeam, gameList, fullGames, fullTeams };
}

export default connect(mapStateToProps, { fetchGames, fetchGameList })(TeamFormHeadToHead);
