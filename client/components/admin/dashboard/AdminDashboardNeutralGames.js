//Modules
import _ from "lodash";
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function AdminDashboardNeutralGames({ neutralGames, teamTypes }) {
	//Get cut-off point
	const deadline = new Date().addHours(-2);

	//Get games requiring updates
	const thisYear = new Date().getFullYear();

	if (neutralGames && neutralGames[thisYear]) {
		const gamesToUpdate = _.filter(
			neutralGames[thisYear],
			g => g.date < deadline && (g.homePoints == null || g.awayPoints == null)
		);

		if (gamesToUpdate.length) {
			const list = _.chain(gamesToUpdate)
				.sortBy(({ _teamType }) => teamTypes[_teamType].sortOrder)
				.groupBy("_teamType")
				.map((games, _teamType) => {
					const { name, slug } = teamTypes[_teamType];
					return (
						<li key={_teamType}>
							<Link to={`/admin/neutralGames/${thisYear}/${slug}`}>{name}</Link>
							{games.length} {games.length === 1 ? "game" : "games"}
						</li>
					);
				})
				.value();

			return (
				<div className="form-card" key="neutral-games">
					<h6>Neutral Games</h6>
					<p>The following team types have outstanding neutral games:</p>
					<ul>{list}</ul>
				</div>
			);
		}
	}
}

AdminDashboardNeutralGames.propTypes = {
	neutralGames: PropTypes.object.isRequired,
	teamTypes: PropTypes.object.isRequired
};

export default AdminDashboardNeutralGames;
