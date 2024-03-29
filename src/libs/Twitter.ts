import {
	log,
	sleep,
	sendRequest,
} from '~/helpers';
import {
	Authentication,
	Database,
} from '~/libs';
import {
	ServiceType,
	CommandType,
	CommandTwitter,
	RequestType,
	Tweet,
	TwitterMediumType,
	RequestPayloadTwitter,
	RateLimitStatus,
} from '~/models';

export class Twitter {
	private static instance: Twitter | null = null;

	private serviceType = ServiceType.TWITTER;

	private constructor() { }

	public static createInstance() {
		if (this.instance !== null) {
			throw new Error('cannot create instance');
		}
		this.instance = new Twitter();
	}

	public static getInstance(): Twitter {
		if (this.instance === null) {
			throw new Error('instance is null');
		}
		return this.instance;
	}

	public async process(command: CommandTwitter): Promise<true> {
		log('info', 'twitter', 'process', command.type);

		switch (command.type) {
			case CommandType.TWITTER_RATE_LIMIT_STATUS: {
				const status = await this.sendRequest({
					'type': RequestType.TWITTER_RATE_LIMIT_STATUS,
				}) as RateLimitStatus;
				return true;
			}
			case CommandType.TWITTER_FOLLOWING_IDS: {
				const {
					ids,
				} = await this.sendRequest({
					'type': RequestType.TWITTER_FOLLOWING_IDS,
				}) as {
					ids: string[];
				};
				for (const id of ids) {
					const database = Database.getInstance();
					await database.process({
						'type': CommandType.DATABASE_INSERT_ACCOUNT,
						'payload': {
							'id': id,
						},
					});
				}
				return true;
			}
			case CommandType.TWITTER_HOME_TIMELINE: {
				const tweets = await this.sendRequest({
					'type': RequestType.TWITTER_HOME_TIMELINE,
					'params': command.payload,
				}) as Tweet[];
				log('info', `tweets`, tweets.length);
				for (const tweet of tweets) {
					if (tweet.retweeted_status !== undefined) {
						continue;
					}

					const database = Database.getInstance();
					await database.process({
						'type': CommandType.DATABASE_INSERT_TWEET,
						'payload': {
							'tweet': tweet,
						},
					});

					if (tweet.extended_entities === undefined) {
						continue;
					}

					const {
						extended_entities: entities,
					} = tweet;

					for (const medium of entities.media) {
						let id: string | null = null;
						let url: string | null = null;

						switch (medium.type) {
							case TwitterMediumType.PHOTO: {
								id = medium.id_str;
								url = `${medium.media_url_https}:orig`;
								break;
							}
							case TwitterMediumType.VIDEO:
							case TwitterMediumType.ANIMATED_GIF: {
								id = medium.id_str;
								url = medium.video_info.variants.filter(e => {
									return e.content_type.startsWith('video');
								}).sort((a, b) => {
									return b.bitrate - a.bitrate;
								})[0].url;
								break;
							}
						}

						if (id !== null && url !== null) {
							await database.process({
								'type': CommandType.DATABASE_INSERT_MEDIUM,
								'payload': {
									'url': url,
									'accountId': tweet.user.id_str,
									'tweetId': tweet.id_str,
								},
							});
						}
					}
				}
				return true;
			}
		}
	}

	private async sendRequest(payload: RequestPayloadTwitter) {
		const authentication = Authentication.getInstance();
		authentication.getConfiguration(this.serviceType);

		return sendRequest(payload);
	}

	public async isValid(): Promise<boolean> {
		const authentication = Authentication.getInstance();
		authentication.getConfiguration(this.serviceType);

		try {
			this.sendRequest({
				'type': RequestType.TWITTER_VERIFY_CREDENTIALS,
			});

			return true;
		}
		catch (error) {
			return false;
		}
	}
}
