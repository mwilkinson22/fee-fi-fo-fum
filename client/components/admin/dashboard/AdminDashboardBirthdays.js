//Modules
import _ from "lodash";
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function AdminDashboardBirthdays({ team }) {
	//Get time
	const now = new Date();
	const thisYear = Number(now.getFullYear());

	//Get all current players
	const players = _.chain(team.squads)
		.filter(({ year }) => year >= thisYear)
		.map(s => s.players.map(({ _player }) => _player))
		.flatten()
		.value();

	//Get all current coaches
	const coaches = team.coaches.filter(c => !c.to).map(p => p._person);

	//Combine to single object
	const people = [...players, ...coaches];

	if (people.length) {
		//Get all players
		const peopleWithBirthdays = _.chain(people)
			//Remove duplicates
			.uniqBy("_id")
			//Filter to those with birthdays
			.filter("dateOfBirth")
			//Convert DOB to date object
			.map(person => ({ ...person, dateOfBirth: new Date(person.dateOfBirth) }))
			//Get days to go
			.map(person => {
				//Get next birthday
				const monthAndDay = person.dateOfBirth.toString("MM-dd");
				let nextBirthday = new Date(`${thisYear}-${monthAndDay} 23:59:59`);
				if (nextBirthday < now) {
					nextBirthday.addYears(1);
				}

				//Difference between dates
				const daysToGo = Math.floor((nextBirthday - now) / (1000 * 60 * 60 * 24));

				//Get Age
				const age = Math.floor(
					(nextBirthday - person.dateOfBirth) / (1000 * 60 * 60 * 24 * 365)
				);

				return { ...person, daysToGo, age };
			})
			//Order
			.sortBy("daysToGo")
			.map(({ _id, daysToGo, name, dateOfBirth, age }) => (
				<li key={_id}>
					<Link to={`/admin/people/${_id}`}>{name.full}</Link>
					<p>
						{age} in {daysToGo} {daysToGo.length === 1 ? "day" : "days"} (
						{dateOfBirth.toString("dddd dS MMMM")})
					</p>
				</li>
			))
			//Limit to 5 values
			.chunk(5)
			.value()
			.shift();

		//If we have players with issues, return a card
		if (peopleWithBirthdays && peopleWithBirthdays.length) {
			return (
				<div className="form-card" key="birthdays">
					<h6>Birthdays</h6>
					<ul>{peopleWithBirthdays}</ul>
				</div>
			);
		}
	}
}

AdminDashboardBirthdays.propTypes = {
	team: PropTypes.object.isRequired
};

export default AdminDashboardBirthdays;
