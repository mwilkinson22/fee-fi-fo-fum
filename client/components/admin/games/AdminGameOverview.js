import React, { Component } from "react";
import { connect } from "react-redux";
import AdminStandardForm from "../../hoc/AdminStandardForm";

class AdminGameOverview extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		return {};
	}

	onSubmit(values) {}

	onChange(values) {}

	customValidation(values, errors) {}

	render() {
		const { isNew } = this.props || false;
		const { onSubmit, customValidation } = this;
		const formProps = {
			formName,
			customValidation,
			isNew,
			onSubmit,
			fieldGroups
		};
		return <AdminStandardForm {...formProps} />;
	}
}
const required = true;
export const fieldGroups = {
	Basics: [
		{ name: "date", type: "date", label: "Date", required },
		{ name: "time", type: "time", label: "Time", required },
		{ name: "team_type", type: "text", label: "Team Type", required },
		{ name: "competition", type: "text", label: "Competition", required },
		{ name: "round", type: "number", label: "Round", required },
		{ name: "opposition", type: "text", label: "Opposition", required }
	],
	Venue: [
		{
			name: "venue",
			type: "radio",
			label: "Venue",
			options: { home: "Home", away: "Away", neutral: "Neutral" },
			required
		},
		{
			name: "customGround",
			type: "boolean",
			label: "Neutral Ground",
			visible: values => values.venue === "neutral"
		}
	]
};

export const formName = "";

function mapStateToProps(state, ownProps) {
	return { ...ownProps };
}

export default connect(mapStateToProps)(AdminGameOverview);
