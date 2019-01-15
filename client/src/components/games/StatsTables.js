import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import _ from "lodash";
import "datejs";

class StatsTables extends Component {
	constructor(props) {
		super(props);
		const { games, players } = this.props;
		if (!games && !players) {
			throw new Error("Either games or players must be passed into StatsTables");
		}
		if (games && players) {
			throw new Error("Only one out of games and players can be passed into StatsTables");
		}
	}

	processGameList() {
		const { games } = this.props;
		return _.map(games, game => {
			const { slug, _opposition, date, title } = game;
			const firstColumn = (
				<Link to={`/games/${slug}`} className="fixture-box">
					<img src={_opposition.image} alt={_opposition.name.long} />
					<div className="date">{new Date(date).toString("dS MMMM yyyy")}</div>
					<div className="title">{title}</div>
				</Link>
			);
			const { stats } = game.playerStats[0];
			return { firstColumn, stats };
		});
	}

	processPlayerList() {}

	render() {
		const { games, players, playerStatTypes } = this.props;
		let processedStats;
		if (games) {
			processedStats = this.processGameList();
		}
		if (players) {
			processedStats = this.processPlayerList();
		}
		const groupedStats = _.chain(processedStats)
			.map(row => _.keys(row.stats))
			.flatten()
			.filter(key => key !== "_id")
			.uniq()
			.groupBy(key => playerStatTypes[key].type)
			.reverse()
			.value();

		return null;
	}
}

function mapStateToProps({ stats }, ownProps) {
	const { playerStatTypes } = stats;
	return { ...ownProps, playerStatTypes };
}

export default connect(mapStateToProps)(StatsTables);
