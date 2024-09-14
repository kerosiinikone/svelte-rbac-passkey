import { EMAIL_ADDRESS, EMAIL_PASSWORD } from '$env/static/private';
import nodemailer, { type Transporter } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

type GeneralTransporter = Transporter;

interface IEmailConfig {
	host: string;
	port: number;
	isSecure: boolean;
	provider: 'amazon' | 'nodemailer';
}

class TransportService {
	static createTransporter(config: IEmailConfig): GeneralTransporter {
		if (config.provider == 'amazon') {
			return this.createSesTransporter(config);
		} else {
			return nodemailer.createTransport({
				host: config.host,
				port: config.port,
				secure: config.isSecure,
				auth: {
					user: EMAIL_ADDRESS,
					pass: EMAIL_PASSWORD
				}
			});
		}
	}
	static createSesTransporter(_: IEmailConfig) {
		// Amazon SES implementation
		return {} as Transporter;
	}
}

export class EmailService {
	private instance: GeneralTransporter;

	constructor(config: IEmailConfig) {
		this.instance = TransportService.createTransporter(config);
	}

	async sendMail(mailOpts: Mail.Options): Promise<void> {
		try {
			this.instance.sendMail(mailOpts);
		} catch (err) {
			// Custom Error
			throw err;
		}
	}
}
