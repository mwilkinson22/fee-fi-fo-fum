//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "./BasicForm";

//Actions
import { login } from "../../actions/userActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class Login extends Component {
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

	getInitialValues() {
		return {
			username: "",
			password: ""
		};
	}

	getFieldGroups() {
		return [
			{
				fields: [
					{ name: "username", type: fieldTypes.text },
					{ name: "password", type: fieldTypes.password }
				]
			}
		];
	}

	render() {
		const { login } = this.props;
		const { validationSchema } = this.state;
		return (
			<div className="container">
				<h1>Login</h1>
				<BasicForm
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isNew={false}
					itemType="Password"
					onSubmit={values => login(values)}
					submitButtonText="Log In"
					validationSchema={validationSchema}
				/>
			</div>
		);
	}
}
export default connect(null, { login })(Login);
