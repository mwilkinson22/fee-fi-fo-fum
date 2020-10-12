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
		const {
			columns,
			stickyHead,
			defaultSortable,
			sortBy,
			defaultAscSort,
			keyAsClassName,
			headerStyling,
			initialHeaderSpan
		} = this.state;
		return (
			<thead className={stickyHead ? "sticky" : ""}>
				<tr>
					{columns.map((column, i) => {
						const isSortable =
							column.sortable === undefined ? defaultSortable : column.sortable;

						const classNames = [
							isSortable ? "sortable" : "",
							keyAsClassName ? column.key : "",
							column.className || "",
							column.headerClassName || ""
						];

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

						//Skip in case of column span
						if (i !== 0 && i < initialHeaderSpan) {
							return null;
						}

						return (
							<th
								key={column.key}
								onClick={isSortable ? () => this.handleSort(column.key) : null}
								className={classNames.filter(Boolean).join(" ").trim() || null}
								title={column.title || null}
								style={headerStyling}
								colSpan={i === 0 ? initialHeaderSpan : 1}
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
		let { columns, rows, sortBy, labelAsDefaultTitle, keyAsClassName } = this.state;

		//Convert raw data to object with "content" field, if necessary
		rows = rows.map(row => {
			//Clone Data
			const data = { ...row.data };

			//Loop through cloned object, if the value is a node (as opposed to
			//an object with a content key), we convert it to an object
			for (const key in data) {
				const rowData = data[key];
				if (React.isValidElement(rowData) || typeof rowData !== "object") {
					data[key] = {
						content: rowData
					};
				}
			}

			//Return the newly processed data, plus a clone of the other row properties
			return {
				...row,
				data
			};
		});

		//Reorder rows
		if (sortBy && sortBy.key) {
			rows = _.sortBy(rows, row => {
				const data = row.data[sortBy.key];
				if (data === undefined) {
					return 0;
				} else if (data.sortValue === null) {
					return sortBy.asc ? 99999999999999 : -999999999999;
				} else if (data.sortValue !== undefined) {
					return data.sortValue;
				} else {
					return data.content;
				}
			});
		}
		if (sortBy && !sortBy.asc) {
			rows = rows.reverse();
		}
		return (
			<tbody>
				{rows.map(row => {
					return (
						<tr key={row.key} onClick={row.onClick} className={row.className}>
							{columns.map(column => {
								const data = row.data[column.key];
								const cellProps = { key: `${row.key}-${column.key}` };

								//Classes
								const classNames = [];
								if (keyAsClassName) {
									classNames.push(column.key);
								}
								if (column.className) {
									classNames.push(column.className);
								}

								cellProps.className =
									classNames.filter(Boolean).join(" ").trim() || null;

								//Handle missing values
								if (data === undefined) {
									cellProps.children = "-";
									cellProps.title = column.title || column.label;
								} else {
									//Click Events
									cellProps.onClick = data.onClick;
									cellProps.children = data.content;
									cellProps.title =
										data.title ||
										column.title ||
										(labelAsDefaultTitle ? column.label : null);
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
			label: PropTypes.node.isRequired,
			title: PropTypes.string,
			sortable: PropTypes.bool,
			defaultAscSort: PropTypes.bool,
			dataUsesTh: PropTypes.bool,
			className: PropTypes.string,
			headerClassName: PropTypes.string
		})
	).isRequired,
	rows: PropTypes.arrayOf(
		PropTypes.shape({
			key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			data: PropTypes.objectOf(
				PropTypes.oneOfType([
					PropTypes.node,
					PropTypes.shape({
						content: PropTypes.node.isRequired,
						onClick: PropTypes.func,
						sortValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
						title: PropTypes.string
					})
				])
			).isRequired,
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
	stickyFoot: PropTypes.bool,
	keyAsClassName: PropTypes.bool,
	headerStyling: PropTypes.shape({
		background: PropTypes.string,
		text: PropTypes.string
	}),
	initialHeaderSpan: PropTypes.number
};

Table.defaultProps = {
	defaultSortable: true,
	defaultAscSort: false,
	labelAsDefaultTitle: false,
	stickyHead: false,
	stickyFoot: false,
	keyAsClassName: false,
	headerStyling: {},
	initialHeaderSpan: 1
};

export default Table;
