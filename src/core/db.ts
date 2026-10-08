import { Assignment, StorageAdapter } from './types';

export interface CachedCourse {
  id: string;
  name: string;
  updatedAt: number;
  assignments: Assignment[];
}

export interface HomeworkDBData {
  lastSync: number;
  courses: Record<string, CachedCourse>;
}

const DB_STORAGE_KEY = 'nodd_homework_db_v1';

export class HomeworkDB {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  async load(): Promise<HomeworkDBData> {
    try {
      const raw = await this.storage.get(DB_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return { lastSync: 0, courses: {} };
  }

  async save(data: HomeworkDBData): Promise<void> {
    await this.storage.set(DB_STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * 更新或插入某个课程的作业列表
   */
  async upsertCourse(courseId: string, courseName: string, items: Assignment[]): Promise<void> {
    const db = await this.load();
    db.courses[courseId] = {
      id: courseId,
      name: courseName,
      updatedAt: Date.now(),
      assignments: items
    };
    db.lastSync = Date.now();
    await this.save(db);
  }

  /**
   * 单个作业更新（例如用户打开 fileUploadList.jsp 时从页面提取到的单条作业）
   */
  async upsertAssignment(item: Assignment): Promise<void> {
    const db = await this.load();
    const courseKey = item.courseName || 'default';
    if (!db.courses[courseKey]) {
      db.courses[courseKey] = {
        id: courseKey,
        name: item.courseName || '当前课程',
        updatedAt: Date.now(),
        assignments: []
      };
    }

    const course = db.courses[courseKey];
    const idx = course.assignments.findIndex(a => a.id === item.id);
    if (idx !== -1) {
      course.assignments[idx] = { ...course.assignments[idx], ...item };
    } else {
      course.assignments.push(item);
    }
    await this.save(db);
  }

  /**
   * 获取本地数据库中全部课程的所有未完成作业，并按 DDL 智能排序
   */
  async getAllAssignments(): Promise<Assignment[]> {
    const db = await this.load();
    const map = new Map<string, Assignment>();

    for (const c of Object.values(db.courses)) {
      for (const a of c.assignments) {
        map.set(a.id, a);
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      // 进行中的排在最前（早截止的更靠前）
      if (a.remainingHours > 0 && b.remainingHours <= 0) return -1;
      if (a.remainingHours <= 0 && b.remainingHours > 0) return 1;
      if (a.remainingHours > 0 && b.remainingHours > 0) {
        return a.deadlineTimestamp - b.deadlineTimestamp;
      }
      return b.deadlineTimestamp - a.deadlineTimestamp;
    });
  }
}
