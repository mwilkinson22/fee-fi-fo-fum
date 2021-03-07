//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Actions
import { updatePerson } from "~/client/actions/peopleActions";

//Components
import BasicForm from "../BasicForm";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminRefereeDetails extends Component {
	constructor(props) {
		super(props);

		const validationSchema = Yup.object().shape({
			from: Yup.date().label("From"),
			to: Yup.date().label("To")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullPeople, match } = nextProps;

		const newState = {};

		const { _id } = match.params;
		newState.person = fullPeople[_id];

		return newState;
	}

	getInitialValues() {
		const { refereeDetails } = this.state.person;

		const defaultValues = {
			from: "",
			to: ""
		};
		return _.mapValues(defaultValues, (defaultValue, key) =>
			refereeDetails && refereeDetails[key] ? new Date(refereeDetails[key]).toString("yyyy-MM-dd") : defaultValue
		);
	}

	getFieldGroups() {
		return [
			{
				fields: [
					{ name: "from", type: fieldTypes.date },
					{ name: "to", type: fieldTypes.date }
				]
			}
		];
	}

	render() {
		const { updatePerson } = this.props;
		const { person, validationSchema } = this.state;
		return (
			<BasicForm
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={false}
				itemType="Referee Details"
				onSubmit={refereeDetails => updatePerson(person._id, { refereeDetails })}
				validationSchema={validationSchema}
			/>
		);
	}
}

//Add Redux Support
function mapStateToProps({ people }) {
	const { fullPeople } = people;
	return { fullPeople };
}
// export default form;
export default connect(mapStateToProps, { updatePerson })(AdminRefereeDetails);
