import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";

class Table extends Component {
	constructor(props) {
		super(props);
		this.state = { ...props };
	}

	static getDerivedStateFromProps(props, prevState) {
		return {
			...props,
			sortBy: prevState.sortBy || props.sortBy
		};

		if (props.columns !== prevState.columns || props.rows !== prevState.rows) {
			return { ...props };
		} else if (props.foot !== prevState.foot) {
			return { foot: props.foot };
		} else {
			return {};
		}
	}

	handleSort(key) {
		const { sortBy, columns, defaultAscSort } = this.state;
		const column = _.filter(columns, c => c.key === key)[0];
		let newSortKey;
		if (sortBy && sortBy.key === key) {
			//We're already sorting by this value, so we simply invert the order
			newSortKey = { key, asc: !sortBy.asc };
		} else {
			//New sort
			const asc =
				column.defaultAscSort !== undefined ? column.defaultAscSort : defaultAscSort;
			newSortKey = { key, asc };
		}

		this.setState({ sortBy: newSortKey });
	}

	processHead() {
		const { columns, stickyHead, defaultSortable, sortBy, defaultAscSort } = this.state;
		return (
			<thead className={stickyHead ? "sticky" : ""}>
				<tr>
					{columns.map(column => {
						const isSortable =
							column.sortable === undefined ? defaultSortable : column.sortable;

						const classNames = [isSortable ? "sortable" : "", column.className || ""];

						let useAscArrow;
						if (sortBy && sortBy.key === column.key) {
							classNames.push("sorted");
							useAscArrow = sortBy.asc;
						} else {
							useAscArrow =
								column.defaultAscSort !== undefined
									? column.defaultAscSort
									: defaultAscSort;
						}

						return (
							<th
								key={column.key}
								onClick={isSortable ? () => this.handleSort(column.key) : null}
								className={classNames.filter(Boolean).join(" ")}
								title={column.title || column.label}
							>
								{column.label}
								{isSortable ? (
									<span className="sort-arrow">{useAscArrow ? "▴" : "▾"}</span>
								) : null}
							</th>
						);
					})}
				</tr>
			</thead>
		);
	}

	processBody() {
		let { columns, rows, sortBy, onBodyRowClick } = this.state;
		//Reorder rows
		if (sortBy && sortBy.key) {
			rows = _.sortBy(rows, row => {
				const data = row.data[sortBy.key];
				if (data === undefined) {
					return 0;
				} else if (data.sortValue !== undefined) {
					return data.sortValue;
				} else {
					return data.content;
				}
			});
		}
		if (sortBy && !sortBy.asc) {
			rows = _.reverse(rows);
		}
		return (
			<tbody>
				{rows.map(row => {
					return (
						<tr key={row.key} onClick={row.onClick} className={row.className || ""}>
							{columns.map(column => {
								const data = row.data[column.key];
								const cellProps = { key: `${row.key}-${column.key}` };

								//Handle missing values
								if (data === undefined) {
									cellProps.children = "-";
									cellProps.title = column.title || column.label;
								} else {
									cellProps.children = data.content;
									cellProps.title = data.title || column.title || column.label;
								}
								return column.dataUsesTh ? (
									<th {...cellProps} />
								) : (
									<td {...cellProps} />
								);
							})}
						</tr>
					);
				})}
			</tbody>
		);
	}

	processFoot() {
		const { foot, columns, stickyFoot } = this.state;
		if (!foot) {
			return null;
		}

		return (
			<tfoot className={stickyFoot ? "sticky" : ""}>
				<tr>
					{columns.map(column => {
						const cellProps = {
							key: column.key,
							children: foot[column.key]
						};
						if (column.dataUsesTh) {
							return <th {...cellProps} />;
						} else {
							return <td {...cellProps} />;
						}
					})}
				</tr>
			</tfoot>
		);
	}

	render() {
		const { className } = this.state;
		return (
			<table className={`table ${className || ""}`}>
				{this.processHead()}
				{this.processBody()}
				{this.processFoot()}
			</table>
		);
	}
}

Table.propTypes = {
	columns: PropTypes.arrayOf(
		PropTypes.shape({
			key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			label: PropTypes.string.isRequired,
			sortable: PropTypes.bool,
			defaultAscSort: PropTypes.bool,
			dataUsesTh: PropTypes.bool
		})
	).isRequired,
	rows: PropTypes.arrayOf(
		PropTypes.shape({
			key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			data: PropTypes.objectOf(
				PropTypes.shape({
					content: PropTypes.node.isRequired,
					sortValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
					title: PropTypes.string
				})
			),
			className: PropTypes.string,
			onClick: PropTypes.func
		})
	).isRequired,
	foot: PropTypes.objectOf(
		PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node])
	),
	defaultSortable: PropTypes.bool,
	defaultAscSort: PropTypes.bool,
	sortBy: PropTypes.shape({
		key: PropTypes.string.isRequired,
		asc: PropTypes.bool.isRequired
	}),
	stickyHead: PropTypes.bool,
	stickyFoot: PropTypes.bool
};

Table.defaultProps = {
	defaultSortable: true,
	defaultAscSort: false,
	stickyHead: false,
	stickyFoot: false
};

export default Table;
