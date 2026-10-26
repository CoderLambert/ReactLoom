# B20 Sonner 条目维护

先读根AGENTS、本包AGENTS以及本条目library.json/agent.md/verification.json。只修改B20目录。必须维护Toast的真实业务状态与取消清理：禁止无参数toast.dismiss()清理整个应用；调用真实Sonner SDK而不伪造通知。新增依赖由PLATFORM统一写入，未实测不填写PASS。