import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import { login } from "../../actions/userActions";
import * as Yup from "yup";
import { processFormFields } from "~/helpers/adminHelper";

class Login extends Component {
	getValidationSchema() {
		return Yup.object().shape({
			username: Yup.string()
				.required()
				.label("Username"),
			password: Yup.string()
				.required()
				.label("Password")
		});
	}

	renderFields() {
		const fields = [{ name: "username", type: "text" }, { name: "password", type: "password" }];

		return (
			<Form>
				<div className="form-card login-card">
					{processFormFields(fields, this.getValidationSchema())}
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
					validationSchema={this.getValidationSchema()}
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
