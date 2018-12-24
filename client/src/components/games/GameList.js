import React, { Component } from "react";
import LoadingPage from "../LoadingPage";
import GameBox from "./GameBox";
import _ from "lodash";

class GameList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			filters: {}
		};
	}

	async componentDidMount() {
		await this.fetchFilters();
		this.fetchGameList();
	}

	populateGameList() {
		const games = this.props.games || null;

		if (games === null) {
			return <LoadingPage />;
		} else if (games.length === 0) {
			return "No games found";
		} else {
			let isFirst = true;
			const renderedGames = games.map(game => {
				const includeCountdown = isFirst;
				isFirst = false;
				return <GameBox key={game._id} game={game} includeCountdown={includeCountdown} />;
			});
			return <div className="container game-list">{renderedGames}</div>;
		}
	}

	async updateFilters(filterName, ev) {
		const { value } = ev.target || null;

		if (value) {
			await this.setState(prevState => ({
				filters: { ...prevState.filters, [filterName]: value }
			}));
		} else {
			//Field has been cleared, remove from list
			const { filters } = this.state;
			delete filters[filterName];
			await this.setState(filters);
		}

		this.fetchGameList();
	}

	generateFilters() {
		if (this.props.filters) {
			return _.map(this.props.filters, (list, filterName) => {
				const options = _.map(list, option => {
					return (
						<option key={option._id} value={option._id}>
							{option.name}
						</option>
					);
				});
				return (
					<div key={filterName} className="list-filter">
						<h4>{filterName.toUpperCase()}</h4>
						<select
							onChange={ev => this.updateFilters(filterName, ev)}
							value={this.state.filters[filterName] || ""}
						>
							<option value="">All</option>
							{options}
						</select>
					</div>
				);
			});
		}
	}

	render() {
		return (
			<div>
				<div className="page-header">
					<div className="container">
						<h1>{this.generatePageHeader()}</h1>
						<div className="list-filters">{this.generateFilters()}</div>
					</div>
				</div>
				{this.populateGameList()}
			</div>
		);
	}
}

export default GameList;
