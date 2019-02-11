import React, { Component } from "react";
import { Link } from "react-router-dom";
import _ from "lodash";
import "datejs";
import PlayerStatsHelper from "../../helperClasses/PlayerStatsHelper";
import TeamImage from "../teams/TeamImage";
import playerStatTypes from "../../../constants/playerStatTypes";

export default class StatsTables extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sortBy: { key: null, asc: true }
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { games, players } = nextProps;

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

		const tabs = _.keys(statTypes);
		let { activeTab } = prevState;
		if (tabs.indexOf(activeTab) === -1) {
			activeTab = tabs[0];
		}

		return { statTypes, rows, activeTab };
	}

	static processGameList(games) {
		const rows = _.map(games, game => {
			const { slug, _opposition, date, title } = game;
			const firstColumn = (
				<Link to={`/games/${slug}`} className="fixture-box">
					<TeamImage team={_opposition} />
					<div className="date">{new Date(date).toString("dS MMMM yyyy")}</div>
					<div className="title">{title}</div>
				</Link>
			);
			const { stats } = game.playerStats[0];
			return { firstColumn, stats, slug, date, sortBy: { asc: true } };
		});

		return rows;
	}

	static processPlayerList() {}

	handleTableHeaderClick(inputKey = null, enforcedDirection = null) {
		const { key, asc } = this.state.sortBy;
		const sortBy = { key: inputKey };
		if (enforcedDirection) {
			sortBy.asc = enforcedDirection;
		} else if (key === inputKey) {
			sortBy.asc = !asc;
		} else if (playerStatTypes[inputKey]) {
			sortBy.asc = playerStatTypes[inputKey].moreIsBetter;
		} else {
			sortBy.asc = true;
		}
		this.setState({ sortBy });
	}

	handleTabClick(tab) {
		this.handleTableHeaderClick(null, true);
		this.setState({ activeTab: tab });
	}

	generateTable() {
		const { activeTab, sortBy } = this.state;
		let { rows } = this.state;

		if (sortBy.key) {
			rows = _.orderBy(rows, row => row.stats[sortBy.key]);
		}
		if (sortBy.asc) {
			rows = _.reverse(rows);
		}

		const statTypes = this.state.statTypes[activeTab];
		const summedStats = PlayerStatsHelper.sumStats(rows.map(row => row.stats));
		return (
			<table className="stat-table">
				<thead>
					<tr>
						<th onClick={() => this.handleTableHeaderClick()} />
						{statTypes.map(key => (
							<th
								onClick={() => this.handleTableHeaderClick(key)}
								key={key}
								className={sortBy.key === key ? "active" : ""}
							>
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
							let { total, average } = summedStats[key];
							const content = [];

							//Fix string to max 2 decimal places
							total = Math.round(total * 100) / 100;
							average = Math.round(average * 100) / 100;

							content.push(
								<span className="total" key="total">
									{total}
									{unit}
								</span>
							);
							if (["TS", "KS"].indexOf(key) === -1) {
								content.push(
									<span className="average" key="average">
										{average}
										{unit}
									</span>
								);
							}

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
							onClick={() => this.handleTabClick(statType)}
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
