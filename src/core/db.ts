import { Assignment, Course, StorageAdapter, UrgencyLevel } from './types';

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
    try {
      const raw = await this.storage.get(STORE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === 2 && parsed.courses && parsed.assignments) {
          return parsed;
        }
      }
    } catch {}

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
    if (!id) return;
    const store = await this.load();
    const existing = store.courses[id];

    // 若原名是占位符而新名字更具体，进行升级
    const finalName = (!existing || existing.name === '当前课程') && name !== '当前课程' ? name : (existing?.name || name);

    store.courses[id] = {
      id,
      name: finalName,
      updatedAt: Date.now()
    };

    // 同步更新属于该课程的所有作业中的课程名
    for (const a of Object.values(store.assignments)) {
      if (a.courseId === id && a.courseName !== finalName) {
        a.courseName = finalName;
      }
    }

    await this.save(store);
  }

  /**
   * 归一化插入或更新单项作业（以 assignId 为唯一主键）
   */
  async upsertAssignment(item: Assignment): Promise<void> {
    if (!item.id) return;
    const store = await this.load();
    const existing = store.assignments[item.id];

    const courseId = item.courseId || existing?.courseId || '';
    let courseName = item.courseName || existing?.courseName || '专业课程';

    // 如果课程库里有规范名字，优先采用
    if (courseId && store.courses[courseId]) {
      courseName = store.courses[courseId].name;
    } else if (courseId && courseName !== '当前课程') {
      store.courses[courseId] = { id: courseId, name: courseName, updatedAt: Date.now() };
    }

    // 保留已解析成功的合法 DDL，防止被无日期的详情请求覆盖
    let finalDeadline = item.deadline;
    let finalTimestamp = item.deadlineTimestamp;
    let finalRemHours = item.remainingHours;
    let finalRemText = item.remainingText;
    let finalUrgency = item.urgency;

    if (finalTimestamp === 0 && existing && existing.deadlineTimestamp > 0) {
      finalDeadline = existing.deadline;
      finalTimestamp = existing.deadlineTimestamp;
      finalRemHours = existing.remainingHours;
      finalRemText = existing.remainingText;
      finalUrgency = existing.urgency;
    }

    // 保证 URL 具有 courseID 参数与根路径，便于随时点击跳转
    let finalUrl = item.url || existing?.url || '';
    if (!finalUrl || (finalUrl.includes('/assignment/') && !finalUrl.includes('courseID') && courseId)) {
      finalUrl = courseId
        ? `/assignment/index.jsp?courseID=${courseId}&assignID=${item.id}`
        : `/assignment/index.jsp?assignID=${item.id}`;
    }

    store.assignments[item.id] = {
      id: item.id,
      courseId,
      courseName,
      title: item.title || existing?.title || `作业 ${item.id}`,
      deadline: finalDeadline,
      deadlineTimestamp: finalTimestamp,
      remainingHours: finalRemHours,
      remainingText: finalRemText,
      status: item.status || existing?.status || 'pending',
      urgency: finalUrgency,
      url: finalUrl,
      updatedAt: Date.now()
    };

    await this.save(store);
  }

  /**
   * 批量归一化更新作业
   */
  async batchUpsertAssignments(items: Assignment[]): Promise<void> {
    for (const item of items) {
      await this.upsertAssignment(item);
    }
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
      const canonicalName = (r.courseId && store.courses[r.courseId]?.name)
        ? store.courses[r.courseId].name
        : (r.courseName && r.courseName !== '当前课程' ? r.courseName : '专业课程');

      const url = (r.url.includes('/assignment/') && !r.url.includes('courseID') && r.courseId)
        ? `/assignment/index.jsp?courseID=${r.courseId}&assignID=${r.id}`
        : r.url;

      return {
        id: r.id,
        courseId: r.courseId,
        courseName: canonicalName,
        title: r.title,
        deadline: r.deadline,
        deadlineTimestamp: r.deadlineTimestamp,
        remainingHours: r.remainingHours,
        remainingText: r.remainingText,
        status: r.status,
        urgency: r.urgency,
        url
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
