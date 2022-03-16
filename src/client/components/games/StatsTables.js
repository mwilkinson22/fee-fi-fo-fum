//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";

//Components
import Table from "../Table";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

//Helpers
import { getTotalsAndAverages, resolveStatObject, statToString } from "~/helpers/statsHelper";

class StatsTables extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sortBy: { key: null, asc: true }
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { rowData, addGames, customStatTypes } = nextProps;

		//Get Standard Stat Types
		//End up with an array of statObjects
		const standardStatTypes = _.chain(rowData)
			.map(row => _.keys(row.data))
			.flatten()
			.uniq()
			.map(key => resolveStatObject(key))
			.filter(_.identity)
			.value();

		//Create array with standard and custom stat types
		const statTypes = [...standardStatTypes, ...customStatTypes].sort((a, b) => {
			if (a.prepend && !b.prepend) {
				return -1;
			} else if (!a.prepend && b.prepend) {
				return 1;
			} else {
				return 0;
			}
		});

		//Create grouped object
		const groupedStatTypes = _.groupBy(statTypes, "type");

		const tabs = _.keys(groupedStatTypes);
		let { activeTab } = prevState;
		if (tabs.indexOf(activeTab) === -1) {
			activeTab = tabs[0];
		}

		return {
			groupedStatTypes,
			statTypes,
			rowData,
			activeTab,
			addGames
		};
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
		const { groupedStatTypes, activeTab } = this.state;
		return (
			<div className="stat-table-tabs">
				{_.map(groupedStatTypes, (keys, statType) => (
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

	renderRows() {
		const { rowData, statTypes } = this.state;
		return rowData.map(({ data, ...row }) => {
			row.data = _.mapValues(data, (value, key) => {
				switch (key) {
					case "first":
						//already formatted
						return value;
					case "games":
						return {
							content: value
						};
					default: {
						if (typeof value === "object" && value != null) {
							//Something we've pre-formatted
							return value;
						}

						const statObject = statTypes.find(s => s.key == key);
						if (statObject) {
							const nullValue = statObject.moreIsBetter ? -1 : 10000000000;
							return {
								content: statToString(statObject, value),
								sortValue: value != null ? value : nullValue
							};
						} else {
							//If we get here, it means we've passed in a custom column
							//to rowData and haven't defined it in customStatTypes.
							//The value should never render, as it won't belong to any tabs
							//but adding this prevents an error
							return { content: value };
						}
					}
				}
			});

			return row;
		});
	}

	renderColumns() {
		const { groupedStatTypes, activeTab, addGames, rowData } = this.state;
		const { firstColumnHeader } = this.props;
		const columns = groupedStatTypes[activeTab]
			.map(statType => {
				const { key, plural, moreIsBetter, className, headerClassName } = statType;

				//Ensure we have at least one non-null value before we display,
				//this allows us to add new stats such as 20/40 that don't appear on older games
				const rowsWithAValue = rowData.filter(({ data }) => data[key] !== null);
				if (!rowsWithAValue.length) {
					return null;
				}
				return {
					key,
					label: plural,
					defaultAscSort: !moreIsBetter,
					className,
					headerClassName
				};
			})
			.filter(row => row !== null);

		if (addGames) {
			columns.unshift({
				key: "games",
				label: "Games"
			});
		}

		columns.unshift({
			key: "first",
			label: firstColumnHeader,
			defaultAscSort: true,
			dataUsesTh: true
		});

		return columns;
	}

	renderFoot() {
		const { customStatTypes, showTotal, showAverage } = this.props;
		const { groupedStatTypes, activeTab, rowData } = this.state;
		if (rowData.length < 2 || (!showTotal && !showAverage)) {
			return null;
		} else {
			const data = rowData.map(row => {
				return _.mapValues(row.data, stat => {
					if (typeof stat === "object" && stat != null) {
						//For future reference, don't change this to use ?? or anything similar.
						//Sometimes stat.sortValue is null, and this is a valid value, statHelper
						//will handle it appropriately
						return stat.hasOwnProperty("sortValue") ? stat.sortValue : stat.content;
					} else {
						return stat;
					}
				});
			});

			const summedStats = getTotalsAndAverages(data, customStatTypes);

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
			const foot = _.chain(groupedStatTypes[activeTab])
				.map(keyOrCustomStatType => {
					const statObject = resolveStatObject(keyOrCustomStatType, customStatTypes);

					//Null check
					if (!statObject) {
						return null;
					}

					//Check for disabled fields
					if (statObject.disableFooter) {
						return null;
					}

					const { key } = statObject;

					let { total, average } = summedStats[key];
					const content = [];

					if (average == null) {
						total = null;
					}

					const totalSpan = (
						<span className="total" key="total" title={`Total ${statObject.plural}`}>
							{statToString(keyOrCustomStatType, total)}
						</span>
					);
					const averageSpan = (
						<span className="average" key="average" title={`Average ${statObject.plural}`}>
							{statToString(keyOrCustomStatType, average)}
						</span>
					);

					if (statObject.isAverage) {
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
				.filter(_.identity)
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
						rows={this.renderRows()}
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
	rowData: Table.propTypes.rows,
	showAverage: PropTypes.bool,
	showTotal: PropTypes.bool,
	addGames: PropTypes.bool,

	//E.g. [ { key: "M100", type: "Milestones", singular: "Player Over 100m", plural: "Players over 100m" } ]
	customStatTypes: PropTypes.arrayOf(
		PropTypes.shape({
			key: PropTypes.string.isRequired,
			singular: PropTypes.string.isRequired,
			plural: PropTypes.string.isRequired,
			type: PropTypes.string.isRequired,
			unit: PropTypes.string, //defaults to null
			moreIsBetter: PropTypes.bool, //defaults to true,
			className: PropTypes.string,
			headerClassName: PropTypes.string
		})
	)
};

StatsTables.defaultProps = {
	addGames: false,
	customStatTypes: [],
	firstColumnHeader: "",
	showAverage: true,
	showTotal: true
};

export default StatsTables;
