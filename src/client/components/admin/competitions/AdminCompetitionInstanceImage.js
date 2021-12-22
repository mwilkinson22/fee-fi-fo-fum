//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicSocialForm from "../BasicSocialForm";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Actions
import { fetchInstanceImage, postInstanceImage } from "~/client/actions/competitionActions";

class AdminCompetitionInstanceImages extends Component {
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
		newState.instance = newState.segment.instances.find(({ _id }) => _id === match.params.instanceId) || false;

		//Get Options
		newState.options = [];

		if (newState.segment.type === "League") {
			newState.options.push({ label: "League Table", value: "leagueTable" });
		}
		if (newState.instance.totalRounds && newState.instance.leagueTableColours) {
			newState.options.push({ label: "Min/Max Table", value: "minMaxTable" });
		}

		return newState;
	}

	getFieldGroups() {
		const { options } = this.state;

		return [
			{
				fields: [
					{
						name: "imageType",
						type: fieldTypes.select,
						options,
						readOnly: options.length === 1
					}
				]
			}
		];
	}

	handlePreview(values) {
		const { fetchInstanceImage } = this.props;
		const { segment, instance } = this.state;
		return fetchInstanceImage(segment._id, instance._id, values.imageType);
	}

	handleSubmit(values) {
		const { postInstanceImage } = this.props;
		const { segment, instance } = this.state;
		return postInstanceImage(segment._id, instance._id, values);
	}

	render() {
		const { segment, instance, options } = this.state;

		if (!options.length) {
			return (
				<div className="container">
					<div className="form-card">No image formats are available for this instance</div>
				</div>
			);
		}

		const validationSchema = {
			imageType: Yup.string().required().label("Image Type")
		};

		return (
			<div className="container">
				<BasicSocialForm
					additionalFieldInitialValues={{ imageType: options[0].value }}
					additionalFieldGroups={this.getFieldGroups()}
					additionalFieldValidationSchema={validationSchema}
					enforceTwitter={true}
					getPreviewImage={values => this.handlePreview(values)}
					label={`Post ${instance.year} ${segment.name} Image`}
					submitOverride={values => this.handleSubmit(values)}
				/>
			</div>
		);
	}
}

function mapStateToProps({ competitions }) {
	const { competitionSegmentList } = competitions;
	return { competitionSegmentList };
}

export default connect(mapStateToProps, { fetchInstanceImage, postInstanceImage })(AdminCompetitionInstanceImages);
