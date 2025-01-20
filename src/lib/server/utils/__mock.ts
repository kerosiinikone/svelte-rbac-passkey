import type { Cookies } from '@sveltejs/kit';
import type { Transporter } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

export class MockWriter implements Cookies {
	private cookieStore: Record<string, string> = {};

	get(name: string, _?: import('cookie').ParseOptions): string | undefined {
		return this.cookieStore[name];
	}
	set(
		name: string,
		value: string,
		_: import('cookie').SerializeOptions & { path: string }
	): void {
		this.cookieStore[name] = value;
	}
	serialize(
		_: string,
		__: string,
		___: import('cookie').SerializeOptions & { path: string }
	): string {
		return '';
	}
	delete(name: string, _: import('cookie').SerializeOptions & { path: string }): void {
		delete this.cookieStore[name];
	}
	getAll(_?: import('cookie').ParseOptions): Array<{ name: string; value: string }> {
		var arr = [];
		for (var item in this.cookieStore) {
			arr.push({ name: item, value: this.cookieStore[item] });
		}
		return arr;
	}
}

export class MockTransporter implements Partial<Transporter> {
	async sendMail(mailOptions: Mail.Options): Promise<any> {
		return mailOptions;
	}
}
