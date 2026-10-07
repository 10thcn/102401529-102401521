# PSP2.1 表格

> 预估耗时在**开始编程前**填写；实际耗时在**编程结束后**如实回填。
> 回填时注意：把返工、调试、排查问题的时间也计入对应阶段（例如排查
> "node --test 目录参数报错"的时间计入 Test 阶段），这样 PSP 才能真正
> 帮助我们发现哪些环节低估了。

| PSP2.1 | Personal Software Process Stages | 预估耗时（分钟） | 实际耗时（分钟） |
| --- | --- | ---: | ---: |
| Planning | 计划 | 30 | 30 |
| Estimate | 估计这个任务需要多少时间 | 20 | 20 |
| Development | 开发 | 750 | 820 |
| Analysis | 需求分析（包括学习新技术） | 60 | 60 |
| Design Spec | 生成设计文档 | 40 | 30 |
| Design Review | 设计复审 | 30 | 30 |
| Coding Standard | 代码规范（为目前的开发制定合适的规范） | 20 | 20 |
| Design | 具体设计 | 60 | 80 |
| Coding | 具体编码 | 360 | 400 |
| Code Review | 代码复审 | 60 | 80 |
| Test | 测试（自我测试，修改代码，提交修改） | 120 | 120 |
| Reporting | 报告 | 120 | 100 |
| Test Report | 测试报告 | 60 | 40 |
| Size Measurement | 计算工作量 | 15 | 10 |
| Postmortem & Process Improvement Plan | 事后总结，并提出过程改进计划 | 45 | 50 |
| 合计 | | 920 | 970 |


# 偏差分析的核心结论
总耗时 970 vs 预估 920，+50 分钟（+5.4%），整体可控，但偏差方向很有规律：

实现类系统性超时：Coding +40（原型是静态的，交互调试被低估）、Code Review +20（复审发现接口不一致的返工）、Design +20（store.js 双环境设计反复推敲）

文档类系统性节省：Test Report -20（node:test 报告现成 + 博客已整理过思路）、Design Spec -10（沿用第一次作业原型规格）、Size Measurement -5（脚本化统计）

# 改进计划
Coding 预估按"原型工作量 × 1.5"，交互调试单列

接口先行：store.js 函数签名清单纳入 Design 产出，减少复审返工

docs/ 模板库复用，文档类预估按实际值下调

Test 保留 10%~20% 返工 buffer

度量继续脚本化（扩展到代码行数统计）
