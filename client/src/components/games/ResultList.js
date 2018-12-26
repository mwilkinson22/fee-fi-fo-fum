import React from "react";
import { connect } from "react-redux";
import {
	fetchResults,
	fetchYearsWithResults,
	updateActiveYear,
	updateFilters
} from "../../actions/gamesActions";
import GameList from "./GameList";
import LoadingPage from "../LoadingPage";

class ResultList extends GameList {
	async componentDidMount() {
		await this.props.fetchYearsWithResults();
		super.componentDidMount();
	}

	fetchGameList() {
		this.props.fetchResults(this.props.year, this.state.filters);
	}

	fetchFilters() {
		this.setState({ filters: {} });
		this.props.updateFilters(this.props.year);
	}

	async updateActiveYear(year) {
		await this.props.updateActiveYear(year);
		await this.fetchFilters();
		this.fetchGameList();
	}

	generatePageHeader() {
		if (this.props.years) {
			const options = this.props.years.map(year => {
				return (
					<option key={year} value={year}>
						{year}
					</option>
				);
			});
			return [
				<select
					key="year-selector"
					children={options}
					onChange={ev => this.updateActiveYear(ev.target.value)}
					value={this.props.year}
				/>,
				<span key="results-header"> Results</span>
			];
		} else {
			return <LoadingPage />;
		}
	}
}

function mapStateToProps({ games }) {
	const { years, year } = games;
	return {
		games: games.results || null,
		years,
		year,
		filters: games.filters
	};
}

export default connect(
	mapStateToProps,
	{ fetchResults, fetchYearsWithResults, updateActiveYear, updateFilters }
)(ResultList);
