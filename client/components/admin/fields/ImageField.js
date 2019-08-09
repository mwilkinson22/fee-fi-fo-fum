//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";
import { googleBucket } from "~/client/extPaths";

//Components
import ImageSelector from "../ImageSelector";
import FileUploader from "../FileUploader";

class ImageField extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { value } = nextProps;
		return { value };
	}

	renderImageSelector() {
		const { value, showImageSelector } = this.state;
		const { path, onChange } = this.props;
		if (showImageSelector) {
			return (
				<ImageSelector
					value={value}
					path={path}
					onChange={onChange}
					onDestroy={() => this.setState({ showImageSelector: false })}
				/>
			);
		}
	}

	renderImageUploader() {
		const { value, showImageUploader } = this.state;
		const { path, onChange, acceptSVG, convertToWebP, defaultUploadName } = this.props;
		if (showImageUploader) {
			const accept = ["jpg", "jpeg", "gif", "png"];
			if (acceptSVG) {
				accept.push("svg");
			}
			return (
				<FileUploader
					accept={accept}
					value={value}
					path={path}
					isImage={true}
					onComplete={onChange}
					onDestroy={() => this.setState({ showImageUploader: false })}
					convertImageToWebP={convertToWebP}
					defaultName={defaultUploadName}
				/>
			);
		}
	}

	render() {
		const { onChange, path } = this.props;
		const { value } = this.state;

		let content;
		if (value.length) {
			content = (
				<img
					src={`${googleBucket + path + value}?t=${new Date().getTime()}`}
					className="image-selector-field image"
					title={value}
				/>
			);
		} else {
			content = <span className="image-selector-field text">No Image Selected</span>;
		}

		return (
			<div className="image-selector-field-wrapper">
				{content}
				{this.renderImageSelector()}
				{this.renderImageUploader()}
				<div className="buttons">
					<button type="button" disabled={!value} onClick={() => onChange("")}>
						Clear
					</button>
					<button
						type="button"
						onClick={() => this.setState({ showImageUploader: true })}
					>
						Upload
					</button>
					<button
						type="button"
						onClick={() => this.setState({ showImageSelector: true })}
					>
						Choose
					</button>
				</div>
			</div>
		);
	}
}

ImageField.propTypes = {
	acceptSVG: PropTypes.bool,
	convertToWebP: PropTypes.bool,
	defaultUploadName: PropTypes.string,
	value: PropTypes.string.isRequired,
	path: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired
};

ImageField.defaultProps = {
	acceptSVG: true,
	convertToWebP: true
};

export default ImageField;
