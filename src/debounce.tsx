import { debounce } from 'lodash';
import type { IntersectionDebounceOptions } from '.';

let instance: DebounceController | null = null;

// eslint-
export function formatStartOption(
  value?: (() => boolean) | boolean | undefined,
): () => boolean {
  if (typeof value === 'undefined') {
    return () => false;
  }
  if (typeof value === 'boolean') {
    return () => value;
  }
  return value;
}

class DebounceController {
  rafId: number | null = null;
  rdlId: number | null = null;
  executeMap: Map<Element, () => void> = new Map();
  rdlExecuteMap: Map<Element, () => void> = new Map();
  renderCount: number | undefined = undefined;
  run: () => void;
  constructor(options: IntersectionDebounceOptions) {
    this.rafId = null;
    this.rdlId = null;
    this.executeMap = new Map();
    this.rdlExecuteMap = new Map();
    this.renderCount = options?.debounceOptions?.renderCount
      ? +options?.debounceOptions?.renderCount
      : undefined;
    this.run = debounce(this.execute, options?.debounceOptions?.wait || 0);
  }
  private execute() {
    this.rafId && cancelAnimationFrame(this.rafId);
    this.rdlId && cancelIdleCallback(this.rdlId);
    this.renderController(this.executeMap, 'raf', () =>
      this.renderController(this.rdlExecuteMap, 'rdl'),
    );
  }

  /** 控制元素触发的数量 */
  private renderController(
    map: Map<Element, () => void>,
    type: 'raf' | 'rdl',
    callback?: () => void,
  ) {
    if (!this.renderCount) {
      map.forEach((fn) => {
        fn();
      });
      callback?.();
      return;
    }
    if (map.size === 0) {
      callback?.();
      return;
    }
    for (let i = 0; i < this.renderCount && i < map.size; i++) {
      const lastEntry = Array.from(map).pop();
      if (!lastEntry) {
        callback?.();
        return;
      }
      const target = lastEntry[0];
      const fn = lastEntry[1];
      if (!fn) {
        return;
      }
      map.delete(target);
      fn();
    }
    if (type === 'raf') {
      this.rafId = requestAnimationFrame(() => {
        this.renderController(map, 'raf', callback);
      });
    } else if (type === 'rdl') {
      this.rdlId = requestAnimationFrame(() => {
        this.renderController(map, 'rdl', callback);
      });
    } else {
      console.error('Missing type parameter');
    }
  }

  interrupt() {
    this.rafId && cancelAnimationFrame(this.rafId);
    this.rdlId && cancelIdleCallback(this.rdlId);
  }
  destory() {
    this.interrupt();
    this.executeMap = new Map();
    this.rdlExecuteMap = new Map();
  }

  pushCallback(
    inView: boolean,
    entry: IntersectionObserverEntry,
    fn: () => void,
  ) {
    if (inView) {
      if (this.rdlExecuteMap.has(entry.target)) {
        this.rdlExecuteMap.delete(entry.target);
      } else {
        this.executeMap.delete(entry.target);
        this.executeMap.set(entry.target, fn);
      }
    } else {
      if (this.executeMap.has(entry.target)) {
        this.executeMap.delete(entry.target);
      } else {
        this.rdlExecuteMap.delete(entry.target);
        this.rdlExecuteMap.set(entry.target, fn);
      }
    }
  }
}

function createDebounceController(options: IntersectionDebounceOptions) {
  if (!instance) {
    instance = new DebounceController(options);
  }
  return instance;
}

export default createDebounceController;
