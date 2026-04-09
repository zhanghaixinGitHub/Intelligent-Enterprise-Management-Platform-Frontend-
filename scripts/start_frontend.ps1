$ErrorActionPreference = "Stop"

Write-Output "FrontendStarter.start >>> 切换到前端目录"
Set-Location "d:\webStormProjects\workSpace06"

Write-Output "FrontendStarter.start >>> 安装依赖并启动开发服务"
npm install
npm run dev
