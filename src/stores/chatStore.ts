import { defineStore } from "pinia";
import { chatOperate } from "../services/chatService";
import { useAuthStore } from "./authStore";

export const useChatStore = defineStore("chat", {
  state: () => ({
    sessionId: "",
    messages: [] as Array<{ role: string; content: string }>
  }),
  actions: {
    ensureSession() {
      // 会话 ID 以“当前员工 + 时间戳”生成，既能区分不同登录人，又不依赖后端额外下发。
      if (!this.sessionId) {
        const authStore = useAuthStore();
        this.sessionId = `${authStore.user?.employeeId || "anonymous"}-${Date.now()}`;
      }
    },
    async sendMessage(content: string) {
      this.ensureSession();
      this.messages.push({ role: "user", content });
      const data = await chatOperate({
        sessionId: this.sessionId,
        message: content
      });
      this.messages.push({ role: "assistant", content: data.reply || "已受理" });
      return data;
    },
    resetConversation() {
      this.sessionId = "";
      this.messages = [];
    }
  }
});
