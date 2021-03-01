//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

//Components
import DeleteButtons from "./fields/DeleteButtons";
import LoadingPage from "./LoadingPage";
import Table from "./Table";
import ErrorPrintout from "./ErrorPrintout";
import PopUpDialog from "./PopUpDialog";

//Actions
import { archiveError, archiveAllErrors, fetchErrors, unarchiveError } from "~/client/actions/errorActions";

class ErrorList extends Component {
	constructor(props) {
		super(props);

		this.props.fetchErrors();

		this.state = {
			showInPopUp: null
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const { errorList } = nextProps;
		const newState = { errorList, isLoading: false };

		if (!errorList) {
			newState.isLoading = true;
		}

		return newState;
	}

	getColumns() {
		const { showAllColumns } = this.props;

		const columns = [
			{
				key: "date",
				label: "Date",
				defaultAscSort: false
			},
			{
				key: "_user",
				label: "User",
				className: "link"
			},
			{
				key: "page",
				label: "Page",
				className: "link"
			},
			{
				key: "message",
				label: "Error",
				className: "link"
			}
		];

		if (showAllColumns) {
			columns.push(
				{
					key: "ip",
					label: "IP"
				},
				{
					key: "browser",
					label: "Browser"
				},
				{
					key: "deviceType",
					label: "Device"
				},
				{
					key: "archive",
					label: "",
					className: "link"
				}
			);
		}

		return columns;
	}

	getRows(columns) {
		const { archiveError, unarchiveError } = this.props;
		const { errorList } = this.state;

		return errorList.map(error => {
			const data = _.chain(columns)
				.map(({ key }) => {
					let value;
					switch (key) {
						case "date": {
							value = new Date(error.date).toString("yyyy-MM-dd HH:mm:ss");
							break;
						}
						case "_user": {
							if (error[key]) {
								value = {
									content: <Link to={`/admin/users/${error[key]._id}`}>{error[key].name.full}</Link>,
									sortValue: error[key].name.full
								};
							} else {
								value = "-";
							}
							break;
						}
						case "page":
							value = {
								content: <Link to={error.page}>{error.page}</Link>,
								sortValue: error.page
							};
							break;
						case "message":
							value = {
								content: (
									<span>
										{error.message.substr(0, 30)}
										{error.message.length > 30 ? "..." : ""}
									</span>
								),
								onClick: () => this.setState({ showInPopUp: error._id })
							};
							break;
						case "archive":
							if (error.archived) {
								value = {
									content: "\u2b6f",
									onClick: () => unarchiveError(error._id),
									title: "Unarchive"
								};
							} else {
								value = {
									content: "\u2716",
									onClick: () => archiveError(error._id),
									title: "Archive"
								};
							}
							break;
						default:
							value = error[key];
							break;
					}

					return [key, value];
				})
				.fromPairs()
				.value();

			return {
				key: error._id,
				data,
				className: error.archived ? "archived" : ""
			};
		});
	}

	renderPopUp() {
		const { errorList, showInPopUp } = this.state;

		if (showInPopUp) {
			const error = errorList.find(({ _id }) => _id == showInPopUp);
			const props = _.pick(error, ["message", "file", "componentStack"]);
			props.date = new Date(error.date);
			return (
				<PopUpDialog fullSize={true} onDestroy={() => this.setState({ showInPopUp: null })}>
					<ErrorPrintout {...props} />
				</PopUpDialog>
			);
		}
	}

	renderReloadButtons() {
		const { fetchErrors, showAllColumns } = this.props;

		if (showAllColumns) {
			return (
				<div className="buttons">
					<button type="button" onClick={() => fetchErrors()}>
						Reload
					</button>
					<button type="button" onClick={() => fetchErrors(true)}>
						Reload (include archived)
					</button>
				</div>
			);
		}
	}
	renderDeleteButtons() {
		const { archiveAllErrors, showAllColumns } = this.props;

		if (showAllColumns) {
			return <DeleteButtons onDelete={() => archiveAllErrors(true)} deleteText={"Archive All"} />;
		}
	}

	render() {
		const { showAllColumns } = this.props;
		const { errorList, isLoading } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}

		let content;
		if (!errorList.length) {
			content = "No errors in the database";
		} else {
			const columns = this.getColumns();
			const rows = this.getRows(columns);
			content = (
				<div>
					<div className="error-list-table-wrapper">
						<Table
							className={`error-list-table ${showAllColumns ? "all-columns" : "limited-columns"}`}
							columns={columns}
							defaultAscSort={true}
							defaultSortable={false}
							rows={rows}
							sortBy={{ key: "date", asc: false }}
						/>
					</div>
					{this.renderDeleteButtons()}
					{this.renderPopUp()}
				</div>
			);
		}

		return (
			<div className="form-card">
				{this.renderReloadButtons()}
				{content}
			</div>
		);
	}
}

ErrorList.propTypes = {
	showAllColumns: PropTypes.bool.isRequired
};

function mapStateToProps({ errors }) {
	const { errorList } = errors;
	return { errorList };
}

export default connect(mapStateToProps, {
	archiveError,
	archiveAllErrors,
	fetchErrors,
	unarchiveError
})(ErrorList);
