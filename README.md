# react-debounce-intersection-observer

[![Version Badge][npm-version-svg]][package-url]
[![GZipped size][npm-minzip-svg]][bundlephobia-url]
[![Test][test-image]][test-url] [![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

Fork 自 `react-intersection-observer@9.8.2`, 有完整的
`react-intersection-observer`所提供的功能，在其基础之上增加了 debounce 能力，主
要用于处理监听的目标元素非常多的情况；

如果监听的目标元素非常多，并且元素之间位置关联性不大，则在快速滚动时，
`intersection-observer`中的 callback 会频繁触发，导致页面卡顿；这里的 debounce
是延缓 callback 的触发，并且支持对 callbacks 分批处理；

该文档只是对相对`react-intersection-observer`新增的功能做了说明，

## Features

- 支持 `react-intersection-observer`
  的[所有功能](https://github.com/thebuilder/react-intersection-observer)
- 在 hooks 用法中，支持设置 callback 的 debounce 触发时间
- 支持控制 callback 每批执行的数量；
- 支持通过开关控制 debounce 是否开启，不开启就和 `react-intersection-observer`
  的逻辑一致

## Installation

Install using [Yarn](https://yarnpkg.com):

```sh
yarn add react-debounce-intersection-observer
```

or NPM:

```sh
npm install react-debounce-intersection-observer --save
```

## Usage

## API

### Options

| Name            | Type                         | Default       | Description                                                                                                                                     |
| --------------- | ---------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **wait**        | `number`                     | `100`         | 延迟时间，如果在 `wait` 时间内持续触发 callback 事件，这些 callback 是不会立即执行的；默认时间为 100ms                                          |
| **start**       | `boolean` or `() => boolean` | `() => false` | 是否开启防抖，默认不开启，需要手动设置开启                                                                                                      |
| **renderCount** | `number` or `undefined`      | `undefined`   | 同一帧执行的 callback 数量；每一帧只会执行 `renderCount`个 callback；默认是全部执行；如果 callback 数量较多，建议根据执行逻辑设置一个合理的数值 |

## How I Did

```typescript
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
    // console.log('触发debounce函数----', executeMap.size, rdlExecuteMap.size)
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
      this.executeMap.delete(entry.target);
      this.executeMap.set(entry.target, fn);
      this.rdlExecuteMap.delete(entry.target);
    } else {
      this.rdlExecuteMap.delete(entry.target);
      this.rdlExecuteMap.set(entry.target, fn);
      this.executeMap.delete(entry.target);
    }
  }
}
```
