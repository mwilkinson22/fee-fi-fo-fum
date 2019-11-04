//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import NotFoundPage from "../NotFoundPage";
import DeleteButtons from "../../components/admin/fields/DeleteButtons";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import { createTeamType, updateTeamType, deleteTeamType } from "~/client/actions/teamsActions";

//Helpers
import { validateSlug } from "~/helpers/adminHelper";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminTeamTypePage extends BasicForm {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { teamTypes, match } = nextProps;
		const newState = {};

		//Create Or Edit
		newState.isNew = !match.params.slug;

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			name: Yup.string()
				.required()
				.label("Name"),
			slug: validateSlug(),
			gender: Yup.string()
				.required()
				.label("Gender"),
			sortOrder: Yup.number()
				.required()
				.label("Sort Order"),
			localTeamExternalId: Yup.number().label("Local Team External Id")
		});

		//Get Current Country
		if (!newState.isNew) {
			newState.teamType = _.find(teamTypes, ({ slug }) => slug == match.params.slug) || false;
		}

		return newState;
	}

	getDefaults() {
		const { teamType, isNew } = this.state;

		const defaults = {
			name: "",
			slug: "",
			gender: "M",
			sortOrder: "",
			localTeamExternalId: ""
		};
		if (isNew) {
			return defaults;
		} else {
			return _.mapValues(defaults, (def, key) => teamType[key] || def);
		}
	}

	async handleSubmit(values) {
		const { createTeamType, updateTeamType, history } = this.props;
		const { teamType, isNew } = this.state;
		let newSlug;

		if (isNew) {
			newSlug = await createTeamType(values);
		} else {
			newSlug = await updateTeamType(teamType._id, values);
		}
		if (newSlug) {
			history.push(`/admin/team-types/${newSlug}`);
		}
	}

	async handleDelete() {
		const { deleteTeamType, history } = this.props;
		const { teamType } = this.state;
		const success = await deleteTeamType(teamType._id);
		if (success) {
			history.replace("/admin/team-types");
		}
	}

	renderDeleteButtons() {
		if (!this.state.isNew) {
			return (
				<div className="form-card">
					<DeleteButtons onDelete={() => this.handleDelete()} />
				</div>
			);
		}
	}

	render() {
		const { teamType, isNew, validationSchema } = this.state;

		if (!isNew && teamType === false) {
			return <NotFoundPage message="Team Type not found" />;
		}

		const title = isNew ? "Add New Team Type" : teamType.name;
		return (
			<div className="admin-team-type-page">
				<HelmetBuilder title={title} />
				<section className="page-header">
					<div className="container">
						<h1>{title}</h1>
					</div>
				</section>
				<section className="form">
					<div className="container">
						<Formik
							onSubmit={values => this.handleSubmit(values)}
							initialValues={this.getDefaults()}
							validationSchema={validationSchema}
							render={() => {
								const fields = [
									{ name: "name", type: fieldTypes.text },
									{ name: "slug", type: fieldTypes.text },
									{
										name: "gender",
										type: fieldTypes.radio,
										options: [
											{ label: "Male", value: "M" },
											{ label: "Female", value: "F" }
										],
										readOnly: !isNew
									},
									{ name: "sortOrder", type: fieldTypes.number },
									{ name: "localTeamExternalId", type: fieldTypes.number }
								];

								return (
									<Form>
										<div className="card form-card grid">
											{this.renderFieldGroup(fields)}
											<div className="buttons">
												<button type="reset">Reset</button>
												<button type="submit">
													{isNew ? "Add" : "Update"} Team Type
												</button>
											</div>
										</div>
										{this.renderDeleteButtons()}
									</Form>
								);
							}}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ teams }) {
	const { teamTypes } = teams;
	return { teamTypes };
}

export default withRouter(
	connect(
		mapStateToProps,
		{ createTeamType, updateTeamType, deleteTeamType }
	)(AdminTeamTypePage)
);
