import { createPinia } from "pinia";

// 单独导出 pinia 实例，解决路由守卫里需要提前访问 store 的问题。
export const pinia = createPinia();

