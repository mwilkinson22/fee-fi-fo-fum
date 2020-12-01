import React from "react";

const YouTubeVideo = ({ startTime, videoId }) => {
	let src = `https://www.youtube.com/embed/${videoId}?iv_load_policy=3&amp;rel=0`;
	if (startTime) {
		src += `&start=${startTime}`;
	}
	return <iframe allowFullScreen="allowFullScreen" src={src} />;
};

export default YouTubeVideo;
