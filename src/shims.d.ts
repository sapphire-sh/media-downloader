declare const __dev: boolean;
declare const __path: {
	root: string;
	src: string;
	dist: string;
	data: string;
};
declare const __knex: any;
declare const __account: {
	twitter: {
		username: string;
		password: string;
	};
};

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type AnyObject = {
	[key: string]: string;
};