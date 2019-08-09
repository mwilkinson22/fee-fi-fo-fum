import React, { Component } from "react";
import _ from "lodash";
import PropTypes from "prop-types";
import Select from "react-select";
import selectStyling from "~/constants/selectStyling";
import LoadingPage from "~/client/components/LoadingPage";

class GameFilters extends Component {
	constructor(props) {
		super(props);

		//Set State
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { games, friendliesByDefault, onFilterChange } = nextProps;
		let { activeFilters } = prevState;
		let newState = {};

		if (!prevState.games || _.differenceBy(games, prevState.games, "_id").length) {
			//Render Options
			const allOption = { label: "All", value: false };
			const competitionOptions = _.chain(games)
				.map(({ _competition }) => ({
					label: _competition.instance.title,
					value: _competition._id,
					isFriendly: _competition.type == "Friendly"
				}))
				.uniqBy("value")
				.sortBy("label")
				.value();

			const oppositionOptions = _.chain(games)
				.map(game => ({ label: game._opposition.name.long, value: game._opposition._id }))
				.uniqBy("value")
				.sortBy("label")
				.value();

			const venueOptions = [
				allOption,
				{ label: "Home", value: "home" },
				{ label: "Away", value: "away" }
			];

			const filters = {
				_competition: {
					name: "Competition",
					options: competitionOptions
				},
				_opposition: {
					name: "Opposition",
					options: [allOption, ...oppositionOptions]
				},
				venue: {
					name: "Venue",
					options: venueOptions
				}
			};

			activeFilters = {
				_competition: filters._competition.options.filter(o =>
					friendliesByDefault ? false : !o.isFriendly
				),
				_opposition: allOption,
				venue: allOption
			};

			newState = { games, filters, activeFilters };
		}

		//Pass filtered games into callback
		const { _competition, _opposition, venue } = activeFilters;
		newState.filteredGames = games.filter(g => {
			let isValid = true;

			//Opposition
			if (_opposition && _opposition.value) {
				isValid = g._opposition._id == _opposition.value;
			}

			//Venue
			if (isValid && venue && venue.value) {
				isValid = g.isAway === (venue.value === "away");
			}

			//Competition
			if (isValid && _competition && _competition.length) {
				isValid = _competition.find(c => c.value == g._competition._id);
			}

			return isValid;
		});

		if (
			!prevState.filteredGames ||
			_.xorBy(newState.filteredGames, prevState.filteredGames, "_id").length
		) {
			onFilterChange(newState.filteredGames);
		}

		return newState;
	}

	async updateActiveFilters(key, option) {
		const { activeFilters } = this.state;
		activeFilters[key] = option;

		this.setState({ activeFilters });
	}

	renderFilter(key) {
		const { filters, activeFilters } = this.state;

		//Get filter data
		const { name, options } = filters[key];

		//Get currently selected Options
		const value = activeFilters[key];

		return (
			<div key={key} className="list-filter">
				<h4>{name}</h4>
				<Select
					styles={selectStyling}
					options={options}
					value={value}
					isSearchable={false}
					onChange={option => this.updateActiveFilters(key, option)}
					isMulti={key == "_competition"}
					placeholder={key == "_competition" ? "All" : "Select..."}
				/>
			</div>
		);
	}

	render() {
		const { filters } = this.state;
		if (!filters) {
			return <LoadingPage />;
		}

		return (
			<div className="list-filters">
				{Object.keys(filters).map(key => this.renderFilter(key))}
			</div>
		);
	}
}

GameFilters.propTypes = {
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	onFilterChange: PropTypes.func.isRequired,
	friendliesByDefault: PropTypes.bool
};

GameFilters.defaultProps = {
	friendliesByDefault: true
};

export default GameFilters;
