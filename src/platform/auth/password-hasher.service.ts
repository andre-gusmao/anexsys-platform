import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

@Injectable()
export class PasswordHasherService {
  private readonly keyLength = 64;

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(password, salt, this.keyLength)) as Buffer;

    return `${salt}:${derived.toString('hex')}`;
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const [salt, storedHash] = encodedHash.split(':');
    if (!salt || !storedHash) {
      return false;
    }

    const derived = (await scrypt(password, salt, this.keyLength)) as Buffer;
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (derived.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(derived, storedBuffer);
  }
}
