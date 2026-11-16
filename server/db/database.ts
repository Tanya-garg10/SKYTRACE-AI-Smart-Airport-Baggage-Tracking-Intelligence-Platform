import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { MongoModels } from '../models/mongooseSchemas.js';
import { buildSeedData, DatabaseState } from './seed.js';
import {
  AirportCheckpointRecord,
  BaggageRecord,
  FlightRecord,
  LostBaggageReportRecord,
  NotificationRecord,
  PassengerRecord,
  StaffActivityRecord,
  StaffRecord,
  TrackingEventRecord,
  UserRecord,
} from '../../src/shared/types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'skytrace.db.json');

type CollectionKey = keyof DatabaseState;

class SkytraceDatabase {
  private mode: 'mongodb' | 'local-persistent' = 'local-persistent';
  private state: DatabaseState = buildSeedData();
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    const mongoUri = process.env.MONGODB_URI?.trim();
    if (mongoUri) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        this.mode = 'mongodb';
        await this.seedMongoIfEmpty();
        this.initialized = true;
        console.log('[SKYTRACE DB] Connected to MongoDB.');
        return;
      } catch (err) {
        console.warn('[SKYTRACE DB] MongoDB connection failed, falling back to local persistent store:', (err as Error).message);
      }
    }

    this.mode = 'local-persistent';
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseState;
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.state = parsed;
        } else {
          this.state = buildSeedData();
          this.persistLocal();
        }
      } catch {
        this.state = buildSeedData();
        this.persistLocal();
      }
    } else {
      this.state = buildSeedData();
      this.persistLocal();
    }
    this.initialized = true;
    console.log(`[SKYTRACE DB] Initialized local persistent store at ${DB_FILE}`);
  }

  getMode(): 'mongodb' | 'local-persistent' {
    return this.mode;
  }

  private persistLocal(): void {
    if (this.mode !== 'local-persistent') return;
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(this.state, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  private async seedMongoIfEmpty(): Promise<void> {
    const count = await MongoModels.User.countDocuments();
    if (count > 0) return;
    const seed = buildSeedData();
    await Promise.all([
      MongoModels.User.insertMany(seed.users),
      MongoModels.Passenger.insertMany(seed.passengers),
      MongoModels.Staff.insertMany(seed.staff),
      MongoModels.Flight.insertMany(seed.flights),
      MongoModels.Baggage.insertMany(seed.baggage),
      MongoModels.TrackingEvent.insertMany(seed.trackingEvents),
      MongoModels.Notification.insertMany(seed.notifications),
      MongoModels.LostBaggageReport.insertMany(seed.reports),
      MongoModels.AirportCheckpoint.insertMany(seed.checkpoints),
      MongoModels.StaffActivity.insertMany(seed.staffActivity),
    ]);
  }

  private getModel(key: CollectionKey) {
    const map = {
      users: MongoModels.User,
      passengers: MongoModels.Passenger,
      staff: MongoModels.Staff,
      flights: MongoModels.Flight,
      baggage: MongoModels.Baggage,
      trackingEvents: MongoModels.TrackingEvent,
      notifications: MongoModels.Notification,
      reports: MongoModels.LostBaggageReport,
      checkpoints: MongoModels.AirportCheckpoint,
      staffActivity: MongoModels.StaffActivity,
    };
    return map[key];
  }

  async getAll<K extends CollectionKey>(key: K): Promise<DatabaseState[K]> {
    if (this.mode === 'mongodb') {
      const docs = await this.getModel(key).find({}, { _id: 0, __v: 0 }).lean();
      return docs as unknown as DatabaseState[K];
    }
    return [...this.state[key]] as DatabaseState[K];
  }

  async findOne<K extends CollectionKey>(
    key: K,
    predicate: (item: DatabaseState[K][number]) => boolean,
    mongoFilter?: Record<string, unknown>
  ): Promise<DatabaseState[K][number] | null> {
    if (this.mode === 'mongodb' && mongoFilter) {
      const doc = await this.getModel(key).findOne(mongoFilter, { _id: 0, __v: 0 }).lean();
      return (doc as unknown as DatabaseState[K][number]) ?? null;
    }
    const found = (this.state[key] as DatabaseState[K][number][]).find(predicate);
    return found ? ({ ...found } as DatabaseState[K][number]) : null;
  }

  async insert<K extends CollectionKey>(key: K, record: DatabaseState[K][number]): Promise<DatabaseState[K][number]> {
    if (this.mode === 'mongodb') {
      await this.getModel(key).create(record);
      return record;
    }
    (this.state[key] as DatabaseState[K][number][]).push(record);
    this.persistLocal();
    return record;
  }

  async updateById<K extends CollectionKey>(
    key: K,
    id: string,
    updates: Partial<DatabaseState[K][number]>
  ): Promise<DatabaseState[K][number] | null> {
    if (this.mode === 'mongodb') {
      const doc = await this.getModel(key)
        .findOneAndUpdate({ id }, { $set: updates }, { new: true, projection: { _id: 0, __v: 0 } })
        .lean();
      return (doc as unknown as DatabaseState[K][number]) ?? null;
    }
    const list = this.state[key] as (DatabaseState[K][number] & { id: string })[];
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.persistLocal();
    return { ...list[idx] } as DatabaseState[K][number];
  }

  async deleteById<K extends CollectionKey>(key: K, id: string): Promise<boolean> {
    if (this.mode === 'mongodb') {
      const res = await this.getModel(key).deleteOne({ id });
      return res.deletedCount > 0;
    }
    const list = this.state[key] as (DatabaseState[K][number] & { id: string })[];
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this.persistLocal();
    return true;
  }

  // Convenience typed helpers
  async getUsers(): Promise<UserRecord[]> { return this.getAll('users'); }
  async getPassengers(): Promise<PassengerRecord[]> { return this.getAll('passengers'); }
  async getStaff(): Promise<StaffRecord[]> { return this.getAll('staff'); }
  async getFlights(): Promise<FlightRecord[]> { return this.getAll('flights'); }
  async getBaggage(): Promise<BaggageRecord[]> { return this.getAll('baggage'); }
  async getTrackingEvents(): Promise<TrackingEventRecord[]> { return this.getAll('trackingEvents'); }
  async getNotifications(): Promise<NotificationRecord[]> { return this.getAll('notifications'); }
  async getReports(): Promise<LostBaggageReportRecord[]> { return this.getAll('reports'); }
  async getCheckpoints(): Promise<AirportCheckpointRecord[]> { return this.getAll('checkpoints'); }
  async getStaffActivity(): Promise<StaffActivityRecord[]> { return this.getAll('staffActivity'); }
}

export const db = new SkytraceDatabase();
