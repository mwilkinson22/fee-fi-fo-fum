# fee-fi-fo-fum
A fully featured Rugby League hub, suitable for either a team or a fanpage.

## Frontend
- Full News/Blog functionality based on DraftJS with full integration for Tweets, Videos, Quizzes and more
- Squad info for multiple team types (First Grade, Reserves, Academy, etc)
- Game records featuring scores, player stats, team records, relevant news articles and player of the match voting
- "Choose your team" selector with social media integration, either manually created or automatically added to game pages using pregame squads
- *Neutral Game* integration to provide accurate league tables
- Player Profiles with detailed, customisable stat breakdowns
- *Seasons* pages with similar stat breakdowns on a team-level
- Annual awards voting

## Backend
- Social Media Management tools, with automated posting, thread authorisation and on-the-fly image generation for player events (Try, Conversion, etc), game events (Kick Off, Full Time), squad announcements (pregame and matchday), post-game stats breakdowns, player announcements, fixture announcements and more
- Single point of data entry for all stats. Each game has a collection for each player within it. This is then pulled for the Game page, the Player page, the Season page, etc
- External fetching of stats, where authorised to do so
- Full CRUD management for teams, players, coaches, referees, competitions, stadiums, and more.
- Admin Dashboard alerting users to missing data in advance

Initially developed for the Fee Fi Fo Fum fanpage to host Huddersfield Giants data, but can easily be configured for any team in any competition
