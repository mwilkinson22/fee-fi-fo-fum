//Modules
import _ from "lodash";
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function AdminDashboardPlayerDetails({ team, firstTeam }) {
	//Get all "required" values
	const requiredPlayerValues = {
		images: "Main Image",
		dateOfBirth: "Date of Birth",
		contractedUntil: "Contracted Until",
		playingPositions: "Playing Positions",
		_hometown: "Hometown"
	};

	//Get most recent squad
	const thisYear = Number(new Date().getFullYear());
	const currentFirstTeamSquads = team.squads.filter(
		({ _teamType, year }) => _teamType == firstTeam._id && year >= thisYear
	);

	if (currentFirstTeamSquads.length) {
		//Get all players
		const playersWithIssues = _.chain(currentFirstTeamSquads)
			//Get Player Objects
			.map(s => s.players.map(({ _player }) => _player))
			.flatten()
			.uniqBy("_id")
			//Order
			.sortBy(({ name }) => name.full)
			//Check required values
			.map(player => {
				const issues = _.map(requiredPlayerValues, (label, key) => {
					let isValid;
					switch (key) {
						case "images": {
							isValid = player.images.main;
							break;
						}
						case "playingPositions": {
							isValid = player.playingPositions.length;
							break;
						}
						default: {
							isValid = player[key];
							break;
						}
					}

					//If an issue is found, we return the label to an array
					if (!isValid) {
						return label;
					}
				}).filter(_.identity);

				//If a player has outstanding issues, return an object
				if (issues.length) {
					return { player, issues };
				}
			})
			.filter(_.identity)
			.value();

		//If we have players with issues, return a card
		if (playersWithIssues.length) {
			const list = playersWithIssues.map(({ player, issues }) => (
				<li key={player._id}>
					<Link to={`/admin/people/${player._id}`}>{player.name.full}</Link>
					<p>{issues.join(", ")}</p>
				</li>
			));
			return (
				<div className="form-card" key="player-details">
					<h6>Player Details</h6>
					<p>The following players are missing important information:</p>
					<ul>{list}</ul>
				</div>
			);
		}
	}
}

AdminDashboardPlayerDetails.propTypes = {
	team: PropTypes.object.isRequired,
	firstTeam: PropTypes.object.isRequired
};

export default AdminDashboardPlayerDetails;
