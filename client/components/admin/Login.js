import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { reduxForm, Field } from "redux-form";
import { login } from "../../actions/userActions";

const fields = [
	{
		name: "username",
		type: "text",
		label: "Username"
	},
	{
		name: "password",
		type: "password",
		label: "Password"
	}
];

class Login extends Component {
	renderField(field) {
		const { touched, error } = field.meta;
		return (
			<div className="field-group">
				<label>{field.label}</label>
				<input type={field.type} {...field.input} />
				<span className="error">{touched ? error : ""}</span>
			</div>
		);
	}

	onSubmit(values) {
		this.props.login(values);
	}

	render() {
		const { handleSubmit } = this.props;
		return (
			<div className="container">
				<h1>Login</h1>
				<div className="form-card login-card">
					<form onSubmit={handleSubmit(this.onSubmit.bind(this))}>
						{_.map(fields, field => (
							<Field key={field.name} component={this.renderField} {...field} />
						))}
						<button type="submit">Login</button>
					</form>
				</div>
			</div>
		);
	}
}

function validate(values) {
	const errors = {};

	_.map(fields, field => {
		const { name, label } = field;
		if (!values[name]) {
			errors[name] = `Please enter a ${label}`;
		}
	});

	return errors;
}

export default reduxForm({ form: "loginForm", validate })(
	connect(
		null,
		{ login }
	)(Login)
);
