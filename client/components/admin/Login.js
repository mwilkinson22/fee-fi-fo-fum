import React, { Component } from "react";
import { reduxForm, Field } from "redux-form";

class LoginPage extends Component {
	render() {
		return (
			<div className="container">
				<h1>Login</h1>
				<div className="form-card login-card">
					<form onSubmit={this.props.handleSubmit(() => this.props.onSurveySubmit())}>
						<Field component={"input"} type="text" name="username" />
						<Field component={"input"} type="password" name="password" />
						<button type="submit">Login</button>
					</form>
				</div>
			</div>
		);
	}
}

export default reduxForm({ form: "loginForm" })(LoginPage);
