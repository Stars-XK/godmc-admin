import * as Lodash from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import isLeapYear from 'dayjs/plugin/isLeapYear'; // 导入插件
import timezone from 'dayjs/plugin/timezone'; // 导入插件
import utc from 'dayjs/plugin/utc'; // 导入插件
import 'dayjs/locale/zh-cn'; // 导入本地化语言
import { ValueTransformer } from 'typeorm';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isLeapYear); // 使用插件
dayjs.locale('zh-cn'); // 使用本地化语言
dayjs.tz.setDefault('Asia/Beijing');

import { DataScopeEnum } from '../enum/index';

/**
 * 数组转树结构
 * @param arr
 * @param getId
 * @param getLabel
 * @returns
 */
export function ListToTree(arr, getKey, getParentKey, maxLevel = Infinity) {
  const kData = {}; 
  const lData = []; 
  const nodeKeys = new Set(); 

  arr.forEach((m) => {
    nodeKeys.add(String(getKey(m)));
  });

  // 第一遍：初始化所有节点，并计算直接下级数量 childCount
  arr.forEach((m) => {
    const key = String(getKey(m));
    const parentKey = String(getParentKey(m));

    kData[key] = {
      ...m,
      childCount: 0,
      children: [],
      hasChildren: false,
    };
  });

  // 计算每个节点的 childCount
  arr.forEach((m) => {
    const parentKey = String(getParentKey(m));
    if (kData[parentKey]) {
      kData[parentKey].childCount += 1;
      kData[parentKey].hasChildren = true;
    }
  });

  // 第二遍：组装树，限制最大层级
  // 我们需要计算每个节点的当前层级
  const levelMap = {};
  
  // 找出所有根节点
  const roots = [];
  arr.forEach((m) => {
    const key = String(getKey(m));
    const parentKey = String(getParentKey(m));
    if (parentKey === '0' || parentKey === 'undefined' || parentKey === 'null' || !nodeKeys.has(parentKey)) {
      levelMap[key] = 1;
      roots.push(kData[key]);
      lData.push(kData[key]);
    }
  });

  // BFS 计算层级并挂载
  let queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = String(getKey(current));
    const currentLevel = levelMap[currentKey];

    // 如果达到最大层级，则不再将子节点加入 children，但保留 hasChildren
    if (currentLevel >= maxLevel) {
      delete current.children; // 移除 children 属性，让前端组件识别为懒加载节点
      continue;
    }

    // 寻找当前节点的直接子节点
    arr.forEach((m) => {
      const key = String(getKey(m));
      const parentKey = String(getParentKey(m));
      if (parentKey === currentKey) {
        levelMap[key] = currentLevel + 1;
        kData[currentKey].children.push(kData[key]);
        queue.push(kData[key]);
      }
    });
  }

  return lData;
}

export function BuildTree(arr, getKey, getParentKey) {
  const map = new Map();
  const roots = [];
  const keys = new Set();

  arr.forEach((m) => {
    keys.add(String(getKey(m)));
  });

  arr.forEach((m) => {
    const key = String(getKey(m));
    const existing = map.get(key);
    const node = existing || { children: [] };
    Object.assign(node, m);
    if (!node.children) node.children = [];
    map.set(key, node);
  });

  arr.forEach((m) => {
    const key = String(getKey(m));
    const parentKey = String(getParentKey(m) ?? 0);
    const node = map.get(key);
    if (!node) return;

    if (parentKey === '0' || !keys.has(parentKey)) {
      roots.push(node);
      return;
    }

    const parent = map.get(parentKey);
    if (!parent) {
      roots.push(node);
      return;
    }
    if (!parent.children) parent.children = [];
    parent.children.push(node);
  });

  return roots;
}

/**
 * 获取当前时间
 * YYYY-MM-DD HH:mm:ss
 * @returns
 */
export function GetNowDate() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 时间格式化
 * @param date
 * @param format
 * @returns
 */
export function FormatDate(date: Date, format = 'YYYY-MM-DD HH:mm:ss') {
  return date && dayjs(date).format(format);
}

/**
 * 深拷贝
 * @param obj
 * @returns
 */
export function DeepClone<T>(obj: T) {
  return Lodash.cloneDeep(obj);
}

/**
 * 生成唯一id
 * UUID
 * @returns
 */
export function GenerateUUID(): string {
  const uuid = uuidv4();
  return uuid.replaceAll('-', '');
}

/**
 * 数组去重
 * @param list
 * @returns
 */
export function Uniq<T extends number | string>(list: Array<T>): Array<T> {
  return Lodash.uniq(list);
}

/**
 * 分页
 * @param data
 * @param pageSize
 * @param pageNum
 * @returns
 */
export function Paginate(data: { list: Array<any>; pageSize: number; pageNum: number }, filterParam: any) {
  // 检查 pageSize 和 pageNumber 的合法性
  if (data.pageSize <= 0 || data.pageNum < 0) {
    return [];
  }

  // 将数据转换为数组
  let arrayData = Lodash.toArray(data.list);

  if (Object.keys(filterParam).length > 0) {
    arrayData = Lodash.filter(arrayData, (item) => {
      const arr = [];
      if (filterParam.ipaddr) {
        arr.push(Boolean(item.ipaddr.includes(filterParam.ipaddr)));
      }

      if (filterParam.userName && item.userName) {
        arr.push(Boolean(item.userName.includes(filterParam.userName)));
      }
      return !Boolean(arr.includes(false));
    });
  }

  // 获取指定页的数据
  const pageData = arrayData.slice((data.pageNum - 1) * data.pageSize, data.pageNum * data.pageSize);

  return pageData;
}

/**
 * 数据范围过滤
 *
 * @param joinPoint 切点
 * @param user 用户
 * @param deptAlias 部门别名
 * @param userAlias 用户别名
 * @param permission 权限字符
 */
export async function DataScopeFilter<T>(entity: any, dataScope: DataScopeEnum): Promise<T> {
  switch (dataScope) {
    case DataScopeEnum.DATA_SCOPE_CUSTOM:
      // entity.andWhere((qb) => {
      //   const subQuery = qb.subQuery().select('user.deptId').from(User, 'user').where('user.userId = :userId').getQuery();
      //   return 'post.title IN ' + subQuery;
      // });
      break;
    default:
      break;
  }
  return entity;
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/**
 * 全局timestamp 转换为 Date
 */
export const dateTransformer: ValueTransformer = {
  to: (value: Date | null): Date | null => {
    if (value === null) {
      return null;
    }
    return value;
  },
  from: (value: Date | null): string | null => {
    if (value === null) {
      return null;
    }
    return FormatDate(value);
  },
};

/**
 * 判断值是否为null undefined 空字符串 NaN
 */
export function isEmpty(value: any) {
  return value === null || value === undefined || value === '' || value === 'NaN';
}
