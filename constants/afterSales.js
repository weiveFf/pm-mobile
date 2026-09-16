export const abnormalTypes = [
  { label: '交货', value: '交货' },
  { label: '安装', value: '安装' },
  { label: '签收', value: '签收' },
  { label: '验收', value: '验收' },
  { label: '开票', value: '开票' },
  { label: '收款', value: '收款' },
  { label: '售后', value: '售后' },
  { label: '订单合规', value: '订单合规' },
  { label: '客诉', value: '客诉' }
]

export const abnormalToProblems = {
  交货: [
    { label: '无交期', value: '无交期' },
    { label: '交期晚', value: '交期晚' },
    { label: '改交期', value: '改交期' },
    { label: '错发货', value: '错发货' },
    { label: '其它异常', value: '其它异常' }
  ],
  安装: [
    { label: '无排期', value: '无排期' },
    { label: '客户改方案', value: '客户改方案' },
    { label: '辅料短缺', value: '辅料短缺' },
    { label: '安装交付投诉', value: '安装交付投诉' },
    { label: '安装条件差', value: '安装条件差' },
    { label: '其它异常', value: '其它异常' }
  ],
  签收: [
    { label: '客户不签收', value: '客户不签收' },
    { label: '客户不盖章', value: '客户不盖章' },
    { label: '签收不及时', value: '签收不及时' },
    { label: '签收不合规', value: '签收不合规' },
    { label: '其它异常', value: '其它异常' }
  ],
  验收: [
    { label: '验收不及时', value: '验收不及时' },
    { label: '验收不合规', value: '验收不合规' },
    { label: '不提供验收单', value: '不提供验收单' },
    { label: '其它异常', value: '其它异常' }
  ],
  开票: [
    { label: '开票错误', value: '开票错误' },
    { label: '开票不及时', value: '开票不及时' },
    { label: '其它异常', value: '其它异常' }
  ],
  收款: [
    { label: '到期未付', value: '到期未付' },
    { label: '延期未付', value: '延期未付' },
    { label: '其它异常', value: '其它异常' }
  ],
  售后: [
    { label: '通信异常', value: '通信异常' },
    { label: '报警异常', value: '报警异常' },
    { label: '数据不准', value: '数据不准' },
    { label: '不工作', value: '不工作' },
    { label: '功能差异', value: '功能差异' },
    { label: '后台异常', value: '后台异常' },
    { label: '其它异常', value: '其它异常' }
  ],
  订单合规: [
    { label: '订单合同未盖章', value: '订单合同未盖章' },
    { label: 'CRM录入与订单合同不符', value: 'CRM录入与订单合同不符' },
    { label: '正式订单合同未补齐', value: '正式订单合同未补齐' },
    { label: '订单合同条款不清晰', value: '订单合同条款不清晰' },
    { label: '违约风险太大或不公正', value: '违约风险太大或不公正' },
    { label: '其它异常', value: '其它异常' }
  ],
  客诉: [
    { label: '功能异常', value: '功能异常' },
    { label: '交货错误', value: '交货错误' },
    { label: '服务差', value: '服务差' },
    { label: '响应慢', value: '响应慢' },
    { label: '其它异常', value: '其它异常' }
  ]
}

export const urgencyLevels = [
  { label: '特急(1天内)', value: '0', className: 'level-deepred' },
  { label: '加急(3天内)', value: '1', className: 'level-red' },
  { label: '紧急(5天内)', value: '2', className: 'level-orangered' },
  { label: '平急(2周内)', value: '3', className: 'level-yellow' },
  { label: '常规(1月内)', value: '4', className: 'level-lightyellow' },
  { label: '普通(3月内)', value: '5', className: 'level-blue' },
  { label: '不急(3月外)', value: '6', className: 'level-lightblue' }
]
