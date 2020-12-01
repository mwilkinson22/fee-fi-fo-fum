//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import NotFoundPage from "../NotFoundPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import { createTeamType, updateTeamType, deleteTeamType } from "~/client/actions/teamsActions";

//Helpers
import { validateSlug } from "~/helpers/adminHelper";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminTeamTypePage extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { teamTypes, match } = nextProps;
		const newState = {};

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Get Current Country
		if (!newState.isNew) {
			newState.teamType = teamTypes[match.params._id] || false;
		}

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

		return newState;
	}

	getInitialValues() {
		const { teamType, isNew } = this.state;

		const defaults = {
			name: "",
			slug: "",
			gender: "",
			sortOrder: "",
			localTeamExternalId: ""
		};

		if (isNew) {
			return defaults;
		} else {
			return _.mapValues(defaults, (def, key) => teamType[key] || def);
		}
	}

	getFieldGroups() {
		const { isNew } = this.state;

		return [
			{
				fields: [
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
				]
			}
		];
	}

	render() {
		const { createTeamType, updateTeamType, deleteTeamType } = this.props;
		const { teamType, isNew, validationSchema } = this.state;

		//404
		if (!isNew && teamType === false) {
			return <NotFoundPage message="Team Type not found" />;
		}

		//Get Page Title
		const title = isNew ? "Add New Team Type" : teamType.name;

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createTeamType(values),
				redirectOnSubmit: id => `/admin/team-types/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteTeamType(teamType._id),
				onSubmit: values => updateTeamType(teamType._id, values),
				redirectOnDelete: "/admin/team-types/"
			};
		}

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
						<BasicForm
							fieldGroups={this.getFieldGroups()}
							initialValues={this.getInitialValues()}
							isNew={isNew}
							itemType="Team Type"
							validationSchema={validationSchema}
							{...formProps}
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

export default connect(mapStateToProps, { createTeamType, updateTeamType, deleteTeamType })(
	AdminTeamTypePage
);
