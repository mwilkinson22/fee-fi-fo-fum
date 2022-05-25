//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Actions
import { fetchAllGrounds } from "../../../actions/groundActions";
import { updateTeam, createTeam, deleteTeam } from "../../../actions/teamsActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import teamIdentityFormData from "~/constants/teamIdentityFormData";

class AdminTeamOverview extends Component {
	constructor(props) {
		super(props);
		const { groundList, fetchAllGrounds } = props;

		if (!groundList) {
			fetchAllGrounds();
		}

		//Create Validation Schema
		const validationSchema = Yup.object().shape({
			...teamIdentityFormData.validationSchema,
			_defaultGround: Yup.string().required().label("Default Ground")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullTeams, match, groundList } = nextProps;
		const newState = { isLoading: false };

		//Wait for everything to load
		if (!groundList) {
			return { isLoading: true };
		}

		//Create or Edit
		newState.isNew = !match.params._id;

		//Get Current Team
		if (!newState.isNew) {
			newState.team = fullTeams[match.params._id] || false;
		}

		//Create Ground Options
		newState.groundOptions = _.chain(groundList)
			.map(ground => ({
				value: ground._id,
				label: `${ground.name}, ${ground.address._city.name}`
			}))
			.sortBy("label")
			.value();

		return newState;
	}

	getInitialValues() {
		const { isNew, team } = this.state;

		const values = teamIdentityFormData.getInitialValues(isNew ? null : team);
		values._defaultGround = (team && team._defaultGround) || "";

		return values;
	}

	getFieldGroups(values) {
		const { groundOptions, team } = this.state;

		const fieldGroups = teamIdentityFormData.getFieldGroups(values, null, team ? team.slug : null);

		// Insert the default ground at the end of the first field group
		fieldGroups[0].fields.push({ name: "_defaultGround", type: fieldTypes.select, options: groundOptions });

		return fieldGroups;
	}

	render() {
		const { createTeam, updateTeam, deleteTeam } = this.props;
		const { isLoading, isNew, team, validationSchema } = this.state;

		//Wait for the ground list
		if (isLoading) {
			return <LoadingPage />;
		}

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createTeam(values),
				redirectOnSubmit: id => `/admin/teams/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteTeam(team._id),
				onSubmit: values => updateTeam(team._id, values),
				redirectOnDelete: `/admin/teams/`
			};
		}

		return (
			<section className="form">
				<div className="container">
					<BasicForm
						alterValuesBeforeSubmit={teamIdentityFormData.alterValuesBeforeSubmit}
						fieldGroups={values => this.getFieldGroups(values)}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType="Team"
						validationSchema={validationSchema}
						{...formProps}
					/>
				</div>
			</section>
		);
	}
}

//Add Redux Support
function mapStateToProps({ grounds, teams }) {
	const { groundList } = grounds;
	const { fullTeams } = teams;
	return { fullTeams, groundList };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, { fetchAllGrounds, updateTeam, createTeam, deleteTeam })(AdminTeamOverview)
);
