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
import { validateTwitterCredentials } from "~/client/actions/socialActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
const settingsFields = [
	"twitter_consumer_key",
	"twitter_consumer_secret",
	"twitter_access_token",
	"twitter_access_token_secret"
];

class AdminTwitterAppPage extends Component {
	constructor(props) {
		super(props);

		const { getSettings } = props;

		const settingsToLoad = settingsFields.filter(setting => !props[setting]);

		if (settingsToLoad.length) {
			getSettings(settingsToLoad);
		}

		//Create Validation Schema
		const validationSchema = Yup.object().shape({
			twitter_consumer_key: Yup.string()
				.required()
				.label("Consumer Key"),
			twitter_consumer_secret: Yup.string()
				.required()
				.label("Consumer Secret"),
			twitter_access_token: Yup.string()
				.required()
				.label("Default Access Token"),
			twitter_access_token_secret: Yup.string()
				.required()
				.label("Default Access Token Secret")
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
		const { twitterTestResults } = this.state;
		return [
			{
				fields: [
					{ name: "twitter_consumer_key", type: fieldTypes.text },
					{ name: "twitter_consumer_secret", type: fieldTypes.text },
					{ name: "twitter_access_token", type: fieldTypes.text },
					{ name: "twitter_access_token_secret", type: fieldTypes.text }
				]
			},
			{
				render: values => [
					<button
						type="button"
						key="twitter-test-btn"
						disabled={
							_.filter(values, v => v == "").length || twitterTestResults == "loading"
						}
						onClick={() => this.twitterTest(values)}
					>
						Test
					</button>,
					this.renderTwitterTestResults()
				]
			}
		];
	}

	async twitterTest(values) {
		await this.setState({ twitterTestResults: "loading" });
		const twitterTestResults = await this.props.validateTwitterCredentials(values);
		await this.setState({ twitterTestResults });
	}

	renderTwitterTestResults() {
		const { twitterTestResults } = this.state;

		if (twitterTestResults && twitterTestResults !== "loading") {
			let result;
			if (twitterTestResults.authenticated) {
				result = `\u2705 Logged in as @${twitterTestResults.user}`;
			} else {
				result = `\u274c ${twitterTestResults.error.message}`;
			}
			return <label key="result">{result}</label>;
		}
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
		const title = "Twitter App";

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
	setSettings,
	validateTwitterCredentials
})(AdminTwitterAppPage);
