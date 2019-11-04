//Modules
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";

//Actions
import { transferSiteOwnership } from "~/client/actions/userActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import NotFoundPage from "~/client/pages/NotFoundPage";

class AdminUserTransferSiteOwnership extends BasicForm {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { authUser, user } = nextProps;
		const newState = { authUser, user };

		newState.validationSchema = Yup.object().shape({
			password: Yup.string()
				.required()
				.label("Password")
		});

		return newState;
	}

	getDefaults() {
		return { password: "", password2: "" };
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
		const { validationSchema, user, authUser } = this.state;

		if (!authUser.isSiteOwner || authUser._id == user._id) {
			return <NotFoundPage />;
		}

		return (
			<Formik
				onSubmit={values => this.handleSubmit(values)}
				initialValues={this.getDefaults()}
				validationSchema={validationSchema}
				render={() => {
					const field = [{ name: "password", type: fieldTypes.password }];

					return (
						<Form>
							<div className="card form-card grid">
								<div className="error">
									<strong>WARNING</strong>
								</div>
								<p className="full-span">
									{
										"Clicking submit will transfer ownership of the site to the this user. You will remain an admin but will not be able to undo this without the new owner's permission. Please enter your password before proceeding"
									}
								</p>
								{this.renderFieldGroup(field)}
								<div className="buttons">
									<button type="submit">Transfer Ownership</button>
								</div>
							</div>
						</Form>
					);
				}}
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

export default withRouter(
	connect(
		mapStateToProps,
		{ transferSiteOwnership }
	)(AdminUserTransferSiteOwnership)
);
