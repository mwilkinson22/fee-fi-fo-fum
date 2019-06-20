import React, { Component } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import _ from "lodash";
import PlayerStatsHelper from "../../helperClasses/PlayerStatsHelper";
import TeamImage from "../teams/TeamImage";
import playerStatTypes from "../../../constants/playerStatTypes";
import Table from "../Table";

class StatsTables extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sortBy: { key: null, asc: true }
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { listType, data } = nextProps;

		//Get Rows
		let rows;
		let firstColumnHeader;
		switch (listType) {
			case "player": {
				rows = StatsTables.processGameList(data);
				firstColumnHeader = "Game";
				break;
			}
			case "games": {
				rows = StatsTables.processGameList(data);
				console.log(data);
				break;
			}
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

		return { statTypes, rows, activeTab, firstColumnHeader };
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
		const { statTypes, activeTab, firstColumnHeader } = this.state;
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
				label: firstColumnHeader,
				defaultAscSort: true,
				dataUsesTh: true
			},
			...columnsFromStatType
		];
	}

	renderFoot() {
		const { showTotal, showAverage } = this.props;
		const { statTypes, activeTab, rows } = this.state;
		if (rows.length < 2 || (!showTotal && !showAverage)) {
			return null;
		} else {
			const data = rows.map(row => {
				return _.mapValues(row.data, stat => stat.sortValue);
			});
			const summedStats = PlayerStatsHelper.sumStats(data);

			//Get Labels
			const first = [];
			if (showTotal) {
				first.push(
					<span className="total" key="total">
						Total
					</span>
				);
			}
			if (showAverage) {
				first.push(
					<span className="average" key="average">
						Average
					</span>
				);
			}

			//Get Data
			const foot = _.chain(statTypes[activeTab])
				.map(key => {
					const stat = playerStatTypes[key];
					let { total, average } = summedStats[key];
					const content = [];

					if (average == null) {
						total = null;
					}

					const totalSpan = (
						<span className="total" key="total" title={`Total ${stat.plural}`}>
							{PlayerStatsHelper.toString(key, total)}
						</span>
					);
					const averageSpan = (
						<span className="average" key="average" title={`Average ${stat.plural}`}>
							{PlayerStatsHelper.toString(key, average)}
						</span>
					);

					if (["TS", "KS"].indexOf(key) > -1) {
						//For Tackle and Kicking Success, we just show the one value regardless of settings
						content.push(averageSpan);
					} else {
						if (showTotal) {
							content.push(totalSpan);
						}
						if (showAverage) {
							content.push(averageSpan);
						}
					}

					return [key, content];
				})
				.fromPairs()
				.value();
			return {
				first,
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

StatsTables.propTypes = {
	data: PropTypes.array.isRequired,
	listType: PropTypes.oneOf(["player", "game"]).isRequired,
	showAverage: PropTypes.bool,
	showTotal: PropTypes.bool
};

StatsTables.defaultProps = {
	showAverage: true,
	showTotal: true
};

export default StatsTables;
