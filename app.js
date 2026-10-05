const KEY = 'mah_cam_stock_v3';
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const today = () => new Date().toISOString().slice(0,10);
const dateFmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(Number(n)||0);
const uid = p => `${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const seed = {
  products:[
    {id:uid('p'),sku:'CANON-80D',name:'Canon EOS 80D Body',category:'Camera',cost:52000,price:65000,stock:4},
    {id:uid('p'),sku:'SONY-A7IV',name:'Sony Alpha A7 IV',category:'Camera',cost:185000,price:210000,stock:3},
    {id:uid('p'),sku:'CANON-R6II',name:'Canon EOS R6 Mark II',category:'Camera',cost:215000,price:245000,stock:2},
    {id:uid('p'),sku:'SONY-2470GM2',name:'FE 24-70mm F2.8 GM II',category:'Lens',cost:215000,price:245000,stock:4},
    {id:uid('p'),sku:'RODE-WPRO',name:'Wireless PRO Microphone',category:'Microphone',cost:36000,price:45000,stock:2}
  ],
  purchases:[], sales:[], returns:[], customers:[{id:uid('c'),name:'Walk-in Customer',phone:'',address:''}], suppliers:[], expenses:[]
};
let db = JSON.parse(localStorage.getItem(KEY) || 'null') || seed;
let page = 'dashboard';
const save = () => localStorage.setItem(KEY, JSON.stringify(db));
const product = sku => db.products.find(p => p.sku === sku);
const stockRows = () => db.products.reduce((a,p) => { let x=a.find(r=>r.sku===p.sku); if(!x){x={...p,qty:0,value:0};a.push(x)} x.qty += Number(p.stock)||0; x.value += (Number(p.stock)||0)*(Number(p.cost)||0); return a; },[]);
const stock = sku => stockRows().find(p=>p.sku===sku)?.qty || 0;
const sum = (arr,fn) => arr.reduce((n,x)=>n+(Number(fn(x))||0),0);

function toast(msg){ const t=$('#toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }
function setPage(p){ page=p; render(); }
function card(label,value,sub,cls){ return `<div class="card kpi ${cls}"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`; }
function table(headers, rows, empty='No records found.'){ return `<div class="tablewrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`; }
function modal(title, body, onSubmit){
  $('#modalbody').innerHTML = `<h2>${title}</h2><form id="modalForm">${body}<div class="actions"><button type="button" class="btn secondary" id="modalCancel">Cancel</button><button class="btn">Save</button></div></form>`;
  $('#modal').classList.remove('hidden');
  $('#modalCancel').onclick=closeModal;
  $('#modalForm').onsubmit=e=>{e.preventDefault(); onSubmit(new FormData(e.target)); closeModal(); save(); render();};
}
function closeModal(){ $('#modal').classList.add('hidden'); }
function fields(arr){ return `<div class="formgrid">${arr.map(([n,l,t,v='',req=true])=>`<div class="field ${t==='textarea'?'full':''}"><label>${l}</label>${t==='textarea'?`<textarea class="input" name="${n}" ${req?'required':''}>${esc(v)}</textarea>`:`<input class="input" name="${n}" type="${t}" value="${esc(v)}" ${req?'required':''}>`}</div>`).join('')}</div>`; }

