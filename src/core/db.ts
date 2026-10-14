import type { Assignment, Course, StorageAdapter, UrgencyLevel } from './types.js';

export interface CourseRecord {
  id: string;
  name: string;
  updatedAt: number;
}

export interface AssignmentRecord {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  deadline: string;
  deadlineTimestamp: number;
  remainingHours: number;
  remainingText: string;
  status: 'pending' | 'submitted' | 'graded';
  urgency: UrgencyLevel;
  url: string;
  updatedAt: number;
}

export interface NormalizedStoreData {
  version: number;
  lastSync: number;
  courses: Record<string, CourseRecord>;         // 严格按 courseId 为 Key，杜绝重复课程
  assignments: Record<string, AssignmentRecord>; // 严格按 assignId 为 Key，杜绝重复作业
}

const STORE_STORAGE_KEY = 'nodd_normalized_store_v2';

export class HomeworkDB {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  async load(): Promise<NormalizedStoreData> {
    const raw = await this.storage.get(STORE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version !== 2 || !parsed.courses || !parsed.assignments) {
        throw new Error('本地作业数据格式无效');
      }
      return parsed;
    }

    return {
      version: 2,
      lastSync: 0,
      courses: {},
      assignments: {}
    };
  }

  async save(data: NormalizedStoreData): Promise<void> {
    data.lastSync = Date.now();
    await this.storage.set(STORE_STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * 注册或更新课程元数据（按 courseId 唯一索引，绝无重复课程）
   */
  async upsertCourse(id: string, name: string): Promise<void> {
    if (!id || !name) throw new Error('课程缺少 ID 或名称');
    const store = await this.load();

    store.courses[id] = {
      id,
      name,
      updatedAt: Date.now()
    };

    // 同步更新属于该课程的所有作业中的课程名
    for (const a of Object.values(store.assignments)) {
      if (a.courseId === id && a.courseName !== name) {
        a.courseName = name;
      }
    }

    await this.save(store);
  }

  /**
   * 归一化插入或更新单项作业（以 assignId 为唯一主键）
   */
  async upsertAssignment(item: Assignment): Promise<void> {
    if (!item.id || !item.courseName || !item.url) {
      throw new Error('作业缺少 ID、课程名称或链接');
    }
    const store = await this.load();
    const courseId = item.courseId || '';
    const courseName = item.courseName;

    if (courseId) {
      store.courses[courseId] = { id: courseId, name: courseName, updatedAt: Date.now() };
    }

    store.assignments[item.id] = {
      id: item.id,
      courseId,
      courseName,
      title: item.title,
      deadline: item.deadline,
      deadlineTimestamp: item.deadlineTimestamp,
      remainingHours: item.remainingHours,
      remainingText: item.remainingText,
      status: item.status,
      urgency: item.urgency,
      url: item.url,
      updatedAt: Date.now()
    };

    await this.save(store);
  }

  async replaceAssignments(items: Assignment[], courses: Course[]): Promise<void> {
    if (courses.some(course => !course.id || !course.name) || items.some(item => !item.id || !item.courseName || !item.url)) {
      throw new Error('同步数据缺少课程或作业字段');
    }
    const store = await this.load();
    store.courses = Object.fromEntries(courses.map(course => [course.id, {
      id: course.id,
      name: course.name,
      updatedAt: Date.now()
    }]));
    store.assignments = Object.fromEntries(items.map(item => [item.id, {
      ...item,
      courseId: item.courseId || '',
      updatedAt: Date.now()
    }]));
    await this.save(store);
  }

  /**
   * 获取结构化数据库中全部聚合作业列表，并进行最佳实践排序
   * 排序逻辑：
   * 1. 距离 DDL 越近的进行中作业排在最前
   * 2. 已超期的作业沉底展示
   * 3. 课程名称实时关联 courses 表，保证展示统一规范
   */
  async getAllAssignments(): Promise<Assignment[]> {
    const store = await this.load();
    const records = Object.values(store.assignments);

    const list: Assignment[] = records.map(r => {
      return {
        id: r.id,
        courseId: r.courseId,
        courseName: r.courseName,
        title: r.title,
        deadline: r.deadline,
        deadlineTimestamp: r.deadlineTimestamp,
        remainingHours: r.remainingHours,
        remainingText: r.remainingText,
        status: r.status,
        urgency: r.urgency,
        url: r.url
      };
    });

    return list.sort((a, b) => {
      const aActive = a.remainingHours > 0 && a.deadlineTimestamp > 0;
      const bActive = b.remainingHours > 0 && b.deadlineTimestamp > 0;

      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      if (aActive && bActive) {
        return a.deadlineTimestamp - b.deadlineTimestamp;
      }

      if (a.deadlineTimestamp > 0 && b.deadlineTimestamp > 0) {
        return b.deadlineTimestamp - a.deadlineTimestamp;
      }

      return (b.deadlineTimestamp || 0) - (a.deadlineTimestamp || 0);
    });
  }
}
