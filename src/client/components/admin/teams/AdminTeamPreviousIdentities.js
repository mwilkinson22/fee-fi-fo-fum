//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Actions
import { fetchAllGrounds } from "../../../actions/groundActions";
import { updateTeam } from "../../../actions/teamsActions";

//Components
import BasicForm from "../BasicForm";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import teamIdentityFormData from "~/constants/teamIdentityFormData";
import DeleteButtons from "~/client/components/fields/DeleteButtons";

class AdminTeamPreviousIdentities extends Component {
	constructor(props) {
		super(props);

		const { fullTeams, match } = props;
		const team = fullTeams[match.params._id];

		//Create Validation Schema
		const validationSchema = Yup.object().shape({
			previousIdentities: Yup.array().of(
				Yup.object().shape({
					...teamIdentityFormData.validationSchema,
					fromYear: Yup.number().required().label("From (Year)"),
					toYear: Yup.number()
						.required()
						.label("To (Year)")
						.test("toAfterFrom", "'To Date' cannot be before 'From Date'", function (toYear) {
							const { fromYear } = this.parent;
							return toYear >= fromYear;
						})
				})
			)
		});

		this.state = { team, validationSchema };
	}

	getInitialValues() {
		const { team } = this.state;

		const previousIdentities = [];
		if (team.previousIdentities) {
			team.previousIdentities.forEach(({ toYear, fromYear, ...identityFields }) => {
				previousIdentities.push({
					...teamIdentityFormData.getInitialValues(identityFields),
					toYear,
					fromYear
				});
			});
		}

		return { previousIdentities };
	}

	getFieldGroups(values) {
		const { team } = this.state;

		// Create forms for all the current identities
		const fieldGroups = [];
		values.previousIdentities.forEach(({ toYear, fromYear, ...identityFields }, i) => {
			const fieldPrefix = `previousIdentities.${i}`;
			const fieldGroup = teamIdentityFormData.getFieldGroups(values.previousIdentities[i], fieldPrefix);

			// Put the year fields at the start of the form
			fieldGroup.unshift({
				fields: [
					{ name: `${fieldPrefix}.fromYear`, type: fieldTypes.number },
					{ name: `${fieldPrefix}.toYear`, type: fieldTypes.number }
				]
			});

			// Add a remove button
			fieldGroup.push({
				fields: [
					{
						name: "previousIdentities",
						type: fieldTypes.fieldArray,
						render: ({ remove }) => (
							<DeleteButtons key={`${fieldPrefix}.delete`} onDelete={() => remove(i)} />
						)
					}
				]
			});

			// Add a divider
			fieldGroup.push({ render: () => <hr key={`${fieldPrefix}.divider`} /> });

			// Push the array
			fieldGroups.push(...fieldGroup);
		});

		// "Add" button
		fieldGroups.push({
			fields: [
				{
					name: "previousIdentities",
					type: fieldTypes.fieldArray,
					render: ({ push }) => {
						const newItem = teamIdentityFormData.getInitialValues(team);
						newItem.toYear = "";
						newItem.fromYear = "";

						return (
							<div className="buttons" key="add-button">
								<button type="button" onClick={() => push(newItem)}>
									Add Identity
								</button>
							</div>
						);
					}
				}
			]
		});

		return fieldGroups;
	}

	alterValuesBeforeSubmit(values) {
		values.previousIdentities.forEach(teamIdentityFormData.alterValuesBeforeSubmit);
	}

	render() {
		const { updateTeam } = this.props;
		const { team, validationSchema } = this.state;

		return (
			<section className="form">
				<div className="container">
					<BasicForm
						alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
						fieldGroups={values => this.getFieldGroups(values)}
						initialValues={this.getInitialValues()}
						itemType="Team"
						validationSchema={validationSchema}
						onSubmit={values => updateTeam(team._id, values)}
					/>
				</div>
			</section>
		);
	}
}

//Add Redux Support
function mapStateToProps({ teams }) {
	const { fullTeams } = teams;
	return { fullTeams };
}
// export default form;
export default withRouter(connect(mapStateToProps, { fetchAllGrounds, updateTeam })(AdminTeamPreviousIdentities));
