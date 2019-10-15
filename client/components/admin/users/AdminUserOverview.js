//Modules
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import DeleteButtons from "../fields/DeleteButtons";

//Actions
import { createUser, updateUser, deleteUser } from "~/client/actions/userActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import { validatePasswordFields } from "~/helpers/adminHelper";

class AdminUserOverview extends BasicForm {
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
				.matches(
					/^[a-zA-Z0-9_-]+$/,
					"Login ID can only consist of letters, numbers, hyphens and underscores"
				)
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

	getDefaults() {
		const { user, isNew } = this.state;

		const defaults = {
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
			return { ...defaults, password: "", password2: "" };
		} else {
			return _.mapValues(defaults, (def, key) => user[key] || def);
		}
	}

	async handleSubmit(fValues) {
		const { createUser, updateUser } = this.props;
		const { user, isNew } = this.state;
		const values = _.cloneDeep(fValues);
		delete values.password2;

		if (isNew) {
			const newId = await createUser(values);
			await this.setState({ redirect: `/admin/users/${newId}` });
		} else {
			if (!values.password) {
				delete values.password;
			}
			await updateUser(user._id, values);
		}
	}

	async handleDelete() {
		const { deleteUser } = this.props;
		const { user } = this.state;
		const success = await deleteUser(user._id);
		if (success) {
			this.setState({ isDeleted: true, redirect: "/admin/users" });
		}
	}

	renderDeleteButtons() {
		const { isNew, user } = this.state;
		const { authUser } = this.props;
		if (!isNew && authUser.isAdmin && user._id !== authUser._id) {
			return (
				<div className="form-card">
					<DeleteButtons onDelete={() => this.handleDelete()} />
				</div>
			);
		}
	}

	render() {
		const { authUser } = this.props;
		const { redirect, user, isNew, validationSchema } = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

		return (
			<Formik
				onSubmit={values => this.handleSubmit(values)}
				initialValues={this.getDefaults()}
				validationSchema={validationSchema}
				render={() => {
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

					const personalFields = [
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
							path: "images/users/"
						}
					];

					const contactFields = [
						{ name: "email", type: fieldTypes.text },
						{ name: "twitter", type: fieldTypes.text }
					];

					return (
						<Form>
							<div className="card form-card grid">
								{this.renderFieldGroup(loginFields)}
								<h6>Personal</h6>
								{this.renderFieldGroup(personalFields)}
								<h6>Contact Info</h6>
								{this.renderFieldGroup(contactFields)}
								<div className="buttons">
									<button type="reset">Reset</button>
									<button type="submit">{isNew ? "Add" : "Update"} User</button>
								</div>
							</div>
							{this.renderDeleteButtons()}
						</Form>
					);
				}}
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

export default connect(
	mapStateToProps,
	{ createUser, updateUser, deleteUser }
)(AdminUserOverview);
