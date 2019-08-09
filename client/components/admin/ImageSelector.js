//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

//Components
import LoadingPage from "../LoadingPage";
import PopUpDialog from "../PopUpDialog";

//Actions
import { getFiles } from "~/client/actions/fileActions";

//Constants
import { googleBucket } from "~/client/extPaths";

class ImageSelector extends Component {
	constructor(props) {
		super(props);

		this.state = {
			currentImage: props.value
		};
	}

	componentDidMount() {
		const { path, getFiles } = this.props;
		getFiles(path).then(files => {
			this.setState({
				images: files
					.map(file => {
						if (file) {
							file.created = new Date(file.created);
							file.updated = new Date(file.updated);
							file.size = Number(file.size);
						}
						return file;
					})
					.sort((a, b) => (a.updated < b.updated ? 1 : -1))
			});
		});
	}

	renderPreviewBox() {
		const { path } = this.props;
		const { currentImage, images } = this.state;
		if (currentImage) {
			const dateFormat = "yyyy-MM-dd H:mm";
			const metadata = images.find(i => i.name == currentImage);
			const src = googleBucket + path + currentImage;
			let textContent;
			if (metadata) {
				textContent = (
					<ul className="attributes">
						<li className="attribute">
							<strong>Name</strong>
							{metadata.name}
						</li>
						<li className="attribute">
							<strong>Created</strong>
							{metadata.created.toString(dateFormat)}
						</li>
						<li className="attribute">
							<strong>Updated</strong>
							{metadata.updated.toString(dateFormat)}
						</li>
						<li className="attribute">
							<strong>Size</strong>
							{(metadata.size / 1024).toFixed(2)}kb
						</li>
					</ul>
				);
			} else {
				textContent = <p>Image metadata not found</p>;
			}
			return (
				<div className="preview-box with-image">
					<div className="img-wrapper">
						<img src={`${src}?t=${new Date().getTime()}`} />
					</div>
					{textContent}
				</div>
			);
		}
		return (
			<div className="preview-box no-image">
				<span>No Image Selected</span>
			</div>
		);
	}

	renderImageList() {
		const { path } = this.props;
		const { currentImage, images } = this.state;

		const content = images.map(i => (
			<img
				className={`thumbnail ${i.name == currentImage ? " selected" : ""}`}
				src={googleBucket + path + i.name}
				title={i.name}
				onClick={() => this.setState({ currentImage: i.name })}
				key={i.name}
			/>
		));

		return <div className="image-list">{content}</div>;
	}

	renderButtons() {
		const { currentImage } = this.state;
		const { onChange, onDestroy } = this.props;
		return (
			<div className="buttons">
				<button type="button" onClick={onDestroy}>
					Cancel
				</button>
				<button
					type="button"
					className="confirm"
					onClick={async () => {
						await onChange(currentImage);
						onDestroy();
					}}
				>
					Update Image
				</button>
			</div>
		);
	}

	render() {
		const { onDestroy } = this.props;
		const { images } = this.state;
		let content;

		if (!images) {
			content = <LoadingPage />;
		} else {
			content = (
				<div className="image-selector">
					{this.renderPreviewBox()}
					{this.renderImageList()}
					{this.renderButtons()}
				</div>
			);
		}
		return (
			<PopUpDialog onDestroy={onDestroy} fullSize={true}>
				{content}
			</PopUpDialog>
		);
	}
}

ImageSelector.propTypes = {
	value: PropTypes.string.isRequired,
	path: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	onDestroy: PropTypes.func.isRequired
};

export default connect(
	null,
	{ getFiles }
)(ImageSelector);
