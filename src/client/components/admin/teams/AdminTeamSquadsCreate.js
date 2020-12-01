//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import AdminTeamSquadBulkAdder from "./AdminTeamSquadBulkAdder";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminTeamSquadsCreate extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { team, teamTypes } = nextProps;
		const newState = { team };

		//Validation Schema
		newState.validationSchema = Yup.object().shape({
			year: Yup.number()
				.required()
				.min(1895)
				.max(new Date().getFullYear() + 1)
				.label("Year"),
			_teamType: Yup.mixed()
				.required()
				.test(
					"isUniqueCombo",
					"A squad already exists for this year and team type",
					function(teamType) {
						const { year } = this.parent;
						//Ensure all values are loaded
						if (year && teamType) {
							return !team.squads.find(
								s => s._teamType == teamType.value && s.year == year
							);
						}
						//Otherwise, validation will fail regardless so we return true
						return true;
					}
				)
				.label("Team Type")
		});

		//Dropdown Options
		newState.options = {};
		newState.options._teamType = _.chain(teamTypes)
			.sortBy("sortOrder")
			.map(t => ({ value: t._id, label: t.name }))
			.value();

		return newState;
	}

	getInitialValues() {
		return {
			year: "",
			_teamType: ""
		};
	}

	getFieldGroups() {
		const { options, initialData } = this.state;
		return [
			{
				fields: [
					{ name: "year", type: fieldTypes.number, disabled: initialData },
					{
						name: "_teamType",
						type: fieldTypes.select,
						options: options._teamType,
						isDisabled: initialData
					}
				]
			}
		];
	}

	render() {
		const { initialData, team, validationSchema } = this.state;

		//Variable props based on whether or not we've collected initialData
		if (!initialData) {
			return (
				<BasicForm
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isNew={true}
					itemType="Squad"
					onSubmit={initialData => this.setState({ initialData })}
					submitButtonText="Add Players"
					validationSchema={validationSchema}
				/>
			);
		} else {
			return (
				<AdminTeamSquadBulkAdder
					team={team}
					year={initialData.year}
					teamType={initialData._teamType}
					onReset={() => this.setState({ initialData: undefined })}
				/>
			);
		}
	}
}

//Add Redux Support
function mapStateToProps({ teams }) {
	const { fullTeams, teamTypes } = teams;
	return { fullTeams, teamTypes };
}

// export default form;
export default connect(mapStateToProps)(AdminTeamSquadsCreate);
