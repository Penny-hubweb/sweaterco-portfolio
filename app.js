'use strict';
// Curated illustration only. This file does not contain the team's allocator.
const scenes = {
  dispatch: {
    title: 'A complete dispatch request', label: 'Ready to propose', tone: '',
    request: '“Sample batch P-101: 400 tops, needed by 18 April. Which workshop can take it?”',
    heading: 'Proposed: Workshop A',
    reason: 'The sample candidate can make this category and accepts the batch size. In this illustration, its rework scenario still fits the due date.',
    facts: [['Expected return', '14 April'], ['If reworked', '16 April'], ['Requested due date', '18 April']],
    tools: '<code>resolve → eligibility → queue → estimate → rank</code><p>These are illustrative tool stages. In the implemented system, Python supplies the candidate facts, dates and ranking. A recommendation does not itself write to the ledger.</p>',
    action: 'Confirm sample recommendation', actionType: 'confirm'
  },
  clarify: {
    title: 'An ambiguous order reference', label: 'Ask requester', tone: 'blue',
    request: '“Can you send out the cardigan order today?”',
    heading: 'Clarify before choosing a workshop',
    reason: 'More than one order could match this description. Ask for an order ID rather than guessing which batch to allocate.',
    facts: [['Routing outcome', 'Clarify'], ['Next step', 'Request order ID'], ['Capacity reserved', 'None']],
    tools: '<code>resolve_order → multiple candidates → clarify</code><p>A question to the requester leaves the capacity ledger unchanged. Candidate counts and identities in a real request come from the order records.</p>',
    action: 'Show the sample clarification', actionType: 'clarify'
  },
  refuse: {
    title: 'A workshop that cannot accept the batch', label: 'Constraint conflict', tone: 'amber',
    request: '“Please send 500 tops to Workshop B.”',
    heading: 'Refuse the nominated workshop',
    reason: 'In this sample, Workshop B has a 300-piece batch limit. Explain the eligibility conflict and leave any alternative allocation for explicit review.',
    facts: [['Requested batch', '500 pieces'], ['Sample batch limit', '300 pieces'], ['Capacity reserved', 'None']],
    tools: '<code>eligibility → max_batch exceeded → refuse</code><p>The implemented eligibility checks cover workshop status, product capability and batch limits. A refusal is distinct from silently assigning another workshop.</p>',
    action: 'Show the sample constraint reply', actionType: 'refuse'
  },
  decline: {
    title: 'A question outside the available data', label: 'Out of data scope', tone: 'blue',
    request: '“What price did the customer agree to pay for this order?”',
    heading: 'State what the desk cannot answer',
    reason: 'Workshop charges are not customer selling prices. The desk should say the requested information is unavailable instead of inventing a commercial answer.',
    facts: [['Routing outcome', 'Decline to answer'], ['Missing data', 'Customer price'], ['Capacity reserved', 'None']],
    tools: '<code>scope check → not_in_data → decline-to-answer</code><p>Being explicit about absent data is part of the system behaviour. It is evaluated separately from whether a batch can be allocated.</p>',
    action: 'Show the sample scope reply', actionType: 'decline'
  }
};
let activeScene = 'dispatch';
let sampleConfirmed = false;
const sceneBody = document.getElementById('scene-body');
const feedback = document.getElementById('demo-feedback');
function renderScene() {
  const s = scenes[activeScene];
  sceneBody.innerHTML = `<div class="request-heading"><h3>${s.title}</h3><span class="status-pill ${s.tone}">${s.label}</span></div><blockquote class="request-quote" style="margin-left:0;margin-right:0">${s.request}</blockquote><div class="sample-result ${s.tone}"><h4>${s.heading}</h4><p>${s.reason}</p></div><dl class="demo-facts">${s.facts.map(([key,value])=>`<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl><details class="tool-details"><summary>Inspect the reasoning boundary</summary><div style="padding-top:10px">${s.tools}</div></details><button class="button primary demo-action" id="scene-action" type="button" ${activeScene === 'dispatch' && sampleConfirmed ? 'disabled' : ''}>${activeScene === 'dispatch' && sampleConfirmed ? 'Sample recommendation confirmed' : s.action}</button>`;
  document.querySelectorAll('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === activeScene)));
  document.getElementById('scene-action').addEventListener('click', handleAction);
  feedback.textContent = activeScene === 'dispatch' && sampleConfirmed ? 'Demo ledger: P-101 → Workshop A. No real order has been dispatched.' : '';
}
function handleAction() {
  if(activeScene === 'dispatch') {
    if(sampleConfirmed) return;
    sampleConfirmed = true;
    document.getElementById('ledger-summary').textContent = '1 sample confirmation · P-101';
    renderScene();
  } else {
    const replies = {
      clarify: 'Sample reply: “Which order ID do you mean? I need a specific order before recommending a workshop.” Ledger unchanged.',
      refuse: 'Sample reply: “Workshop B cannot accept this 500-piece batch: its sample limit is 300. Please review an eligible alternative.” Ledger unchanged.',
      decline: 'Sample reply: “Customer selling prices are not in the available order and workshop data, so I cannot answer that reliably.” Ledger unchanged.'
    };
    feedback.textContent = replies[activeScene];
  }
}
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{activeScene = button.dataset.scene;renderScene();}));
document.getElementById('reset-demo').addEventListener('click',()=>{
  sampleConfirmed = false;activeScene = 'dispatch';
  document.getElementById('ledger-summary').textContent = '0 sample confirmations';
  renderScene();feedback.textContent = 'Demo reset. No sample confirmations remain.';
});
const allocation = [
  {name:'Earliest finish',detail:'Simple rule baseline',normal:[1.667,.178,8.26],shock:[1.917,.191]},
  {name:'Rework-aware specialist-first',detail:'lateness · round 2',normal:[1.667,.091,9.251],shock:[2,.104]},
  {name:'Use available slack',detail:'use_slack',normal:[1,.066,13.971],shock:[1.667,.101]}
];
document.querySelectorAll('[data-condition]').forEach(button=>button.addEventListener('click',()=>{
  const condition = button.dataset.condition;
  document.querySelectorAll('[data-condition]').forEach(b=>b.setAttribute('aria-pressed',String(b === button)));
  document.getElementById('allocator-caption').textContent = `${condition === 'normal' ? 'Normal condition' : 'Shock scenario'} · deterministic allocation policies`;
  document.getElementById('allocator-rows').innerHTML = allocation.map(policy=>{
    const v = policy[condition];
    return `<tr><th scope="row">${policy.name}<span>${policy.detail}</span></th><td>${v[0].toFixed(2)}%</td><td>${v[1].toFixed(3)}</td><td>${condition === 'normal' ? `${v[2].toFixed(2)} days` : 'Not reported here'}</td></tr>`;
  }).join('');
  document.getElementById('allocator-takeaway').innerHTML = condition === 'normal' ? '<strong>On official data, the round-2 lateness policy ties the simple rule at 1.67%.</strong> It reduces mean late days from 0.178 to 0.091 while increasing mean turnaround from 8.26 to 9.25 days. This is a trade-off, not an across-the-board win.' : '<strong>Under shock, the round-2 lateness policy has a slightly higher late rate: 2.00% versus 1.92%.</strong> Its mean late days are lower, 0.104 versus 0.191. The estimator does not anticipate the closure shock; these are simulator results, not delivery guarantees.';
}));
renderScene();
