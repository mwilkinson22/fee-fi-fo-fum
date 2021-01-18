//Modules
import _ from "lodash";
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

//Constants
import statuses from "~/constants/adminDashboardGameStatuses";

function AdminDashboardGames({ gamesWithIssues, teamList, teamTypes }) {
	if (gamesWithIssues && gamesWithIssues.length) {
		const list = gamesWithIssues.map(game => {
			let { error } = game;
			const { teams, _id, _opposition, date, _teamType } = game;
			//Work out best link to show
			let url = `/admin/game/${_id}/`;
			switch (error) {
				case statuses.ELIGIBLE:
					url = `/admin/teams/${teams[0]}/squads`;
					break;
				case statuses.PREGAME:
					url += "pregame";
					break;
				case statuses.SQUAD:
					url += "squads";
					break;
				case statuses.STATS:
					url += "stats";
					break;
				case statuses.STEEL.M:
				case statuses.STEEL.F:
					url += "post-game";
			}

			//Get Link Text
			const linkText = [teamList[_opposition].name.long];
			if (_.values(teamTypes)[0]._id !== _teamType) {
				linkText.push(teamTypes[_teamType].name);
			}
			linkText.push(`(${date.toString("dddd dS MMMM")})`);

			//Add teams to error string
			if (teams && teams.length) {
				const teamString = teams.map(id => teamList[id].name.short).join(" & ");
				error += ` (${teamString})`;
			}

			return (
				<li key={_id}>
					<Link to={url}>{linkText.join(" ")}</Link>
					<p>{error}</p>
				</li>
			);
		});

		return (
			<div className="form-card" key="games">
				<h6>Games</h6>
				<p>The following games require attention:</p>
				<ul>{list}</ul>
			</div>
		);
	}
}

AdminDashboardGames.propTypes = {
	gamesWithIssues: PropTypes.array,
	gameList: PropTypes.object.isRequired,
	teamList: PropTypes.object.isRequired,
	teamTypes: PropTypes.object.isRequired
};

export default AdminDashboardGames;
