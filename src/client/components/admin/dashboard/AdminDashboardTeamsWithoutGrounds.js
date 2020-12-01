//Modules
import _ from "lodash";
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function AdminDashboardTeamsWithoutGrounds({ teams }) {
	if (teams.length) {
		const list = _.sortBy(teams, "name.long").map(({ name, _id }) => (
			<li key={_id}>
				<Link to={`/admin/teams/${_id}`}>{name.long}</Link>
			</li>
		));

		return (
			<div className="form-card" key="teams-without-grounds">
				<h6>Teams Without Grounds</h6>
				<ul>{list}</ul>
			</div>
		);
	}
}

AdminDashboardTeamsWithoutGrounds.propTypes = {
	teams: PropTypes.array.isRequired
};

export default AdminDashboardTeamsWithoutGrounds;
