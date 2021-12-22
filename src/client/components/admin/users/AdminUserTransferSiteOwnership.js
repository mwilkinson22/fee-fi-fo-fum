//Modules
import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";

//Actions
import { transferSiteOwnership } from "~/client/actions/userActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import NotFoundPage from "~/client/pages/NotFoundPage";

class AdminUserTransferSiteOwnership extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { authUser, user } = nextProps;
		const newState = { authUser, user };

		newState.validationSchema = Yup.object().shape({
			password: Yup.string().required().label("Password")
		});

		return newState;
	}

	getInitialValues() {
		return { password: "" };
	}

	getFieldGroups() {
		return [
			{
				render: () => [
					<div className="error" key="warning">
						<strong>WARNING</strong>
					</div>,
					<p className="full-span" key="warning-msg">
						{
							"Clicking submit will transfer ownership of the site to the this user. You will remain an admin but will not be able to undo this without the new owner's permission. Please enter your password before proceeding"
						}
					</p>
				]
			},
			{
				fields: [{ name: "password", type: fieldTypes.password }]
			}
		];
	}

	async handleSubmit(values) {
		const { transferSiteOwnership, history } = this.props;
		const { user } = this.state;
		const success = await transferSiteOwnership(user._id, values.password);
		if (success) {
			history.replace(`/admin/users/${user._id}`);
		}
	}

	render() {
		const { transferSiteOwnership } = this.props;
		const { validationSchema, user, authUser } = this.state;

		if (!authUser.isSiteOwner || authUser._id == user._id) {
			return <NotFoundPage />;
		}

		return (
			<BasicForm
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={false}
				itemType="Ownership"
				onSubmit={values => transferSiteOwnership(user._id, values.password)}
				redirectOnSubmit={() => `/admin/users/${user._id}`}
				submitButtonText="Transfer Ownership"
				validationSchema={validationSchema}
			/>
		);
	}
}

AdminUserTransferSiteOwnership.propTypes = {
	user: PropTypes.object
};

function mapStateToProps({ config }) {
	const { authUser } = config;
	return { authUser };
}

export default withRouter(connect(mapStateToProps, { transferSiteOwnership })(AdminUserTransferSiteOwnership));
