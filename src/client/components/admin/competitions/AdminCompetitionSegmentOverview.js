//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";

//Actions
import {
	createCompetitionSegment,
	updateCompetitionSegment,
	deleteCompetitionSegment
} from "~/client/actions/competitionActions";

//Constants
const competitionTypes = require("~/constants/competitionTypes");
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminCompetitionSegmentOverview extends Component {
	constructor(props) {
		super(props);

		const { teamTypes } = props;
		const options = {
			type: competitionTypes.sort().map(a => ({ value: a, label: a })),
			_teamType: _.chain(teamTypes)
				.sortBy("sortOrder")
				.map(t => ({ value: t._id, label: t.name }))
				.value()
		};

		this.state = { options };
	}
	static getDerivedStateFromProps(nextProps, prevState) {
		const { competitionSegmentList, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			name: Yup.string().required().label("Name"),
			type: Yup.mixed().required().label("Type"),
			_teamType: Yup.mixed().required().label("Team Type"),
			hashtagPrefix: Yup.string().required().label("Hashtag Prefix"),
			appendCompetitionName: Yup.boolean().label("Append Competition Name?"),
			externalCompId: Yup.number().label("External Competition Id"),
			externalDivId: Yup.number().label("External Division Id"),
			_pointsCarriedFrom: Yup.mixed().label("Points Carried From")
		});

		//Add in additional fields for edit mode
		if (!newState.isNew) {
			newState.segment = competitionSegmentList[match.params._id] || false;

			//Render pointsCarriedFrom options
			if (!prevState.options._pointsCarriedFrom) {
				newState.options = prevState.options;
				newState.options._pointsCarriedFrom = _.chain(competitionSegmentList)
					//Remove active segment
					.reject(c => c._id == match.params._id)
					//Same parent competition
					.filter(c => c._parentCompetition._id == newState.segment._parentCompetition._id)
					//Same team type
					.filter(c => c._teamType == newState.segment._teamType)
					//Leagues
					.filter(c => c.type == "League")
					//Sort
					.sortBy("name")
					//Convert to options
					.map(c => ({ value: c._id, label: c.name }))
					.value();
			}
		}

		return newState;
	}
	getInitialValues() {
		const { segment, isNew } = this.state;

		const defaultValues = {
			name: "",
			type: "",
			_teamType: "",
			hashtagPrefix: "",
			appendCompetitionName: false,
			externalCompId: "",
			externalDivId: "",
			_pointsCarriedFrom: ""
		};
		if (isNew) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, key) =>
				segment[key] != null ? segment[key] : defaultValue
			);
		}
	}

	getFieldGroups() {
		const { isNew, options } = this.state;

		const fields = [
			{ name: "name", type: fieldTypes.text },
			{
				name: "_teamType",
				type: fieldTypes.select,
				options: options._teamType,
				isDisabled: !isNew
			},
			{
				name: "type",
				type: fieldTypes.select,
				options: options.type,
				isDisabled: !isNew
			},
			{ name: "hashtagPrefix", type: fieldTypes.text },
			{ name: "appendCompetitionName", type: fieldTypes.boolean },
			{ name: "externalCompId", type: fieldTypes.number },
			{ name: "externalDivId", type: fieldTypes.number }
		];

		if (!isNew && options._pointsCarriedFrom && options._pointsCarriedFrom.length) {
			fields.push({
				name: "_pointsCarriedFrom",
				type: fieldTypes.select,
				options: options._pointsCarriedFrom
			});
		}

		return [{ fields }];
	}

	render() {
		const { createCompetitionSegment, updateCompetitionSegment, deleteCompetitionSegment, match } = this.props;
		const { segment, isNew, validationSchema } = this.state;

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values =>
					createCompetitionSegment({
						...values,
						_parentCompetition: match.params.parent
					}),
				redirectOnSubmit: id => `/admin/competitions/segments/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteCompetitionSegment(segment._id),
				onSubmit: values => updateCompetitionSegment(segment._id, values),
				redirectOnDelete: `/admin/competitions/${segment._parentCompetition._id}`
			};
		}
		return (
			<section className="form">
				<div className="container">
					<BasicForm
						fieldGroups={this.getFieldGroups()}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType="Competition"
						validationSchema={validationSchema}
						{...formProps}
					/>
				</div>
			</section>
		);
	}
}

function mapStateToProps({ competitions, teams }) {
	const { competitionList, competitionSegmentList } = competitions;
	const { teamTypes } = teams;
	return { competitionList, competitionSegmentList, teamTypes };
}

export default connect(mapStateToProps, {
	createCompetitionSegment,
	updateCompetitionSegment,
	deleteCompetitionSegment
})(AdminCompetitionSegmentOverview);
