//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { GoogleApiWrapper, Map, Marker } from "google-maps-react";

//Components
import LoadingPage from "./LoadingPage";

class EmbeddedMap extends Component {
	constructor(props) {
		super(props);
		// console.log(props);
		this.state = {
			location: {
				lat: 0,
				lng: 0
			}
		};
	}

	loadLocation(google, map) {
		const { placeId } = this.props;
		const service = new google.maps.places.PlacesService(map);

		const request = {
			placeId: placeId,
			fields: ["geometry"]
		};

		service.getDetails(request, place => {
			const { location } = place.geometry;
			this.setState({
				location: {
					lat: location.lat(),
					lng: location.lng()
				}
			});
		});
	}

	render() {
		const { location } = this.state;
		const { google, name } = this.props;
		return (
			<div className="map-wrapper">
				<Map
					google={google}
					center={location}
					onReady={({ google }, map) => this.loadLocation(google, map)}
					zoom={15}
				>
					<Marker position={location} name={name} title={name} />
				</Map>
			</div>
		);
	}
}

EmbeddedMap.propTypes = {
	name: PropTypes.string.isRequired,
	placeId: PropTypes.string.isRequired
};

EmbeddedMap.defaultProps = {
	infoWindow: null
};

function mapStateToProps({ config }) {
	const { googleMapsKey } = config;
	return { googleMapsKey };
}

export default connect(mapStateToProps)(
	GoogleApiWrapper(({ googleMapsKey }) => ({
		apiKey: googleMapsKey,
		LoadingContainer: LoadingPage
	}))(EmbeddedMap)
);
