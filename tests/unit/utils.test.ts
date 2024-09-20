import { MockWriter } from '$lib/server/utils/__mock';
import { createPasscode, logout, setCookies, signTokenPayload } from '$lib/server/utils/auth';
import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { EmailService } from '$lib/server/utils/email';

describe('random passcode', () => {
	it('generate 2 passcodes of length 6', () => {
		const passcode = createPasscode();

		expect(passcode).toHaveLength(6);
	});
	it('generate 2 passcodes that are not the same', () => {
		const firstPasscode = createPasscode();
		const secondPasscode = createPasscode();

		expect(firstPasscode).to.not.equal(secondPasscode);
	});
});

describe('cookies', () => {
	it('set cookies of certain parameter', () => {
		const mockWriter = new MockWriter();
		const cookie = {
			name: 'auth',
			val: 'auth',
			opts: {}
		};

		setCookies(mockWriter, [cookie]);

		const savedCookie = mockWriter.get(cookie.name);

		expect(savedCookie).toBeTruthy();
		expect(savedCookie).toBe(cookie.val);
	});
	it('logout and delete cookies', () => {
		const mockWriter = new MockWriter();
		mockWriter.set('accessToken', '', {
			path: '/'
		});
		mockWriter.set('refreshToken', '', {
			path: '/'
		});

		const allCookiesFirst = mockWriter.getAll();
		expect(allCookiesFirst).toHaveLength(2);

		logout(mockWriter);

		const allCookiesLast = mockWriter.getAll();
		expect(allCookiesLast).toHaveLength(0);
	});
});

describe('jsonwebtoken', () => {
	it('sign and return valid auth tokens', () => {
		const userMock = { id: '1', tokenVersion: 1 };
		const { accessToken, refreshToken } = signTokenPayload(userMock.id, userMock.tokenVersion);

		const aPayload = jwt.verify(accessToken, JWT_SECRET) as jwt.JwtPayload;
		const rPayload = jwt.verify(refreshToken, JWT_SECRET) as jwt.JwtPayload;

		expect(aPayload.id).toBe(userMock.id);
		expect(rPayload.id).toBe(userMock.id);
	});
});

describe('email service', async () => {
	it('create a transporter and succesfully initiate send', async () => {
		const svc = new EmailService({
			host: '',
			isSecure: true,
			port: 0,
			provider: 'test'
		});

		const opts = await svc.sendMail({ to: 'myself' });

		expect(opts.to).toBe('myself');
	});
});
