//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Actions
import { updatePerson } from "~/client/actions/peopleActions";

//Components
import BasicForm from "../BasicForm";

class AdminRefereeDetails extends BasicForm {
	constructor(props) {
		super(props);

		const validationSchema = Yup.object().shape({
			from: Yup.date().label("From"),
			to: Yup.date().label("To")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullPeople, slugMap, match } = nextProps;

		const newState = {};

		const { slug } = match.params;
		const { id } = slugMap[slug];
		newState.person = fullPeople[id];

		return newState;
	}

	getDefaults() {
		const { refereeDetails } = this.state.person;

		const defaults = {
			from: "",
			to: ""
		};
		return _.mapValues(defaults, (val, key) =>
			refereeDetails[key] ? new Date(refereeDetails[key]).toString("yyyy-MM-dd") : ""
		);
	}

	async onSubmit(refereeDetails) {
		const { person } = this.state;
		const { updatePerson } = this.props;

		updatePerson(person._id, { refereeDetails });
	}

	render() {
		console.log(this.getDefaults());
		return (
			<div className="container">
				<Formik
					validationSchema={this.state.validationSchema}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					render={() => {
						const fields = [
							{ name: "from", type: "date" },
							{ name: "to", type: "date" }
						];

						return (
							<Form>
								<div className="form-card grid">
									{this.renderFieldGroup(fields)}
									<div className="buttons">
										<button type="clear">Clear</button>
										<button type="submit" className="confirm">
											Save
										</button>
									</div>
								</div>
							</Form>
						);
					}}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ people }) {
	const { fullPeople, slugMap } = people;
	return { fullPeople, slugMap };
}
// export default form;
export default connect(
	mapStateToProps,
	{ updatePerson }
)(AdminRefereeDetails);
