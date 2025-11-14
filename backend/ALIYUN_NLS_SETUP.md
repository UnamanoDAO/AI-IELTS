# 阿里云智能语音交互服务开通指南

## 问题说明

如果遇到错误 `ErrCode: 40020503, ErrMsg: "No permission!"`，说明需要先开通智能语音交互服务。

## 开通步骤

### 1. 登录阿里云控制台

访问：https://ecs.console.aliyun.com/

### 2. 开通智能语音交互服务

**方式一：直接访问服务控制台**
- 访问：https://nls.console.aliyun.com/
- 如果未开通，系统会提示开通

**方式二：通过产品搜索**
1. 在控制台顶部搜索框输入"智能语音交互"
2. 点击进入服务页面
3. 点击"立即开通"或"免费试用"

### 3. 配置 AccessKey 权限

确保您的 AccessKey 具有以下权限之一：

**推荐：使用完整权限（最简单）**
- 权限名称：`AliyunNLSFullAccess`
- 权限描述：智能语音交互管理权限

**或者：自定义权限（最小权限）**
需要包含以下权限：
- `nls:CreateToken` - 创建 Token
- `nls:SubmitTask` - 提交语音合成任务
- `nls:GetTaskResult` - 查询任务结果

### 4. 配置 AccessKey 权限的方法

1. 登录阿里云控制台
2. 访问：https://ram.console.aliyun.com/users
3. 找到您的 AccessKey 对应的用户
4. 点击"添加权限"
5. 搜索并添加 `AliyunNLSFullAccess` 权限
6. 点击"确定"完成授权

### 5. 验证配置

配置完成后，等待 1-2 分钟让权限生效，然后重新运行：

```bash
npm run generate-audio 1
```

## 常见问题

### Q: 我已经开通了服务，为什么还是报错？

A: 请检查：
1. AccessKey 是否正确配置在 `.env` 文件中
2. AccessKey 是否具有相应权限（见步骤 3）
3. 权限配置后是否等待了 1-2 分钟让权限生效

### Q: 服务是免费的吗？

A: 智能语音交互服务有免费额度，超出后按量付费。具体价格请查看：
https://www.aliyun.com/price/product#/nls/detail

### Q: 如何查看我的服务使用情况？

A: 访问智能语音交互控制台：https://nls.console.aliyun.com/

## 相关链接

- 智能语音交互控制台：https://nls.console.aliyun.com/
- 权限管理控制台：https://ram.console.aliyun.com/
- 官方文档：https://help.aliyun.com/product/30413.html

