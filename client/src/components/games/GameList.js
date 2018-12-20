import React, { Component } from "react";
import LoadingPage from "../LoadingPage";

class GameList extends Component {
	componentDidMount() {
		this.fetchGameList();
	}

	populateGameList() {
		const games = this.props.games || null;

		if (games === null) {
			return <LoadingPage />;
		} else if (games.length === 0) {
			return "No games found";
		} else {
			const renderedGames = games.map(game => {
				return (
					<p key={game._id}>
						{game._opposition.name.short} {game.date}
					</p>
				);
			});
			return <div children={renderedGames} />;
		}
	}

	render() {
		return (
			<div>
				<div className="page-header">
					<h1>{this.generatePageHeader()}</h1>
				</div>
				<div className="container">{this.populateGameList()}</div>
			</div>
		);
	}
}

export default GameList;
