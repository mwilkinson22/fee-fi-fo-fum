//Modules
import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import TeamImage from "../teams/TeamImage";

function TeamFormHeadToHead({ allCompetitions, game, localTeam, teamList }) {
	//Get form object
	const headToHeadGames =
		game.teamForm[allCompetitions ? "allCompetitions" : "singleCompetition"].headToHead;

	//Badges
	const opposition = game._opposition;
	const badges = {
		[localTeam]: <TeamImage team={teamList[localTeam]} size="medium" />,
		[opposition._id]: <TeamImage team={opposition} size="medium" />
	};

	//Aggregate Stats
	const results = {
		W: 0,
		L: 0,
		D: 0
	};
	const points = {
		[localTeam]: 0,
		[opposition._id]: 0
	};

	//Loop through game IDs
	const links = headToHeadGames
		.map(game => {
			const { homePoints, awayPoints, _homeTeam, _awayTeam } = game;
			//Get the teams, in order
			let teams = [teamList[_homeTeam], teamList[_awayTeam]];

			//Format the date string, only show the year if it's not this year
			const date = new Date(game.date);
			const sameYear = date.getFullYear() == new Date().getFullYear();
			const dateString = date.toString(`dS MMM${sameYear ? "" : " yyyy"}`);

			//Check the result, update the results and points objects,
			//stylize the date block to the winning team
			let dateColours = { main: "#444", text: "#DDD" };
			if (homePoints != null && awayPoints != null) {
				//Update points
				points[_homeTeam] += homePoints;
				points[_awayTeam] += awayPoints;

				//Get winning team
				let winningTeam;
				if (homePoints > awayPoints) {
					winningTeam = _homeTeam;
				} else if (awayPoints > homePoints) {
					winningTeam = _awayTeam;
				}

				//Use that data to update results + colours
				if (winningTeam === localTeam) {
					results["W"]++;
					dateColours = teamList[localTeam].colours;
				} else if (winningTeam === opposition._id) {
					results["L"]++;
					dateColours = opposition.colours;
				} else {
					results["D"]++;
				}
			}

			//Render the boxes for each team
			const teamBoxes = teams.map((team, i) => (
				<div
					key={i}
					className="team-boxes"
					style={{ background: team.colours.main, color: team.colours.text }}
				>
					{badges[team._id]}
					{i === 0 ? homePoints : awayPoints}
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
						<div className="date">{dateString}</div>
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
			<div className="games">{links}</div>
			<div className="summary">
				<div>
					{teamList[localTeam].name.short} wins: {results.W}
				</div>
				{drawsDiv}
				<div>
					{opposition.name.short} wins: {results.L}
				</div>
			</div>
			<div className="summary">
				<div>
					{teamList[localTeam].name.short} points: {points[localTeam]}
				</div>
				<div>
					{opposition.name.short} points: {points[opposition._id]}
				</div>
			</div>
		</div>
	);
}

TeamFormHeadToHead.propTypes = {
	allCompetitions: PropTypes.bool,
	game: PropTypes.object.isRequired
};

TeamFormHeadToHead.defaultProps = {
	allCompetitions: true
};

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { teamList } = teams;
	return { localTeam, teamList };
}

export default connect(mapStateToProps)(TeamFormHeadToHead);
