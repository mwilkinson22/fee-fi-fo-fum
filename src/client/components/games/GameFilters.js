//Modules
import React, { Component } from "react";
import _ from "lodash";
import PropTypes from "prop-types";
import Select from "react-select";

//Components
import LoadingPage from "~/client/components/LoadingPage";

//Constants
import selectStyling from "~/constants/selectStyling";

//Helpers
import { winLossOrDraw } from "~/helpers/gameHelper";

class GameFilters extends Component {
	constructor(props) {
		super(props);

		//Set State
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { games, friendliesByDefault, onFilterChange, addExtraFilters } = nextProps;
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

			const venueOptions = [allOption];

			if (games.find(g => g.isAway === false)) {
				venueOptions.push({ label: "Home", value: "home" });
			}

			if (games.find(g => g.isAway === true)) {
				venueOptions.push({ label: "Away", value: "away" });
			}

			if (games.find(g => g.isNeutralGround)) {
				venueOptions.push({ label: "Neutral", value: "neutral" });
			}

			const filters = {
				_competition: {
					name: "Competition",
					options: competitionOptions,
					isMulti: true
				},
				_opposition: {
					name: "Opposition",
					options: oppositionOptions,
					isMulti: true,
					placeHolder: "All"
				},
				venue: {
					name: "Venue",
					options: venueOptions
				}
			};

			activeFilters = {
				_competition: filters._competition.options.filter(o => (friendliesByDefault ? false : !o.isFriendly)),
				_opposition: [],
				venue: allOption
			};

			if (addExtraFilters) {
				filters.fromDate = {
					name: "From",
					type: "date"
				};
				filters.toDate = {
					name: "To",
					type: "date"
				};
				filters.result = {
					name: "Result",
					options: [
						{ label: "Win", value: "W" },
						{ label: "Draw", value: "D" },
						{ label: "Loss", value: "L" }
					],
					isMulti: true
				};
			}

			newState = { games, filters, activeFilters };
		}

		//Pass filtered games into callback
		const { _competition, _opposition, venue, fromDate, toDate, result } = activeFilters;
		newState.filteredGames = games.filter(g => {
			let isValid = true;

			//Opposition
			if (_opposition && _opposition.length) {
				isValid = _opposition.find(o => o.value == g._opposition._id);
			}

			//Venue
			if (isValid && venue && venue.value) {
				if (venue.value === "neutral") {
					isValid = g.isNeutralGround;
				} else {
					isValid = !g.isNeutralGround && g.isAway === (venue.value === "away");
				}
			}

			//Competition
			if (isValid && _competition && _competition.length) {
				isValid = _competition.find(c => c.value == g._competition._id);
			}

			//Date Filters
			if (isValid && fromDate) {
				isValid = new Date(fromDate) < g.date;
			}
			if (isValid && toDate) {
				isValid = new Date(toDate) > g.date;
			}

			//Result filter
			if (isValid && result) {
				const gameResult = winLossOrDraw(g);
				isValid = result.find(({ value }) => value == gameResult);
			}

			return isValid;
		});

		if (!prevState.filteredGames || _.xorBy(newState.filteredGames, prevState.filteredGames, "_id").length) {
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
		const { name, ...filterData } = filters[key];

		//Get currently selected Options
		const value = activeFilters[key];

		//Get input
		let input;
		const classNames = ["list-filter"];
		switch (key) {
			case "fromDate":
			case "toDate":
				classNames.push("date");
				input = <input type="date" onChange={ev => this.updateActiveFilters(key, ev.target.value)} />;
				break;
			default:
				input = (
					<Select
						{...filterData}
						styles={selectStyling}
						value={value}
						isSearchable={false}
						onChange={option => this.updateActiveFilters(key, option)}
						placeholder="All"
					/>
				);
		}

		return (
			<div key={key} className={classNames.join(" ")}>
				<h4>{name}</h4>
				{input}
			</div>
		);
	}

	render() {
		const { addExtraFilters } = this.props;
		const { filters } = this.state;
		if (!filters) {
			return <LoadingPage />;
		}

		return (
			<div className={`list-filters${addExtraFilters ? " with-extras" : ""}`}>
				{Object.keys(filters).map(key => this.renderFilter(key))}
			</div>
		);
	}
}

GameFilters.propTypes = {
	addExtraFilters: PropTypes.bool,
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	onFilterChange: PropTypes.func.isRequired,
	friendliesByDefault: PropTypes.bool
};

GameFilters.defaultProps = {
	addExtraFilters: false,
	friendliesByDefault: true
};

export default GameFilters;
