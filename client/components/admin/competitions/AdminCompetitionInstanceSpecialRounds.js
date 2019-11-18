//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";
import { FieldArray } from "formik";

//Components
import BasicForm from "../BasicForm";

//Actions
import { updateCompetitionInstance } from "~/client/actions/competitionActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import DeleteButtons from "../fields/DeleteButtons";

class AdminCompetitionInstanceOverview extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}
	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList, match } = nextProps;
		const newState = {};

		//Get Segment
		newState.segment = competitionSegmentList[match.params.segmentId] || false;

		//Get Instance
		if (!newState.isNew) {
			newState.instance =
				newState.segment.instances.find(({ _id }) => _id === match.params.instanceId) ||
				false;
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			specialRounds: Yup.array().of(
				Yup.object().shape({
					round: Yup.number()
						.min("1")
						.required()
						.label("Round"),
					name: Yup.string()
						.required()
						.label("Name"),
					hashtag: Yup.string().label("Hashtags"),
					overwriteBaseHashtag: Yup.string().label("Overwrite Base Hashtag")
				})
			)
		});

		return newState;
	}
	getInitialValues() {
		let { instance } = this.state;

		//Define default values
		let values = [];
		if (instance.specialRounds) {
			values = instance.specialRounds.map(({ hashtag, ...round }) => ({
				...round,
				hashtag: hashtag ? hashtag.join(" ") : ""
			}));
		}

		return { specialRounds: values };
	}

	getFieldGroups({ specialRounds }) {
		const fields = _.flatten(
			specialRounds.map((r, i) => [
				{
					fields: [
						{ name: `specialRounds.${i}.round`, type: fieldTypes.number },
						{ name: `specialRounds.${i}.name`, type: fieldTypes.text },
						{ name: `specialRounds.${i}.hashtag`, type: fieldTypes.text },
						{
							name: `specialRounds.${i}.overwriteBaseHashtag`,
							type: fieldTypes.boolean
						}
					]
				},
				{
					render: () => [
						<FieldArray
							key={`button-${i}`}
							name="specialRounds"
							render={({ remove }) => <DeleteButtons onDelete={() => remove(i)} />}
						/>,
						<hr key={`hr-${i}`} />
					]
				}
			])
		);

		fields.push({
			render: () => (
				<FieldArray
					key="add-more"
					name="specialRounds"
					render={({ push }) => (
						<div className="buttons">
							<button
								type="button"
								onClick={() =>
									push({
										name: "",
										round: "",
										hashtag: "",
										overwriteBaseHashtag: false
									})
								}
							>
								Add Special Round
							</button>
						</div>
					)}
				/>
			)
		});

		return fields;
	}

	alterValuesBeforeSubmit(values) {
		values.specialRounds.map(round => (round.hashtag = round.hashtag.split(" ")));
	}

	render() {
		const { updateCompetitionInstance } = this.props;
		const { instance, segment, validationSchema } = this.state;

		return (
			<section className="form">
				<div className="container">
					<BasicForm
						alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
						fieldGroups={values => this.getFieldGroups(values)}
						initialValues={this.getInitialValues()}
						isNew={false}
						itemType="Special Rounds"
						onSubmit={values =>
							updateCompetitionInstance(segment._id, instance._id, values)
						}
						validationSchema={validationSchema}
					/>
				</div>
			</section>
		);
	}
}

function mapStateToProps({ competitions }) {
	const { competitionSegmentList } = competitions;
	return { competitionSegmentList };
}

export default connect(mapStateToProps, {
	updateCompetitionInstance
})(AdminCompetitionInstanceOverview);
