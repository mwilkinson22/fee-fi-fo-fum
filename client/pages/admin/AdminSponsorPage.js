//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import NotFoundPage from "../NotFoundPage";
import LoadingPage from "../../components/LoadingPage";
import DeleteButtons from "../../components/admin/fields/DeleteButtons";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import {
	fetchSponsors,
	createSponsor,
	updateSponsor,
	deleteSponsor
} from "~/client/actions/sponsorActions";

class AdminCountryPage extends BasicForm {
	constructor(props) {
		super(props);

		const { sponsorList, fetchSponsors } = props;

		if (!sponsorList) {
			fetchSponsors();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { sponsorList, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params.id;

		//Remove redirect after creation/deletion
		if (prevState.redirect == match.url) {
			newState.redirect = false;
		}

		//Check Everything is loaded
		if (!newState.isNew && !sponsorList) {
			newState.isLoading = true;
			return newState;
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

		//Get Current Sponsor
		if (!newState.isNew) {
			newState.sponsor = sponsorList[match.params.id] || false;
		}

		return newState;
	}

	getDefaults() {
		const { sponsor, isNew } = this.state;

		if (isNew) {
			return {
				name: "",
				url: "",
				twitter: "",
				image: ""
			};
		} else {
			return _.mapValues(sponsor, v => v || "");
		}
	}

	async handleSubmit(values) {
		const { createSponsor, updateSponsor } = this.props;
		const { sponsor, isNew } = this.state;

		if (isNew) {
			const newId = await createSponsor(values);
			await this.setState({ redirect: `/admin/sponsors/${newId}` });
		} else {
			await updateSponsor(sponsor._id, values);
		}
	}

	async handleDelete() {
		const { deleteSponsor } = this.props;
		const { sponsor } = this.state;
		const success = await deleteSponsor(sponsor._id);
		if (success) {
			this.setState({ isDeleted: true, redirect: "/admin/sponsors" });
		}
	}

	renderDeleteButtons() {
		if (!this.state.isNew) {
			return (
				<div className="form-card">
					<DeleteButtons onDelete={() => this.handleDelete()} />
				</div>
			);
		}
	}

	render() {
		const { redirect, sponsor, isNew, isLoading, validationSchema } = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

		if (isLoading) {
			return <LoadingPage />;
		}
		if (!isNew && sponsor === false) {
			return <NotFoundPage message="Sponsor not found" />;
		}

		const title = isNew ? "Add New Sponsor" : sponsor.name;
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
						<Formik
							onSubmit={values => this.handleSubmit(values)}
							initialValues={this.getDefaults()}
							validationSchema={validationSchema}
							render={({ values }) => {
								const fields = [
									{ name: "name", type: "text" },
									{ name: "url", type: "text" },
									{ name: "twitter", type: "text" },
									{
										name: "image",
										type: "Image",
										path: "images/sponsors/",
										acceptSVG: true,
										defaultUploadName: sponsor ? sponsor._id : values.name
									}
								];

								return (
									<Form>
										<div className="card form-card grid">
											{this.renderFieldGroup(fields)}
											<div className="buttons">
												<button type="reset">Reset</button>
												<button type="submit">
													{isNew ? "Add" : "Update"} Sponsor
												</button>
											</div>
										</div>
										{this.renderDeleteButtons()}
									</Form>
								);
							}}
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

export default connect(
	mapStateToProps,
	{
		fetchSponsors,
		createSponsor,
		updateSponsor,
		deleteSponsor
	}
)(AdminCountryPage);
