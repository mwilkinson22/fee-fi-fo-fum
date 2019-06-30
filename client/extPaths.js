export const googleBucket = "https://storage.googleapis.com/feefifofum/";
export const imagePath = googleBucket + "images/";
let localUrl;
if (typeof window !== "undefined") {
	localUrl = window.location.protocol + "//" + window.location.host;
} else {
	localUrl = "";
}
export { localUrl };
export const personImagePath = imagePath + "people/full/";
export const teamImagePath = imagePath + "teams/";
export const userImagePath = imagePath + "users/";
export const gameImagePath = imagePath + "games/";
export const groundImagePath = imagePath + "grounds/";
export const layoutImagePath = imagePath + "layout/";
export const competitionImagePath = imagePath + "competitions/";
