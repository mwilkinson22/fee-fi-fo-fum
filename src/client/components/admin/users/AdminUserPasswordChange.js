//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";

//Actions
import { updateUser } from "~/client/actions/userActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import { validatePasswordFields } from "~/helpers/adminHelper";

class AdminUserPasswordChange extends Component {
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

	getInitialValues() {
		return { password: "", password2: "" };
	}

	getFieldGroups() {
		return [
			{
				fields: [
					{ name: "password", type: fieldTypes.password },
					{ name: "password2", type: fieldTypes.password }
				]
			}
		];
	}

	async handleSubmit(values) {
		const { updateUser } = this.props;
		const { user } = this.state;
		await updateUser(user._id, { password: values.password });
	}

	render() {
		const { updateUser } = this.props;
		const { user, validationSchema } = this.state;

		return (
			<BasicForm
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={false}
				itemType="Password"
				onSubmit={({ password }) => updateUser(user._id, { password })}
				validationSchema={validationSchema}
			/>
		);
	}
}

AdminUserPasswordChange.propTypes = {
	user: PropTypes.object
};

function mapStateToProps({ config }) {
	const { authUser } = config;
	return { authUser };
}

export default connect(mapStateToProps, { updateUser })(AdminUserPasswordChange);
