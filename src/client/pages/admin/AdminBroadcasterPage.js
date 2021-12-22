//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import NotFoundPage from "../NotFoundPage";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import {
	fetchBroadcasters,
	createBroadcaster,
	updateBroadcaster,
	deleteBroadcaster
} from "~/client/actions/broadcasterActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminBroadcasterPage extends Component {
	constructor(props) {
		super(props);

		const { broadcasterList, fetchBroadcasters } = props;

		if (!broadcasterList) {
			fetchBroadcasters();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { broadcasterList, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Check Everything is loaded
		if (!newState.isNew && !broadcasterList) {
			newState.isLoading = true;
			return newState;
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			name: Yup.string().required().label("Name"),
			image: Yup.string().required().label("Image")
		});

		//Get Current Broadcaster
		if (!newState.isNew) {
			newState.broadcaster = broadcasterList[match.params._id];
		}

		return newState;
	}

	getInitialValues() {
		const { broadcaster, isNew } = this.state;

		if (isNew) {
			return {
				name: "",
				image: ""
			};
		} else {
			return broadcaster;
		}
	}

	getFieldGroups() {
		return [
			{
				fields: [
					{ name: "name", type: fieldTypes.text },
					{
						name: "image",
						type: fieldTypes.image,
						path: "images/broadcasters/",
						acceptSVG: true
					}
				]
			}
		];
	}

	render() {
		const { createBroadcaster, updateBroadcaster, deleteBroadcaster } = this.props;
		const { broadcaster, isNew, isLoading, validationSchema } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}
		if (!isNew && !broadcaster) {
			return <NotFoundPage message="Broadcaster not found" />;
		}

		//Get Page Title
		const title = isNew ? "Add New Broadcaster" : broadcaster.name;

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createBroadcaster(values),
				redirectOnSubmit: id => `/admin/settings/broadcasters/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteBroadcaster(broadcaster._id),
				onSubmit: values => updateBroadcaster(broadcaster._id, values),
				redirectOnDelete: "/admin/settings/broadcasters/"
			};
		}

		return (
			<div className="admin-broadcaster-page">
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
							itemType="Broadcaster"
							validationSchema={validationSchema}
							{...formProps}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ broadcasters }) {
	const { broadcasterList } = broadcasters;
	return { broadcasterList };
}

export default withRouter(
	connect(mapStateToProps, {
		fetchBroadcasters,
		createBroadcaster,
		updateBroadcaster,
		deleteBroadcaster
	})(AdminBroadcasterPage)
);
