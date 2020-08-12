//Modules
import _ from "lodash";
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function AdminDashboardGamesWithoutReferees({ games }) {
	if (games.length) {
		const list = _.chain(games)
			.map(g => ({ ...g, date: new Date(g.date) }))
			.orderBy("date", "desc")
			.map(({ _opposition, _id, date }) => (
				<li key={_id}>
					<Link to={`/admin/game/${_id}`}>
						{_opposition.name.short} {date.toString("dS MMMM yyyy")}
					</Link>
				</li>
			))
			.value();

		return (
			<div className="form-card" key="teams-without-grounds">
				<h6>Games Without Referees</h6>
				<ul>{list}</ul>
			</div>
		);
	}
}

AdminDashboardGamesWithoutReferees.propTypes = {
	games: PropTypes.array.isRequired
};

export default AdminDashboardGamesWithoutReferees;
