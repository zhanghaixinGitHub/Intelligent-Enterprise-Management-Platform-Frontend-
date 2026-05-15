import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,  // 添加这行来指定端口
    /*
      为什么这样改：
      1. 浏览器当前页面源是 localhost:5173，而后端接口地址是 127.0.0.1:8002，主机名不同会被判定为跨域；
      2. 通过 Vite 开发代理把 /api 请求在本地开发阶段转发到后端，浏览器只感知为“请求当前站点”，因此不会再触发 CORS 拦截；
      3. changeOrigin 用于把转发请求的 Host 改为目标服务，降低部分后端或网关对 Host 校验带来的兼容性问题。
    */
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8002",
        changeOrigin: true
      }
    }
  }
});
