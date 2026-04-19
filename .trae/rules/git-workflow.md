# Git 提交流程与规范 (Git Workflow Rules)

每次处理完一个任务（Task）或阶段（Phase）后，必须执行以下操作：

1. **提交所有更改**：将所有修改、新增和删除的文件添加到暂存区。
   ```bash
   git add .
   ```
2. **使用中文编写 Commit Message**：每次 commit 必须使用中文，清晰描述本次任务所做的更改。格式建议：
   - `feat: [新增] xxxx`
   - `fix: [修复] xxxx`
   - `refactor: [重构] xxxx`
   - `docs: [文档] xxxx`
   - `chore: [杂项] xxxx`
   
   ```bash
   git commit -m "类型: [中文描述] 详细说明"
   ```
3. **推送到主分支 (main)**：将本地提交推送到远程主分支。
   ```bash
   git push origin main
   ```

**强制要求**：
- 所有的 commit message 必须使用中文。
- 必须确保 push 成功，以保持远程仓库最新。
