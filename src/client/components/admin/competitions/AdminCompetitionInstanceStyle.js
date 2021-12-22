//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import NotFoundPage from "~/client/pages/NotFoundPage";

//Actions
import { updateCompetitionInstance } from "~/client/actions/competitionActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import LeagueTable from "../../seasons/LeagueTable";

class AdminCompetitionInstanceStyle extends Component {
	constructor(props) {
		super(props);

		this.state = {
			tableClasses: ["None", "Champions", "Top", "Bottom"]
		};
	}
	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList, match } = nextProps;
		const newState = {};

		//Get Segment
		newState.segment = competitionSegmentList[match.params.segmentId] || false;

		//Get Instance
		newState.instance = newState.segment.instances.find(({ _id }) => _id === match.params.instanceId) || false;

		//If the instance has no teams assigned, throw an error
		if (!newState.instance.teams || !newState.instance.teams.length) {
			newState.noTeams = true;
			return newState;
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			customStyling: Yup.object().shape({
				backgroundColor: Yup.string().required().label("Background Colour"),
				color: Yup.string().required().label("Text Colour")
			}),
			leagueTableColours: Yup.array().of(Yup.string())
		});

		return newState;
	}

	getInitialValues() {
		const { instance } = this.state;

		return {
			customStyling: {
				backgroundColor: instance.customStyling.backgroundColor || "#111111",
				color: instance.customStyling.color || "#FFFFFF"
			},
			leagueTableColours: instance.teams.map((id, i) => {
				const currentValue = instance.leagueTableColours.find(({ position }) => position.indexOf(i + 1) > -1);
				return currentValue ? currentValue.className : "";
			})
		};
	}

	getFieldGroups() {
		const { instance, segment, tableClasses } = this.state;
		return [
			{
				label: "Table Header",
				fields: [
					{ name: "customStyling.backgroundColor", type: fieldTypes.colour },
					{ name: "customStyling.color", type: fieldTypes.colour }
				]
			},
			{
				label: "Table Rows",
				fields: instance.teams.map((id, i) => ({
					name: `leagueTableColours.${i}`,
					type: fieldTypes.radio,
					options: tableClasses.map(label => ({
						label,
						value: label === "None" ? "" : label.toLowerCase()
					})),
					label: `Team ${i + 1}`
				}))
			},
			{
				label: "Preview",
				render: values => {
					const styleOverride = _.cloneDeep(values);
					this.alterValuesBeforeSubmit(styleOverride);

					return (
						<LeagueTable
							key="preview-table"
							className="full-span"
							competition={segment._id}
							loadGames={false}
							styleOverride={styleOverride}
							year={instance.year || new Date().getFullYear()}
						/>
					);
				}
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		values.leagueTableColours = _.chain(values.leagueTableColours)
			.map((className, i) => ({ className, position: i + 1 }))
			.filter("className")
			.groupBy("className")
			.map((rows, className) => ({
				className,
				position: rows.map(({ position }) => position)
			}))
			.value();
	}

	render() {
		const { updateCompetitionInstance } = this.props;
		const { instance, segment, noTeams, validationSchema } = this.state;

		if (noTeams) {
			return <NotFoundPage />;
		}

		return (
			<section className="form">
				<div className="container">
					<BasicForm
						alterValuesBeforeSubmit={values => this.alterValuesBeforeSubmit(values)}
						fieldGroups={this.getFieldGroups()}
						initialValues={this.getInitialValues()}
						isNew={false}
						itemType="Instance"
						onSubmit={values => updateCompetitionInstance(segment._id, instance._id, values)}
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
})(AdminCompetitionInstanceStyle);
