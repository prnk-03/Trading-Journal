import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import type { RegisterUser, LoginUser, User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token: string): { userId: number } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch (error) {
      return null;
    }
  }

  async register(userData: RegisterUser): Promise<{ user: Omit<User, 'password'>, token: string }> {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);

    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Generate token
    const token = this.generateToken(user.id);

    // Save session
    await storage.createUserSession({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(credentials: LoginUser): Promise<{ user: Omit<User, 'password'>, token: string }> {
    // Find user by email
    const user = await storage.getUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await this.comparePassword(credentials.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user.id);

    // Save session
    await storage.createUserSession({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async logout(token: string): Promise<void> {
    await storage.deleteUserSession(token);
  }

  async getCurrentUser(token: string): Promise<Omit<User, 'password'> | null> {
    const session = await storage.getUserSession(token);
    if (!session || new Date() > session.expiresAt) {
      // Clean up expired session
      if (session) {
        await storage.deleteUserSession(token);
      }
      return null;
    }

    const user = await storage.getUser(session.userId);
    if (!user) return null;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();