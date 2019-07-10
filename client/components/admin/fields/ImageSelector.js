//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";

//Components
import PopUpDialog from "../../PopUpDialog";

//Constants
import { googleBucket } from "~/client/extPaths";

class ImageSelector extends Component {
	constructor(props) {
		super(props);
		console.log(props);
		this.state = {
			currentImage: props.value
		};
	}

	renderField() {
		const { value: currentImage, path } = this.props;
		const onClick = () => this.setState({ showImageSelector: true, currentImage });
		if (currentImage.length) {
			return (
				<img
					src={googleBucket + path + currentImage}
					className="image-selector-field image"
					title={currentImage}
					onClick={onClick}
				/>
			);
		} else {
			return (
				<span className="image-selector-field text" onClick={onClick}>
					Add Image
				</span>
			);
		}
	}

	renderSelector() {
		const { showImageSelector, showImageUploader } = this.state;

		if (showImageSelector && !showImageUploader) {
			return (
				<PopUpDialog
					onDestroy={() => this.setState({ showImageSelector: false })}
					fullSize={true}
				>
					<div className="image-selector">
						{this.renderPreviewBox()}
						{this.renderImageList()}
						{this.renderButtons()}
					</div>
				</PopUpDialog>
			);
		}
	}

	renderPreviewBox() {
		const { path, imageList } = this.props;
		const { currentImage } = this.state;
		if (currentImage) {
			const dateFormat = "yyyy-MM-dd H:mm";
			const metadata = imageList.find(i => i.name == currentImage);
			const src = googleBucket + path + currentImage;
			return (
				<div className="preview-box with-image">
					<div className="img-wrapper">
						<img src={src} />
					</div>
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
		const { imageList, path } = this.props;
		const { currentImage } = this.state;

		const content = imageList.map(i => (
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
		const { name, form } = this.props;
		return (
			<div className="buttons">
				<button
					type="button"
					className="delete"
					onClick={async () => {
						await form.setFieldValue(name, "");
						this.setState({ image: "", showImageSelector: false });
					}}
				>
					Remove Image
				</button>
				<button
					type="button"
					onClick={async () => {
						this.setState({ showImageUploader: true });
					}}
				>
					Upload Image
				</button>
				<button
					type="button"
					className="confirm"
					onClick={async () => {
						await form.setFieldValue(name, currentImage);
						this.setState({ showImageSelector: false });
					}}
				>
					Update Image
				</button>
			</div>
		);
	}

	render() {
		return (
			<div className="image-selector-field-wrapper">
				{this.renderField()}
				{this.renderSelector()}
			</div>
		);
	}
}

ImageSelector.propTypes = {
	acceptSVG: PropTypes.bool,
	value: PropTypes.string.isRequired,
	path: PropTypes.string.isRequired,
	imageList: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			created: PropTypes.instanceOf(Date).isRequired,
			updated: PropTypes.instanceOf(Date).isRequired,
			size: PropTypes.number.isRequired
		})
	).isRequired
};

ImageSelector.defaultProps = {
	acceptSVG: false
};

export default ImageSelector;
