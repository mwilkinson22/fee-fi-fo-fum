//Modules
import _ from "lodash";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";

//Actions
import { createUser, updateUser, deleteUser } from "~/client/actions/userActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import { validatePasswordFields } from "~/helpers/adminHelper";

class AdminUserOverview extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { user } = nextProps;
		const newState = {
			user,
			isNew: !user
		};

		//Create Validation Schema
		let rawValidationSchema = {
			username: Yup.string()
				.required()
				.matches(/^[a-zA-Z0-9_-]+$/, "Login ID can only consist of letters, numbers, hyphens and underscores")
				.label("Login ID"),
			name: Yup.object().shape({
				first: Yup.string()
					.required()
					.label("First Name"),
				last: Yup.string()
					.required()
					.label("Last Name")
			}),
			frontendName: Yup.string().label("Frontend Name"),
			twitter: Yup.string().label("Twitter Handle"),
			image: Yup.string().label("Image"),
			email: Yup.string()
				.email()
				.required()
				.label("Email Address"),
			isAdmin: Yup.boolean().label("Admin Rights?")
		};

		if (newState.isNew) {
			rawValidationSchema = {
				...rawValidationSchema,
				...validatePasswordFields()
			};
		}

		newState.validationSchema = Yup.object().shape(rawValidationSchema);

		return newState;
	}

	getInitialValues() {
		const { user, isNew } = this.state;

		const defaultValues = {
			username: "",
			name: {
				first: "",
				last: ""
			},
			frontendName: "",
			twitter: "",
			image: "",
			email: "",
			isAdmin: false
		};

		if (isNew) {
			return { ...defaultValues, password: "", password2: "" };
		} else {
			return _.mapValues(defaultValues, (def, key) => user[key] || def);
		}
	}

	getFieldGroups() {
		const { authUser } = this.props;
		const { isNew, user } = this.state;

		//Core Login Fields
		const loginFields = [
			{
				name: "username",
				type: fieldTypes.text,
				readOnly: !authUser.isAdmin
			}
		];
		if (isNew) {
			loginFields.push(
				{ name: "password", type: fieldTypes.password },
				{ name: "password2", type: fieldTypes.password }
			);
		}
		if (authUser.isAdmin) {
			loginFields.push({
				name: "isAdmin",
				type: fieldTypes.boolean,
				readOnly: user && user._id == authUser._id
			});
		}

		return [
			{
				fields: loginFields
			},
			{
				label: "Personal",
				fields: [
					{ name: "name.first", type: fieldTypes.text },
					{ name: "name.last", type: fieldTypes.text },
					{
						name: "frontendName",
						type: fieldTypes.text,
						placeholder: "Defaults to First + Last Name"
					},
					{
						name: "image",
						type: fieldTypes.image,
						acceptSVG: false,
						path: "images/users/",
						resize: { small: { width: 50, height: 50, fit: "outside" } }
					}
				]
			},
			{
				label: "Contact Info",
				fields: [
					{ name: "email", type: fieldTypes.text },
					{ name: "twitter", type: fieldTypes.text }
				]
			}
		];
	}

	async handleSubmit(fValues) {
		const { createUser, updateUser, history } = this.props;
		const { user, isNew } = this.state;
		const values = _.cloneDeep(fValues);
		delete values.password2;

		if (isNew) {
			const newId = await createUser(values);
			history.push(`/admin/users/${newId}`);
		} else {
			if (!values.password) {
				delete values.password;
			}
			await updateUser(user._id, values);
		}
	}

	render() {
		const { createUser, updateUser, deleteUser } = this.props;
		const { user, isNew, validationSchema } = this.state;

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createUser(values),
				redirectOnSubmit: id => `/admin/users/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteUser(user._id),
				onSubmit: values => updateUser(user._id, values),
				redirectOnDelete: "/admin/users/"
			};
		}

		return (
			<BasicForm
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={isNew}
				itemType="User"
				validationSchema={validationSchema}
				{...formProps}
			/>
		);
	}
}

AdminUserOverview.propTypes = {
	user: PropTypes.object
};

function mapStateToProps({ config, users }) {
	const { authUser } = config;
	const { userList } = users;
	return { authUser, userList };
}

export default connect(mapStateToProps, { createUser, updateUser, deleteUser })(AdminUserOverview);
