import React, { Component } from "react";
import { Link } from "react-router-dom";
import _ from "lodash";
import PlayerStatsHelper from "../../helperClasses/PlayerStatsHelper";
import TeamImage from "../teams/TeamImage";
import playerStatTypes from "../../../constants/playerStatTypes";
import Table from "../Table";

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

		const tableType = games ? "games" : "players";

		//Get Rows
		let rows;
		if (games) {
			rows = StatsTables.processGameList(games);
		}
		if (players) {
			rows = StatsTables.processPlayerList(games);
		}

		const statTypes = _.chain(rows)
			.map(row => _.keys(row.data))
			.flatten()
			.uniq()
			.filter(key => playerStatTypes[key] !== undefined)
			.groupBy(key => playerStatTypes[key].type)
			.reverse()
			.value();

		const tabs = _.keys(statTypes);
		let { activeTab } = prevState;
		if (tabs.indexOf(activeTab) === -1) {
			activeTab = tabs[0];
		}

		return { statTypes, rows, activeTab, tableType };
	}

	static processGameList(games) {
		const rows = _.map(games, game => {
			const { slug, _opposition, date, title } = game;
			const stats = _.chain(game.playerStats[0].stats)
				.mapValues((val, key) => {
					if (!playerStatTypes[key]) {
						return null;
					}
					return {
						content: PlayerStatsHelper.toString(key, val),
						sortValue: val,
						title: `${playerStatTypes[key].plural} against ${
							game._opposition.name.short
						}`
					};
				})
				.pickBy(_.identity)
				.value();
			const data = {
				first: {
					content: (
						<Link to={`/games/${slug}`} className="fixture-box">
							<TeamImage team={_opposition} />
							<div className="date mobile">{new Date(date).toString("dS MMM")}</div>
							<div className="date desktop">
								{new Date(date).toString("ddd dS MMMM")}
							</div>
							<div className="title">{title}</div>
						</Link>
					),
					sortValue: date.toString("yyyyMMdd"),
					title
				},
				...stats
			};
			return { key: slug, data };
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

	renderTabs() {
		const { statTypes, activeTab } = this.state;
		return (
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
		);
	}

	renderColumns() {
		const { statTypes, activeTab, tableType } = this.state;
		const columnsFromStatType = statTypes[activeTab].map(key => {
			const stat = playerStatTypes[key];
			return {
				key,
				label: stat.plural,
				defaultAscSort: !stat.moreIsBetter
			};
		});

		return [
			{
				key: "first",
				label: tableType === "games" ? "Game" : "Player",
				defaultAscSort: true,
				dataUsesTh: true
			},
			...columnsFromStatType
		];
	}

	renderFoot() {
		const { statTypes, activeTab, rows } = this.state;
		if (rows.length < 2) {
			return null;
		} else {
			const data = rows.map(row => {
				return _.mapValues(row.data, stat => stat.sortValue);
			});
			const summedStats = PlayerStatsHelper.sumStats(data);
			const foot = _.chain(statTypes[activeTab])
				.map(key => {
					const stat = playerStatTypes[key];
					let { total, average } = summedStats[key];
					const content = [];

					if (average == null) {
						total = null;
					}

					content.push(
						<span className="total" key="total" title={`Total ${stat.plural}`}>
							{PlayerStatsHelper.toString(key, total)}
						</span>
					);
					if (["TS", "KS"].indexOf(key) === -1) {
						content.push(
							<span
								className="average"
								key="average"
								title={`Average ${stat.plural}`}
							>
								{PlayerStatsHelper.toString(key, average)}
							</span>
						);
					}

					return [key, content];
				})
				.fromPairs()
				.value();
			return {
				first: [
					<span className="total" key="total">
						Total
					</span>,
					<span className="average" key="average">
						Average
					</span>
				],
				...foot
			};
		}
	}

	render() {
		return (
			<div className="stat-tables">
				<h2>Games</h2>
				{this.renderTabs()}
				<div className="stat-table-wrapper">
					<Table
						columns={this.renderColumns()}
						rows={this.state.rows}
						sortBy={{ key: "first", asc: true }}
						foot={this.renderFoot()}
						stickyHead={true}
						stickyFoot={true}
					/>
				</div>
			</div>
		);
	}
}
