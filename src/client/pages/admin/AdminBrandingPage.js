//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import NotFoundPage from "../NotFoundPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import { getSettings, setSettings } from "~/client/actions/configActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
const settingsFields = ["site_name", "site_social", "site_logo", "site_header_logo", "site_default_description"];

class AdminBrandingPage extends Component {
	constructor(props) {
		super(props);

		//Create Validation Schema
		const validationSchema = Yup.object().shape({
			site_name: Yup.string().required().label("Website Name"),
			site_social: Yup.string().required().label("Social Media Handle"),
			site_logo: Yup.string().required().label("Site Logo"),
			site_header_logo: Yup.string().required().label("Site Header Logo"),
			site_default_description: Yup.string().required().label("Default Page Description")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		return _.pick(nextProps, settingsFields);
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
					{ name: "site_name", type: fieldTypes.text },
					{ name: "site_social", type: fieldTypes.text },
					{ name: "site_default_description", type: fieldTypes.text },
					{
						name: "site_logo",
						type: fieldTypes.image,
						path: "images/layout/branding/",
						acceptSVG: true
					},
					{
						name: "site_header_logo",
						type: fieldTypes.image,
						path: "images/layout/branding/",
						acceptSVG: true
					}
				]
			}
		];
	}

	render() {
		const { validationSchema } = this.state;
		const { authUser, setSettings } = this.props;

		//404 for non-admins
		if (!authUser.isAdmin) {
			return <NotFoundPage />;
		}

		//Get Page Title
		const title = "Branding";

		return (
			<div className="admin-branding-page">
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
							itemType="Branding"
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
})(AdminBrandingPage);
