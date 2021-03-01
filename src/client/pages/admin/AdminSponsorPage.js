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
import { fetchSponsors, createSponsor, updateSponsor, deleteSponsor } from "~/client/actions/sponsorActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminCountryPage extends Component {
	constructor(props) {
		super(props);

		const { sponsorList, fetchSponsors } = props;

		if (!sponsorList) {
			fetchSponsors();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { sponsorList, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Check Everything is loaded
		if (!newState.isNew && !sponsorList) {
			newState.isLoading = true;
			return newState;
		}

		//Get Current Sponsor
		if (!newState.isNew) {
			newState.sponsor = sponsorList[match.params._id] || false;
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			name: Yup.string()
				.required()
				.label("Name"),
			url: Yup.string().label("URL"),
			twitter: Yup.string().label("Twitter Handle"),
			image: Yup.string().label("Logo")
		});

		return newState;
	}

	getInitialValues() {
		const { sponsor, isNew } = this.state;

		const defaultValues = {
			name: "",
			url: "",
			twitter: "",
			image: ""
		};

		if (isNew) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (def, key) => sponsor[key] || def);
		}
	}

	getFieldGroups() {
		const { sponsor } = this.state;
		return [
			{
				fields: [
					{ name: "name", type: fieldTypes.text },
					{ name: "url", type: fieldTypes.text },
					{ name: "twitter", type: fieldTypes.text },
					{
						name: "image",
						type: fieldTypes.image,
						path: "images/sponsors/",
						acceptSVG: true,
						defaultUploadName: sponsor ? sponsor._id : null
					}
				]
			}
		];
	}

	render() {
		const { createSponsor, updateSponsor, deleteSponsor } = this.props;
		const { sponsor, isNew, isLoading, validationSchema } = this.state;

		//Await Sponsors
		if (isLoading) {
			return <LoadingPage />;
		}

		//404
		if (!isNew && sponsor === false) {
			return <NotFoundPage message="Sponsor not found" />;
		}

		//Page title
		const title = isNew ? "Add New Sponsor" : sponsor.name;

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createSponsor(values),
				redirectOnSubmit: id => `/admin/sponsors/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteSponsor(sponsor._id),
				onSubmit: values => updateSponsor(sponsor._id, values),
				redirectOnDelete: "/admin/sponsors/"
			};
		}

		return (
			<div className="admin-sponsor-page">
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
							isNew={isNew}
							itemType="Sponsor"
							validationSchema={validationSchema}
							{...formProps}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ sponsors }) {
	const { sponsorList } = sponsors;
	return { sponsorList };
}

export default connect(mapStateToProps, {
	fetchSponsors,
	createSponsor,
	updateSponsor,
	deleteSponsor
})(AdminCountryPage);
