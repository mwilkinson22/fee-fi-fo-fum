//Modules
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function AdminDashboardBirthdays({ birthdays }) {
	//If we have players with issues, return a card
	if (birthdays && birthdays.length) {
		const list = birthdays.map(({ _id, daysToGo, name, dateOfBirth, age }) => (
			<li key={_id}>
				<Link to={`/admin/people/${_id}`}>
					{name.first} {name.last}
				</Link>
				<p>
					{age} in {daysToGo} {daysToGo.length === 1 ? "day" : "days"} (
					{new Date(dateOfBirth).toString("dddd dS MMMM")})
				</p>
			</li>
		));
		return (
			<div className="form-card" key="birthdays">
				<h6>Birthdays</h6>
				<ul>{list}</ul>
			</div>
		);
	}
}

AdminDashboardBirthdays.propTypes = {
	birthdays: PropTypes.array
};

export default AdminDashboardBirthdays;
