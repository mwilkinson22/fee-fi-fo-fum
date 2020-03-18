//Modules
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function AdminDashboardPlayerDetails({ missingPlayerDetails }) {
	//If we have players with issues, return a card
	if (missingPlayerDetails && missingPlayerDetails.length) {
		const list = missingPlayerDetails.map(({ name, _id, issues }) => (
			<li key={_id}>
				<Link to={`/admin/people/${_id}`}>{name}</Link>
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

AdminDashboardPlayerDetails.propTypes = {
	missingPlayerDetails: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			_id: PropTypes.string.isRequired,
			issues: PropTypes.arrayOf(PropTypes.string).isRequired
		})
	)
};

export default AdminDashboardPlayerDetails;
