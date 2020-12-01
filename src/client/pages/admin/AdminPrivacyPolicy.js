//Modules
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

class AdminPrivacyPolicy extends Component {
	constructor(props) {
		super(props);

		const { getSettings, privacyPolicy } = props;

		if (!privacyPolicy) {
			getSettings(["privacyPolicy"]);
		}

		//Create Validation Schema
		const validationSchema = Yup.object().shape({
			privacyPolicy: Yup.string()
				.required()
				.label("Privacy Policy")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { privacyPolicy } = nextProps;
		return { privacyPolicy };
	}

	getInitialValues() {
		const { privacyPolicy } = this.props;
		return { privacyPolicy };
	}

	getFieldGroups() {
		return [
			{
				fields: [{ name: "privacyPolicy", type: fieldTypes.textarea }]
			}
		];
	}

	render() {
		const { privacyPolicy, validationSchema } = this.state;
		const { authUser, setSettings } = this.props;

		//404 for non-admins
		if (!authUser.isAdmin) {
			return <NotFoundPage />;
		}

		//Await policy
		if (privacyPolicy == null) {
			return <LoadingPage />;
		}

		//Get Page Title
		const title = "Privacy Policy";

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
							itemType="Privacy Policy"
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
	const { authUser, privacyPolicy } = config;
	return { authUser, privacyPolicy };
}

export default connect(mapStateToProps, {
	getSettings,
	setSettings
})(AdminPrivacyPolicy);
