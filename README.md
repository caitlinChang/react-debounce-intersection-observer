# react-debounce-intersection-observer

[![Version Badge][npm-version-svg]][package-url]
[![GZipped size][npm-minzip-svg]][bundlephobia-url]
[![Test][test-image]][test-url] [![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

Fork 自 `react-intersection-observer@9.0.0`, 有完整的
`react-intersection-observer`所提供的功能，在其基础之上增加了 debounce 能力，主
要用于处理监听的目标元素非常多的情况；

如果监听的目标元素非常多，并且元素之间位置关联性不大，则在快速滚动时，
`intersection-observer`中的 callback 会频繁触发，导致页面卡顿；这里的 debounce
是延缓 callback 的触发，并且支持对 callbacks 分批处理；

该文档仅对 debounce 功能做了说明，其他功能的详细文档还请
看[`react-intersection-observer`](https://github.com/thebuilder/react-intersection-observer)

## Features

- [其他](https://github.com/thebuilder/react-intersection-observer)
- 在 hooks 用法中，支持设置 callback 的 debounce 触发时间
- 支持控制 callback 每批执行的数量；
- 支持通过开关控制 debounce 是否开启，不开启就和 `react-intersection-observer`
  的逻辑一致
- inView 为 false 的 callback 放在 `requestIdleCallback` 中执行，因为大多数情况
  下不在可视区域的元素中的逻辑是不重要的，要优先执行可视区域内的；
- debounce 用法当前仅支持 threshold 为单个数字的用法；

**待支持**

⬜️ 支持 threshold 为数字数组的情况；

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

```jsx
function View(props: { isStartDebounce: true }) {
  const { ref, inView } = useInView({
    threshold: 0,
    debounceOptions: {
      wait: 200,
      renderCount: 1,
      start: () => {
        return props.isStartDebounce;
      },
    },
  });

  return (
    <div ref={ref}>
      <div>content</div>
      {inView && <p>This is inView</p>}
    </div>
  );
}
```

**注意 1**: debounceOptions 是非响应式的，在 observer 实例创建后，debounce 也会
实例化；debounceOptions 在此之后发生变化也不起作用，使用的是第一次创建的
debounce 实例。

**注意 2**: 虽然 debounceOptions 是非响应式的，但是 start 方法会在每次
intersection observer 触发时调用一次，因此在 start 中可以通过配置全局变量的方式
控制 debounce 的开启；

```js
{
  start: () => {
    return window.isStartDebounce === true;
  };
}
```

## API

### Options

| Name            | Type                         | Default       | Description                                                                                                                                     |
| --------------- | ---------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **wait**        | `number`                     | `100`         | 延迟时间，如果在 `wait` 时间内持续触发 callback 事件，这些 callback 是不会立即执行的；默认时间为 100ms                                          |
| **start**       | `boolean` or `() => boolean` | `() => false` | 是否开启防抖，默认不开启，需要手动设置开启                                                                                                      |
| **renderCount** | `number` or `undefined`      | `undefined`   | 同一帧执行的 callback 数量；每一帧只会执行 `renderCount`个 callback；默认是全部执行；如果 callback 数量较多，建议根据执行逻辑设置一个合理的数值 |

## How I Did
