# C13 Frappe Gantt — Agent 工程准则

## 定位
交付任务依赖和进度图可用 Frappe Gantt v1.2.2；若业务是事件日历则比较 C12 FullCalendar。图形编辑应存在键盘/语义表格替代。

## 最小迁移文件
examples/example.tsx 和 examples/gantt.css。导入 frappe-gantt 的主入口，用浅复制任务，创建只读 SVG；将领域校验/并发保存放在独立 service，不把模拟状态逻辑直接复制到生产 API。

## 禁止
不要直接操作原 React 任务对象；不要接受任意 popup HTML；不要丢失稳定 ID；不要因过滤破坏依赖拓扑；不要假设 package exports 暴露 dist/frappe-gantt.css；不要仅看图表动画就认为卸载彻底。

## 验收
图表真实挂载、视图切换、相同任务的键盘编辑、无效日期拒绝/409回滚、StrictMode双挂载/卸载资源观察。Node SDK import 只能证明入口加载，不代表SVG生命周期已验证；源码与证据在 verification.json。

## 资料
https://github.com/frappe/gantt
