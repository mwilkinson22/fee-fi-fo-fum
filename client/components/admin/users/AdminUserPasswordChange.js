//Modules
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";

//Actions
import { updateUser } from "~/client/actions/userActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import { validatePasswordFields } from "~/helpers/adminHelper";

class AdminTeamTypePage extends BasicForm {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { user } = nextProps;
		const newState = { user };

		newState.validationSchema = Yup.object().shape(validatePasswordFields());

		return newState;
	}

	getDefaults() {
		return { password: "", password2: "" };
	}

	async handleSubmit(values) {
		const { updateUser } = this.props;
		const { user } = this.state;
		await updateUser(user._id, { password: values.password });
	}

	render() {
		const { validationSchema } = this.state;

		return (
			<Formik
				onSubmit={values => this.handleSubmit(values)}
				initialValues={this.getDefaults()}
				validationSchema={validationSchema}
				render={() => {
					const fields = [
						{ name: "password", type: fieldTypes.password },
						{ name: "password2", type: fieldTypes.password }
					];

					return (
						<Form>
							<div className="card form-card grid">
								<h6>Change Password</h6>
								{this.renderFieldGroup(fields)}
								<div className="buttons">
									<button type="submit">Change Password</button>
								</div>
							</div>
						</Form>
					);
				}}
			/>
		);
	}
}

AdminTeamTypePage.propTypes = {
	user: PropTypes.object
};

function mapStateToProps({ config }) {
	const { authUser } = config;
	return { authUser };
}

export default connect(
	mapStateToProps,
	{ updateUser }
)(AdminTeamTypePage);
