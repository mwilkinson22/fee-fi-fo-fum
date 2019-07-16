import React, { Component } from "react";
import _ from "lodash";
import PropTypes from "prop-types";

class GameFilters extends Component {
	updateActiveFilters(target) {
		const { name, value } = target;
		const { activeFilters, onFilterChange } = this.props;

		if (value.length === 0) {
			delete activeFilters[name];
		} else if (name === "isAway") {
			activeFilters[name] = value === "true";
		} else {
			activeFilters[name] = {};
			activeFilters[name]._id = value;
		}

		onFilterChange(activeFilters);
	}
	render() {
		const { games } = this.props;
		const filters = {
			_competition: { name: "Competition", options: [] },
			_opposition: { name: "Opposition", options: [] },
			isAway: {
				name: "Venue",
				options: [{ name: "Home", value: false }, { name: "Away", value: true }]
			}
		};

		if (games) {
			filters._competition.options = _.chain(games)
				.map(game => ({
					name: game._competition.instance.title,
					value: game._competition._id
				}))
				.uniqBy("value")
				.sortBy("name")
				.value();

			filters._opposition.options = _.chain(games)
				.map(game => ({ name: game._opposition.name.long, value: game._opposition._id }))
				.uniqBy("value")
				.sortBy("name")
				.value();
		}

		const content = _.map(filters, (data, filter) => {
			const { name } = data;

			//Create Options
			const options = _.map(data.options, option => {
				return (
					<option key={option.value} value={option.value}>
						{option.name}
					</option>
				);
			});

			//Determine Value
			let value;
			const { activeFilters } = this.props;
			if (filter === "isAway") {
				value = activeFilters.isAway !== null ? activeFilters.isAway : "";
			} else {
				value = activeFilters && activeFilters[filter] ? activeFilters[filter]._id : "";
			}

			//Return JSX
			return (
				<div key={filter} className="list-filter">
					<h4>{name}</h4>
					<select
						onChange={ev => this.updateActiveFilters(ev.target)}
						name={filter}
						value={value}
					>
						<option value="">All</option>
						{options}
					</select>
				</div>
			);
		});
		return <div className="list-filters">{content}</div>;
	}
}

GameFilters.propTypes = {
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	activeFilters: PropTypes.object.isRequired,
	onFilterChange: PropTypes.func.isRequired
};

GameFilters.defaultProps = {};

export default GameFilters;
