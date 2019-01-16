import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import _ from "lodash";
import "datejs";
import PlayerStatsHelper from "../../helperClasses/PlayerStatsHelper";

class StatsTables extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sortBy: "first"
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { games, players, playerStatTypes } = nextProps;

		//Ensure exactly one type of table is called
		if (!games && !players) {
			throw new Error("Either games or players must be passed into StatsTables");
		}
		if (games && players) {
			throw new Error("Only one out of games and players can be passed into StatsTables");
		}

		//Get Rows
		let rows;
		if (games) {
			rows = StatsTables.processGameList(games);
		}
		if (players) {
			rows = StatsTables.processPlayerList(games);
		}

		const statTypes = _.chain(rows)
			.map(row => _.keys(row.stats))
			.flatten()
			.filter(key => key !== "_id")
			.uniq()
			.groupBy(key => playerStatTypes[key].type)
			.reverse()
			.value();

		return { statTypes, rows, activeTab: prevState.activeTab || _.keys(statTypes)[0] };
	}

	static processGameList(games) {
		const rows = _.map(games, game => {
			const { slug, _opposition, date, title } = game;
			const firstColumn = (
				<Link to={`/games/${slug}`} className="fixture-box">
					<img src={_opposition.image} alt={_opposition.name.long} />
					<div className="date">{new Date(date).toString("dS MMMM yyyy")}</div>
					<div className="title">{title}</div>
				</Link>
			);
			const { stats } = game.playerStats[0];
			return { firstColumn, stats, slug, date };
		});

		return rows;
	}

	static processPlayerList() {}

	generateTable() {
		const { rows, activeTab } = this.state;
		const { playerStatTypes } = this.props;
		const statTypes = this.state.statTypes[activeTab];
		const summedStats = PlayerStatsHelper.sumStats(rows.map(row => row.stats));
		return (
			<table className="stat-table">
				<thead>
					<tr>
						<th onClick={() => this.setState({ sortBy: "first" })} />
						{statTypes.map(key => (
							<th onClick={() => this.setState({ sortBy: key })} key={key}>
								{playerStatTypes[key].plural}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map(row => {
						const { firstColumn, slug, stats } = row;
						if (_.sumBy(statTypes, key => stats[key] !== undefined) === 0) {
							return null;
						} else {
							return (
								<tr key={slug}>
									<th>{firstColumn}</th>
									{statTypes.map(key => {
										const value = stats[key];
										if (value !== undefined) {
											return (
												<td value={value} key={`${slug} ${key}`}>
													{value}
													{playerStatTypes[key].unit}
												</td>
											);
										} else {
											return (
												<td value={null} key={`${slug} ${key}`}>
													-
												</td>
											);
										}
									})}
								</tr>
							);
						}
					})}
				</tbody>
				<tfoot>
					<tr>
						<th>
							<span className="total">Total</span>
							<span className="average">Average</span>
						</th>
						{statTypes.map(key => {
							const unit = playerStatTypes[key].unit || "";
							const content = [];
							if (["TS", "KS"].indexOf(key) === -1) {
								content.push(
									<span className="total" key="total">
										{summedStats[key].total.toFixed(2)} {unit}
									</span>
								);
							}
							content.push(
								<span className="average" key="average">
									{summedStats[key].average.toFixed(2)} {unit}
								</span>
							);

							return <td key={`${key}`}>{content}</td>;
						})}
					</tr>
				</tfoot>
			</table>
		);
	}

	render() {
		const { statTypes, activeTab } = this.state;
		return (
			<div className="stat-tables">
				<h2>Games</h2>
				<div className="stat-table-tabs">
					{_.map(statTypes, (keys, statType) => (
						<div
							className={`stat-table-tab ${statType === activeTab ? "active" : ""}`}
							onClick={() => this.setState({ activeTab: statType })}
							key={statType}
						>
							{statType}
						</div>
					))}
				</div>
				<div className="stat-table-wrapper">{this.generateTable()}</div>
			</div>
		);
	}
}

function mapStateToProps({ stats }, ownProps) {
	const { playerStatTypes } = stats;
	return { ...ownProps, playerStatTypes };
}

export default connect(mapStateToProps)(StatsTables);