function dashboard(){
  const rows=stockRows(), qty=sum(rows,x=>x.qty), value=sum(rows,x=>x.value);
  const sales=sum(db.sales,x=>x.total), gross=sum(db.sales,x=>x.profit), returns=sum(db.returns,x=>x.profitLoss), expenses=sum(db.expenses,x=>x.amount);
  const net=gross-returns-expenses, due=sum(db.sales,x=>x.due);
  const dues=db.sales.filter(x=>x.due>0).slice(-8).reverse();
  const low=rows.filter(x=>x.qty<=3);
  return `<div class="grid kpis">${card('Total Sales',money(sales),`${db.sales.length} orders recorded`,'blue')}${card('Net Profit',money(net),'After returns & expenses','green')}${card('Customer Due',money(due),'Outstanding payments','yellow')}${card('Stock Quantity',qty+' pcs','Total physical units','purple')}${card('Stock Value',money(value),'At purchase cost','red')}</div>
  <div class="grid two"><div class="card"><div class="head"><h2>Customer Due List</h2></div>${dues.length?dues.map(x=>`<div class="listrow"><div><div class="name">${esc(x.customer||'Walk-in Customer')}</div><div class="meta">${esc(x.orderNo)} · ${dateFmt(x.date)}</div></div><b class="money-due">${money(x.due)}</b></div>`).join(''):'<div class="empty">No outstanding customer dues.</div>'}</div>
  <div class="card"><div class="head"><h2>Low Stock Alerts</h2></div>${low.length?low.map(x=>`<div class="listrow"><div><div class="name">${esc(x.name)}</div><div class="meta">${esc(x.sku)}</div></div><span class="badge ${x.qty?'yellow':'red'}">${x.qty} left</span></div>`).join(''):'<div class="empty">All stock levels look healthy.</div>'}</div></div>
  <div class="card section-gap"><div class="head"><h2>Recent Orders</h2></div>${table(['Date','Order','Marketplace','SKU','Total','Profit'],db.sales.slice(-8).reverse().map(x=>`<tr><td>${dateFmt(x.date)}</td><td><b>${esc(x.orderNo)}</b></td><td><span class="badge blue">${esc(x.marketplace)}</span></td><td>${esc(x.sku)}</td><td>${money(x.total)}</td><td><span class="badge green">${money(x.profit)}</span></td></tr>`))}</div>`;
}
function products(){
 const rows=stockRows(); return `<div class="toolbar"><input id="productSearch" class="search" placeholder="Search SKU or product..."><button class="btn" id="addProduct">+ Add Product</button></div><div class="card">${table(['SKU','Product','Category','Quantity','Cost','Price','Stock Value'],rows.map(x=>`<tr><td><b>${esc(x.sku)}</b></td><td>${esc(x.name)}</td><td>${esc(x.category||'—')}</td><td><b>${x.qty} pcs</b></td><td>${money(x.cost)}</td><td>${money(x.price)}</td><td>${money(x.value)}</td></tr>`))}</div>`;
}
function buying(){return `<div class="toolbar"><button class="btn" id="addBuying">+ Record Buying</button></div><div class="card">${table(['Date','SKU','Product','Qty','Unit Cost','Supplier'],db.purchases.slice().reverse().map(x=>`<tr><td>${dateFmt(x.date)}</td><td>${esc(x.sku)}</td><td>${esc(x.name)}</td><td>${x.qty}</td><td>${money(x.cost)}</td><td>${esc(x.supplier||'—')}</td></tr>`))}</div>`;}
function sales(){
 const options=stockRows().map(p=>`<option value="${esc(p.sku)}">${esc(p.sku)} — ${esc(p.name)} (${p.qty} pcs)</option>`).join('');
 return `<div class="card"><div class="head"><h2>New Sale</h2><span class="muted">Moscow, Russia</span></div><form id="saleForm">${fields([['orderNo','Order Number','text',`ORD-${Date.now().toString().slice(-6)}`],['date','Sale Date','date',today()],['customer','Customer','text','Walk-in Customer'],['sku','SKU','text','',false],['qty','Quantity','number','1'],['price','Selling Price (RUB)','number','0'],['paid','Paid (RUB)','number','0']])}<div class="field full"><label>Marketplace</label><select class="select" name="marketplace"><option>Ozon</option><option>Yandex Market</option><option>Wildberries</option><option>Avito</option><option>Direct Store</option><option>Other</option></select></div><div class="notice">You can sell any quantity up to the available stock. Serial numbers are not required.</div><div class="actions"><button class="btn">Complete Sale & Create Invoice</button></div></form></div>`;
}
function returns(){return `<div class="card"><div class="head"><h2>Product Returns</h2><span class="muted">Search by SKU to find the original sale date</span></div><form id="returnForm">${fields([['sku','SKU','text','',true],['qty','Return Quantity','number','1'],['date','Return Date','date',today()]] )}<div id="returnInfo" class="notice">Enter a SKU to see matching sale history.</div><div class="field"><label>Original Order</label><select class="select" id="returnOrder" name="orderNo"><option value="">No sale selected</option></select></div><div class="actions"><button class="btn danger">Process Return</button></div></form></div><div class="card section-gap">${table(['Return Date','SKU','Order','Original Sale Date','Qty','Profit Impact'],db.returns.slice().reverse().map(x=>`<tr><td>${dateFmt(x.date)}</td><td>${esc(x.sku)}</td><td>${esc(x.orderNo)}</td><td>${dateFmt(x.saleDate)}</td><td>${x.qty}</td><td class="negative">-${money(x.profitLoss)}</td></tr>`))}</div>`;}
function customers(){return `<div class="toolbar"><button class="btn" id="addCustomer">+ Add Customer</button></div><div class="card">${table(['Name','Phone','Address','Orders','Due'],db.customers.map(c=>{const ss=db.sales.filter(s=>s.customer===c.name);return `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.phone)}</td><td>${esc(c.address||'—')}</td><td>${ss.length}</td><td>${money(sum(ss,x=>x.due))}</td></tr>`;}))}</div>`;}
function suppliers(){return `<div class="toolbar"><button class="btn" id="addSupplier">+ Add Supplier</button></div><div class="card">${table(['Supplier','Phone','Company','Purchases'],db.suppliers.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.phone)}</td><td>${esc(s.company||'—')}</td><td>${db.purchases.filter(x=>x.supplier===s.name).length}</td></tr>`))}</div>`;}
function inventory(){return `<div class="card"><div class="toolbar"><input id="invSearch" class="search" placeholder="Search SKU or product..."></div><div id="inventoryTable">${table(['SKU','Product','Quantity','Unit Cost','Stock Value','Status'],stockRows().map(x=>`<tr><td><b>${esc(x.sku)}</b></td><td>${esc(x.name)}</td><td><b>${x.qty} pcs</b></td><td>${money(x.cost)}</td><td>${money(x.value)}</td><td><span class="badge ${x.qty===0?'red':x.qty<=3?'yellow':'green'}">${x.qty===0?'Out of stock':x.qty<=3?'Low stock':'Available'}</span></td></tr>`))}</div></div>`;}
function expenses(){return `<div class="toolbar"><button class="btn" id="addExpense">+ Add Expense</button></div><div class="card">${table(['Date','Category','Description','Amount'],db.expenses.slice().reverse().map(x=>`<tr><td>${dateFmt(x.date)}</td><td>${esc(x.category)}</td><td>${esc(x.description)}</td><td>${money(x.amount)}</td></tr>`))}</div>`;}
function reports(){const by={};db.sales.forEach(s=>{const m=(s.date||'').slice(0,7);by[m]??={sales:0,profit:0,orders:0};by[m].sales+=s.total;by[m].profit+=s.profit;by[m].orders++});return `<div class="card"><div class="head"><h2>Monthly Profit Report</h2><span class="muted">Month-by-month totals</span></div>${table(['Month','Orders','Sales','Gross Profit','Returns','Expenses','Net Profit'],Object.entries(by).sort().reverse().map(([m,v])=>{const ret=sum(db.returns.filter(x=>(x.date||'').slice(0,7)===m),x=>x.profitLoss);const exp=sum(db.expenses.filter(x=>(x.date||'').slice(0,7)===m),x=>x.amount);return `<tr><td><b>${m}</b></td><td>${v.orders}</td><td>${money(v.sales)}</td><td>${money(v.profit)}</td><td class="negative">-${money(ret)}</td><td>${money(exp)}</td><td><b>${money(v.profit-ret-exp)}</b></td></tr>`;}))}</div>`;}

const views={dashboard,products,buying,sales,returns,customers,suppliers,inventory,expenses,reports};
function render(){
 $('#title').textContent=page==='sales'?'New Sale':page[0].toUpperCase()+page.slice(1);
 $('#date').textContent=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
 document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 $('#content').innerHTML=(views[page]||dashboard)();
 bind();
}
function bind(){
 document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>setPage(b.dataset.page));
 $('#addProduct')?.addEventListener('click',()=>modal('Add Product',fields([['sku','SKU','text',''],['name','Product Name','text',''],['category','Category','text','Camera'],['cost','Purchase Cost (RUB)','number','0'],['price','Selling Price (RUB)','number','0'],['stock','Opening Quantity','number','0']]),f=>db.products.push({id:uid('p'),sku:f.get('sku').trim(),name:f.get('name').trim(),category:f.get('category'),cost:+f.get('cost'),price:+f.get('price'),stock:+f.get('stock')})));
 $('#addBuying')?.addEventListener('click',()=>modal('Record Buying',fields([['date','Buying Date','date',today()],['sku','SKU','text',''],['name','Product Name','text',''],['qty','Quantity','number','1'],['cost','Unit Cost (RUB)','number','0'],['supplier','Supplier','text','']],),f=>{let p=product(f.get('sku'));if(!p){p={id:uid('p'),sku:f.get('sku').trim(),name:f.get('name').trim(),category:'',cost:+f.get('cost'),price:+f.get('cost'),stock:0};db.products.push(p)}p.stock+=+f.get('qty');p.cost=+f.get('cost');db.purchases.push({date:f.get('date'),sku:p.sku,name:p.name,qty:+f.get('qty'),cost:+f.get('cost'),supplier:f.get('supplier')})}));
 $('#saleForm')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),p=product(f.get('sku')),q=+f.get('qty'),price=+f.get('price');if(!p)return alert('SKU not found.');if(q<=0||stock(p.sku)<q)return alert(`Only ${stock(p.sku)} pcs available.`);const total=q*price,cost=q*p.cost,paid=+f.get('paid');const s={id:uid('sale'),orderNo:f.get('orderNo'),date:f.get('date'),marketplace:f.get('marketplace'),customer:f.get('customer'),sku:p.sku,name:p.name,qty:q,price,total,cost,profit:total-cost,paid,due:Math.max(0,total-paid)};p.stock-=q;db.sales.push(s);save();render();showInvoice(s);});
 const saleSku=$('#saleForm input[name="sku"]'); if(saleSku){saleSku.addEventListener('input',()=>{const p=product(saleSku.value.trim());const price=$('#saleForm input[name="price"]');if(p&&price&&!price.value)price.value=p.price;});}
 const rs=$('#returnForm input[name="sku"]'); if(rs)rs.addEventListener('input',()=>updateReturnOptions());
 $('#returnForm')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),s=db.sales.find(x=>x.orderNo===f.get('orderNo')&&x.sku===f.get('sku')),p=product(f.get('sku')),q=+f.get('qty');if(!s||!p)return alert('Original sale not found. Search the SKU first.');if(q<=0||q>s.qty)return alert('Invalid return quantity.');p.stock+=q;const impact=Math.max(0,(s.price-p.cost)*q);db.returns.push({id:uid('ret'),date:f.get('date'),sku:s.sku,orderNo:s.orderNo,saleDate:s.date,qty:q,profitLoss:impact});save();render();toast('Return recorded successfully.');});
 $('#addCustomer')?.addEventListener('click',()=>modal('Add Customer',fields([['name','Customer Name','text',''],['phone','Phone','text',''],['address','Address','text','']]),f=>db.customers.push({id:uid('c'),name:f.get('name'),phone:f.get('phone'),address:f.get('address')})));
 $('#addSupplier')?.addEventListener('click',()=>modal('Add Supplier',fields([['name','Supplier Name','text',''],['phone','Phone','text',''],['company','Company','text','']]),f=>db.suppliers.push({id:uid('s'),name:f.get('name'),phone:f.get('phone'),company:f.get('company')})));
 $('#addExpense')?.addEventListener('click',()=>modal('Add Expense',fields([['date','Date','date',today()],['category','Category','text',''],['description','Description','text',''],['amount','Amount (RUB)','number','0']]),f=>db.expenses.push({id:uid('e'),date:f.get('date'),category:f.get('category'),description:f.get('description'),amount:+f.get('amount')})));
 $('#productSearch')?.addEventListener('input',e=>filterProductTable(e.target.value));
 $('#invSearch')?.addEventListener('input',e=>filterInventory(e.target.value));
}
function updateReturnOptions(){const sku=$('#returnForm input[name="sku"]')?.value.trim();const matches=db.sales.filter(s=>s.sku===sku);const sel=$('#returnOrder');if(!sel)return;sel.innerHTML=matches.length?matches.map(s=>`<option value="${esc(s.orderNo)}">${esc(s.orderNo)} — sold ${dateFmt(s.date)} — ${esc(s.marketplace)}</option>`).join(''):'<option value="">No matching sale</option>';$('#returnInfo').innerHTML=matches.length?`Original sale date: <b>${dateFmt(matches[0].date)}</b> · ${matches.length} matching order(s) found.`:'Enter a SKU to see matching sale history.';}
function filterProductTable(q){q=q.toLowerCase();const data=stockRows().filter(x=>(x.sku+' '+x.name+' '+(x.category||'')).toLowerCase().includes(q));$('#productSearch').closest('.toolbar').nextElementSibling.innerHTML=table(['SKU','Product','Category','Quantity','Cost','Price','Stock Value'],data.map(x=>`<tr><td><b>${esc(x.sku)}</b></td><td>${esc(x.name)}</td><td>${esc(x.category||'—')}</td><td><b>${x.qty} pcs</b></td><td>${money(x.cost)}</td><td>${money(x.price)}</td><td>${money(x.value)}</td></tr>`));}
function filterInventory(q){q=q.toLowerCase();const data=stockRows().filter(x=>(x.sku+' '+x.name).toLowerCase().includes(q));$('#inventoryTable').innerHTML=table(['SKU','Product','Quantity','Unit Cost','Stock Value','Status'],data.map(x=>`<tr><td><b>${esc(x.sku)}</b></td><td>${esc(x.name)}</td><td><b>${x.qty} pcs</b></td><td>${money(x.cost)}</td><td>${money(x.value)}</td><td><span class="badge ${x.qty===0?'red':x.qty<=3?'yellow':'green'}">${x.qty===0?'Out of stock':x.qty<=3?'Low stock':'Available'}</span></td></tr>`));}
function showInvoice(s){
 $('#modalbody').innerHTML=`<div class="invoice"><div class="invoicehead"><div><div class="invoicebrand">Mahmud Camera Stock</div><small>CAMERA · PHOTO · VIDEO</small></div><div class="invoice-meta"><b>INVOICE</b><br>Order: ${esc(s.orderNo)}<br>Date: ${dateFmt(s.date)}<br>${esc(s.marketplace)}<br>Moscow, Russia</div></div><div class="invoice-customer"><b>Customer</b><br>${esc(s.customer||'Walk-in Customer')}</div>${table(['SKU','Product','Qty','Unit Price','Total'],[`<tr><td>${esc(s.sku)}</td><td>${esc(s.name)}</td><td>${s.qty}</td><td>${money(s.price)}</td><td>${money(s.total)}</td></tr>`])}<div class="invoice-total">${money(s.total)}</div><p>Paid: ${money(s.paid)} · Due: ${money(s.due)}</p><div class="invoice-footer">Thank you for choosing Mahmud Camera Stock.</div></div><div class="actions"><button class="btn" id="printInvoice">Print Invoice</button><button class="btn secondary" id="closeInvoice">Close</button></div>`;$('#modal').classList.remove('hidden');$('#printInvoice').onclick=()=>window.print();$('#closeInvoice').onclick=closeModal;
}
$('#close').onclick=closeModal;$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal();};
render();
