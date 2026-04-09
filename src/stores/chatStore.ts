import { defineStore } from "pinia";
import { chatOperate } from "../services/chatService";

export const useChatStore = defineStore("chat", {
  state: () => ({
    sessionId: "session-001",
    employeeId: "employee-001",
    messages: [] as Array<{ role: string; content: string }>
  }),
  actions: {
    async sendMessage(content: string) {
      this.messages.push({ role: "user", content });
      const data = await chatOperate({
        sessionId: this.sessionId,
        employeeId: this.employeeId,
        message: content
      });
      this.messages.push({ role: "assistant", content: data.reply || "已受理" });
      return data;
    }
  }
});
