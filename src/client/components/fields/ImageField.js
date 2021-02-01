//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

//Components
import ImageSelector from "../admin/ImageSelector";
import FileUploader from "../admin/FileUploader";

class ImageField extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { readOnly, value } = nextProps;
		return { readOnly, value };
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
		const {
			path,
			onChange,
			acceptSVG,
			convertToWebP,
			resize,
			cacheMaxAge,
			defaultUploadName
		} = this.props;

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
					resize={resize}
					cacheMaxAge={cacheMaxAge}
				/>
			);
		}
	}

	renderButtons() {
		const { onChange } = this.props;
		const { readOnly, value } = this.state;
		if (!readOnly) {
			return (
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
			);
		}
	}

	render() {
		const { bucketPaths, path } = this.props;
		const { value } = this.state;

		let content;
		if (value.length) {
			content = (
				<img
					src={`${bucketPaths.root + path + value}?t=${new Date().getTime()}`}
					className="image-selector-field image"
					title={value}
					alt="Selected Image"
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
				{this.renderButtons()}
			</div>
		);
	}
}

ImageField.propTypes = {
	acceptSVG: PropTypes.bool,
	cacheMaxAge: PropTypes.number,
	convertToWebP: PropTypes.bool,
	defaultUploadName: PropTypes.string,
	value: PropTypes.string.isRequired,
	path: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	readOnly: PropTypes.bool,
	//An object, in which the key relates to the subfolder,
	//and the value is a series of options for sharp.resize()
	resize: PropTypes.object
};

ImageField.defaultProps = {
	acceptSVG: true,
	cacheMaxAge: null,
	convertToWebP: true,
	readOnly: false,
	resize: {}
};

function mapStateToProps({ config }) {
	const { bucketPaths } = config;
	return { bucketPaths };
}

export default connect(mapStateToProps)(ImageField);
