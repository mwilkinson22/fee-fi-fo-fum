//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Components
import GameFilters from "../games/GameFilters";
import PageSwitch from "../PageSwitch";

class SeasonPlayerStats extends Component {
	constructor(props) {
		super(props);
		this.state = {
			activeFilters: {},
			statType: "totals"
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { games } = nextProps;
		const newState = { games };

		newState.activeFilters = prevState.activeFilters || {};

		return newState;
	}

	render() {
		const { games, activeFilters, statType } = this.state;
		console.log(_.filter(games, activeFilters));
		return [
			<section className="game-filters" key="filters">
				<div className="container">
					<GameFilters
						games={games}
						activeFilters={activeFilters}
						onFilterChange={activeFilters => this.setState({ activeFilters })}
					/>
				</div>
			</section>,
			<section className="stat-type-switch" key="switch">
				<div className="container">
					<PageSwitch
						currentValue={statType}
						onChange={statType => this.setState({ statType })}
						options={[
							{ value: "totals", label: "Show Totals" },
							{ value: "averages", label: "Show Averages" }
						]}
					/>
				</div>
			</section>
		];
	}
}

SeasonPlayerStats.propTypes = {
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	year: PropTypes.number.isRequired
};

SeasonPlayerStats.defaultProps = {};

function mapStateToProps(props) {
	return {};
}

export default connect(mapStateToProps)(SeasonPlayerStats);
