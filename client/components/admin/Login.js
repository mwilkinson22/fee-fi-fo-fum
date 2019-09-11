//Modules
import React from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "./BasicForm";

//Actions
import { login } from "../../actions/userActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class Login extends BasicForm {
	constructor(props) {
		super(props);

		const validationSchema = Yup.object().shape({
			username: Yup.string()
				.required()
				.label("Username"),
			password: Yup.string()
				.required()
				.label("Password")
		});

		this.state = { validationSchema };
	}

	renderFields() {
		const fields = [
			{ name: "username", type: fieldTypes.text },
			{ name: "password", type: fieldTypes.password }
		];

		return (
			<Form>
				<div className="form-card login-card">
					{this.renderFieldGroup(fields)}
					<div className="buttons">
						<button type="submit">Log In</button>
					</div>
				</div>
			</Form>
		);
	}

	render() {
		return (
			<div className="container">
				<h1>Login</h1>
				<Formik
					onSubmit={values => this.props.login(values)}
					initialValues={{
						username: "",
						password: ""
					}}
					validationSchema={this.state.validationSchema}
					render={formikProps => this.renderFields(formikProps)}
				/>
			</div>
		);
	}
}
export default connect(
	null,
	{ login }
)(Login);
