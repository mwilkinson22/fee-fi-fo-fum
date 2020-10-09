//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Components
import Table from "../Table";

//Constants
import playerStatTypes from "../../../constants/playerStatTypes";

//Helpers
import { getTotalsAndAverages, statToString } from "~/helpers/statsHelper";

class StatsTables extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sortBy: { key: null, asc: true }
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { rows, addGames } = nextProps;

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

		return { statTypes, rows, activeTab, addGames };
	}

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
		const { statTypes, activeTab, addGames } = this.state;
		const { firstColumnHeader } = this.props;
		const columnsFromStatType = statTypes[activeTab].map(key => {
			const stat = playerStatTypes[key];
			return {
				key,
				label: stat.plural,
				defaultAscSort: !stat.moreIsBetter
			};
		});

		const columns = [
			{
				key: "first",
				label: firstColumnHeader,
				defaultAscSort: true,
				dataUsesTh: true
			}
		];

		if (addGames) {
			columns.push({
				key: "games",
				label: "Games"
			});
		}

		columns.push(...columnsFromStatType);

		return columns;
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
			const summedStats = getTotalsAndAverages(data);

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
							{statToString(key, total)}
						</span>
					);
					const averageSpan = (
						<span className="average" key="average" title={`Average ${stat.plural}`}>
							{statToString(key, average)}
						</span>
					);

					if (stat.isAverage) {
						//For Avg Gain, Tackle and Kicking Success, we
						//just show the one value regardless of settings
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
	firstColumnHeader: PropTypes.string,
	rows: Table.propTypes.rows,
	showAverage: PropTypes.bool,
	showTotal: PropTypes.bool,
	addGames: PropTypes.bool
};

StatsTables.defaultProps = {
	addGames: false,
	firstColumnHeader: "",
	showAverage: true,
	showTotal: true
};

function mapStateToProps({ teams }) {
	const { teamList } = teams;
	return { teamList };
}

export default connect(mapStateToProps)(StatsTables);
