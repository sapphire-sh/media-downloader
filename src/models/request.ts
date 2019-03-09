export enum RequestType {
	TWITTER_VERIFY_CREDENTIALS = 100001,
	TWITTER_RATE_LIMIT_STATUS,
	TWITTER_USER,
	TWITTER_FOLLOWING_IDS,
	TWITTER_FOLLOWING_LIST,
	TWITTER_HOME_TIMELINE,
	TWITTER_USER_TIMELINE,
	TWITTER_SEARCH_UNIVERSAL,
}

export enum RequestMethodType {
	GET = 1,
	POST = 2,
}
