//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import NotFoundPage from "../NotFoundPage";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import { getSettings, setSettings } from "~/client/actions/configActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
const settingsFields = ["facebook_app_id", "facebook_app_secret"];

class AdminFacebookAppPage extends Component {
	constructor(props) {
		super(props);

		const { getSettings } = props;

		const settingsToLoad = settingsFields.filter(setting => !props[setting]);

		if (settingsToLoad.length) {
			getSettings(settingsToLoad);
		}

		//Create Validation Schema
		const validationSchema = Yup.object().shape({
			facebook_app_id: Yup.string().required().label("App ID"),
			facebook_app_secret: Yup.string().required().label("App Secret")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = { isLoading: false };

		//Check Everything is loaded
		settingsFields.forEach(setting => {
			if (nextProps[setting] == null) {
				newState.isLoading = true;
			}
		});
		if (newState.isLoading) {
			return newState;
		}

		return newState;
	}

	getInitialValues() {
		return _.chain(settingsFields)
			.map(setting => [setting, this.props[setting] || ""])
			.fromPairs()
			.value();
	}

	getFieldGroups() {
		return [
			{
				fields: [
					{ name: "facebook_app_id", type: fieldTypes.text },
					{ name: "facebook_app_secret", type: fieldTypes.text }
				]
			}
		];
	}

	render() {
		const { isLoading, validationSchema } = this.state;
		const { authUser, setSettings } = this.props;

		//404 for non-admins
		if (!authUser.isAdmin) {
			return <NotFoundPage />;
		}

		//Await social list
		if (isLoading) {
			return <LoadingPage />;
		}

		//Get Page Title
		const title = "Facebook App";

		return (
			<div className="admin-profile-page">
				<HelmetBuilder title={title} />
				<section className="page-header">
					<div className="container">
						<h1>{title}</h1>
					</div>
				</section>
				<section className="form">
					<div className="container">
						<BasicForm
							fieldGroups={this.getFieldGroups()}
							initialValues={this.getInitialValues()}
							isNew={false}
							itemType="App Details"
							onSubmit={setSettings}
							validationSchema={validationSchema}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ config }) {
	return _.pick(config, ["authUser", ...settingsFields]);
}

export default connect(mapStateToProps, {
	getSettings,
	setSettings
})(AdminFacebookAppPage);
