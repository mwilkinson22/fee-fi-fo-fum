//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import AdminPersonImageCardEditor from "~/client/components/admin/people/AdminPersonImageCardEditor";
import BasicSocialForm from "~/client/components/admin/BasicSocialForm";

//Actions
import { fetchPersonImageCard, postPersonImageCard } from "~/client/actions/peopleActions";
import { hasConnectionToTeam } from "~/helpers/peopleHelper";

class AdminPersonImageCardPage extends Component {
	constructor(props) {
		super(props);

		const { fullPeople, match } = props;

		const person = fullPeople[match.params._id];

		this.state = { person, imageValues: {}, editMode: true };
	}

	handlePreview(values) {
		const { fetchPersonImageCard } = this.props;
		const { person } = this.state;
		return fetchPersonImageCard(person._id, values);
	}

	handleSubmit(values) {
		const { postPersonImageCard } = this.props;
		const { person } = this.state;
		return postPersonImageCard(person._id, values);
	}

	getSocialVariables() {
		const { localTeam, baseUrl } = this.props;
		const { person } = this.state;

		const variables = [];

		//Add twitter account
		if (person.twitter) {
			variables.push({ label: `@${person.twitter}`, value: `@${person.twitter}` });
		}

		//Check if they have a valid person page
		const connections = hasConnectionToTeam(person, localTeam, true);
		if (connections.hasPlayedForTeam || connections.isInSquad) {
			variables.push({ label: "Player Page", value: `${baseUrl}/players/${person.slug}` });
		}
		if (connections.hasCoachedTeam) {
			variables.push({ label: "Coach Page", value: `${baseUrl}/coaches/${person.slug}` });
		}

		return variables;
	}

	render() {
		const { editMode, imageValues, person } = this.state;

		let content;

		//Check that person has images
		if (!_.filter(person.images, _.identity).length) {
			content = <div className="form-card">No images are available for this person</div>;
		} else if (editMode) {
			content = (
				<AdminPersonImageCardEditor
					getPreview={values => this.handlePreview(values)}
					initialValues={imageValues}
					person={person}
					onComplete={imageValues => this.setState({ imageValues, editMode: false })}
				/>
			);
		} else {
			content = (
				<BasicSocialForm
					additionalFieldInitialValues={imageValues}
					enforceTwitter={true}
					getPreviewImage={values => this.handlePreview(values)}
					label={`Post To Social`}
					replaceResetButton={
						<button type="button" onClick={() => this.setState({ editMode: true })}>
							Edit Image
						</button>
					}
					submitOverride={values => this.handleSubmit(values)}
					variables={this.getSocialVariables()}
				/>
			);
		}

		return <div className="container admin-person-image-card-page">{content}</div>;
	}
}

function mapStateToProps({ config, people }) {
	const { baseUrl, localTeam } = config;
	const { fullPeople } = people;
	return { baseUrl, localTeam, fullPeople };
}

export default connect(mapStateToProps, { fetchPersonImageCard, postPersonImageCard })(
	AdminPersonImageCardPage
);
