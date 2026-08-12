(function(){
  'use strict';

  var D=window.__MAC_CHECK_DATA__;
  var root=document.getElementById('app');
  var storeKey='maccheck:v2:'+D.session.sessionId;
  var symbols={PASS:'✓',NOTICE:'!',WARNING:'!',BLOCKER:'!',UNKNOWN:'?',UNSUPPORTED:'—',SKIPPED:'—',NOT_STARTED:'○',RUNNING:'…'};
  var glyphs={overview:'▦',device:'▣',battery:'▱',security:'◇',storage:'▰',network:'◉',peripherals:'⌁',keyboard:'⌨',display:'▣',audio:'◖',microphone:'⌇',camera:'◉',touchid:'◎',trackpad:'◫',ports:'↯'};
  var state={route:'overview',dirty:false,storage:true,hardware:{}};
  var cleanup=null;

  D.session.interactivePlan.forEach(function(p){state.hardware[p.id]={status:p.initialStatus,details:{},updatedAt:null};});
  try{
    var saved=localStorage.getItem(storeKey);
    if(saved&&confirm(t('dialog.recover'))){var parsed=JSON.parse(saved);if(parsed.hardware)state.hardware=parsed.hardware;}
  }catch(_){state.storage=false;}

  function t(key,vars){var text=D.strings[key]||key;Object.keys(vars||{}).forEach(function(k){text=text.replace(new RegExp('\\{'+k+'\\}','g'),String(vars[k]));});return text;}
  function h(tag,attrs,children){
    var el=document.createElement(tag);
    Object.keys(attrs||{}).forEach(function(k){
      if(k==='class')el.className=attrs[k];
      else if(k==='text')el.textContent=attrs[k];
      else if(k==='on')Object.keys(attrs[k]).forEach(function(e){el.addEventListener(e,attrs[k][e]);});
      else if(k==='checked')el.checked=attrs[k];
      else if(k==='disabled')el.disabled=attrs[k];
      else el.setAttribute(k,attrs[k]);
    });
    (children||[]).forEach(function(c){if(c!==null&&c!==undefined)el.appendChild(typeof c==='string'?document.createTextNode(c):c);});
    return el;
  }
  function button(key,fn,kind){return h('button',{class:'button '+(kind||''),type:'button',text:t(key),on:{click:fn}});}
  function statusBadge(status){return h('span',{class:'badge '+status,text:t('status.'+status)});}
  function icon(id){return h('span',{class:'item-icon icon-'+id,text:glyphs[id]||'•'});}
  function toast(key){var el=h('div',{class:'toast',text:t(key)});document.body.appendChild(el);setTimeout(function(){el.remove();},2400);}
  function save(){state.dirty=true;try{localStorage.setItem(storeKey,JSON.stringify({hardware:state.hardware,savedAt:new Date().toISOString()}));if(!state.storage){state.storage=true;toast('message.saved');}}catch(_){state.storage=false;toast('message.storage');}renderNav();}
  function setResult(id,status,details){state.hardware[id]={status:status,details:details||{},updatedAt:new Date().toISOString()};save();renderPage();}
  function applicable(){return D.session.interactivePlan.filter(function(p){return p.initialStatus!=='UNSUPPORTED';});}
  function completedStatus(s){return ['PASS','NOTICE','WARNING','BLOCKER','UNKNOWN','SKIPPED'].indexOf(s)>=0;}
  function combined(){return D.system.checks.concat(Object.keys(state.hardware).map(function(id){var x=state.hardware[id];return{id:'hardware.'+id,group:id,titleKey:'nav.'+id,status:x.status,severity:x.status==='WARNING'?'HIGH':'LOW',evidence:'GUIDED_INTERACTION',confidence:x.status==='PASS'?'MEDIUM':'LOW',displayValue:hardwareSummary(id,x),limitations:[],checkedAt:x.updatedAt,details:x.details};}));}
  function counts(){var out={PASS:0,NOTICE:0,WARNING:0,BLOCKER:0,UNKNOWN:0,UNSUPPORTED:0,SKIPPED:0,NOT_STARTED:0,RUNNING:0};combined().forEach(function(x){if(out[x.status]!==undefined)out[x.status]++;});return out;}
  function worst(statuses){var rank={BLOCKER:8,WARNING:7,NOTICE:6,UNKNOWN:5,RUNNING:4,NOT_STARTED:3,SKIPPED:2,UNSUPPORTED:1,PASS:0},value='PASS';statuses.forEach(function(s){if((rank[s]||0)>(rank[value]||0))value=s;});return statuses.length?value:'UNKNOWN';}
  function go(route){if(cleanup){cleanup();cleanup=null;}state.route=route;renderPage();window.scrollTo(0,0);}

  function navStatus(id){
    if(id==='overview')return null;
    if(['device','battery','security','storage','network','peripherals'].indexOf(id)>=0)return worst(D.system.checks.filter(function(c){return c.group===id;}).map(function(c){return c.status;}));
    return state.hardware[id]?state.hardware[id].status:null;
  }
  function navButton(id){var st=navStatus(id);return h('button',{class:'nav-item '+(state.route===id?'active':''),type:'button',on:{click:function(){go(id);}}},[icon(id),h('span',{class:'nav-text',text:t('nav.'+id)}),st?h('span',{class:'nav-state '+st,text:symbols[st]}):h('span')]);}
  function navGroup(label,ids){return h('div',{class:'nav-group'},[h('div',{class:'nav-label',text:t(label)})].concat(ids.map(navButton)));}
  function sidebar(){
    return h('aside',{class:'sidebar'},[
      h('div',{class:'traffic'},[h('i',{class:'red'}),h('i',{class:'yellow'}),h('i',{class:'green'})]),
      h('div',{class:'brand'},[h('div',{class:'brand-mark',text:'M'}),h('div',{},[h('h1',{text:t('app.title')}),h('p',{text:t('app.subtitle')})])]),
      navButton('overview'),
      navGroup('group.base',['device','battery','security','storage','network','peripherals']),
      navGroup('group.hardware',D.checks.hardwareOrder),
      h('div',{class:'side-foot'},[h('span',{class:'side-shield',text:'✓'}),h('span',{text:t('sidebar.private')})])
    ]);
  }
  function shell(){root.textContent='';root.appendChild(h('div',{class:'app'},[sidebar(),h('main',{class:'content',id:'content'})]));}
  function renderNav(){var old=document.querySelector('.sidebar');if(old)old.replaceWith(sidebar());}
  function pageHead(title,desc,badge){return h('div',{class:'page-head'},[h('div',{},[h('h2',{text:title}),desc?h('p',{class:'lede',text:desc}):h('span')]),badge||h('span')]);}
  function formatBytes(n){if(!n)return t('value.unknown');var u=['B','KB','MB','GB','TB'],i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),4);return(n/Math.pow(1024,i)).toFixed(i>2?1:0)+' '+u[i];}
  function serial(){return D.facts.device.serialNumber||D.facts.device.serialMasked||t('value.unknown');}
  function deviceName(){return D.capabilities.marketingName||[D.facts.device.modelName,D.facts.device.modelIdentifier].filter(Boolean).join(' · ');}
  function osLabel(){var version=D.facts.device.macOSVersion||'';return /^macOS\b/i.test(version)?version:(version?'macOS '+version:'');}
  function yesNo(v){return v===true?t('value.yes'):(v===false?t('value.no'):t('value.unknown'));}
  function stateWord(v){return v==='ENABLED'||v==='ON'?t('value.enabled'):(v==='DISABLED'||v==='OFF'?t('value.disabled'):t('value.unknown'));}
  function friendly(check){
    var v=check.observedValue||{},zh=D.session.locale==='zh-CN';
    switch(check.id){
      case'device.identity':return [D.facts.device.modelName,D.facts.device.chip,D.facts.device.memoryDisplay].filter(Boolean).join(' · ');
      case'device.serial-consistency':return check.status==='BLOCKER'?(zh?'两处读取到的序列号不一致，请暂停交易并核对机身与系统信息':'Serial numbers do not match; stop and verify the device'):(zh?'序列号 '+serial()+'，'+(v.sources||0)+' 处系统信息'+(v.sources===2?'一致':'已读取'):'Serial '+serial()+' · '+(v.sources||0)+' source(s) checked');
      case'battery.health':return v.capacityRatio===null||v.capacityRatio===undefined?(zh?'未能读取电池最大容量':'Maximum capacity unavailable'):(zh?'最大容量约 '+Math.round(v.capacityRatio*100)+'%，循环 '+(v.cycleCount===null?'未知':v.cycleCount)+' 次':'About '+Math.round(v.capacityRatio*100)+'% maximum capacity · '+v.cycleCount+' cycles');
      case'battery.presence':return zh?'此机型没有内置电池':'No built-in battery on this model';
      case'security.management':return check.status==='BLOCKER'?(zh?'检测到组织管理或自动注册配置':'Organization management or automated enrollment found'):(zh?'未发现 MDM 或自动设备注册':'No MDM or automated enrollment found');
      case'security.activation-lock':return check.status==='BLOCKER'?(zh?'“查找我的 Mac”激活锁仍处于开启状态':'Find My Mac Activation Lock is still enabled'):(check.status==='PASS'?(zh?'系统显示激活锁已关闭':'Activation Lock is reported off'):(zh?'系统未返回激活锁状态，请按下方步骤自查':'Activation Lock state unavailable; verify manually'));
      case'security.filevault':return zh?'磁盘加密'+(v.state==='ENABLED'?'已开启':'未开启'):'Disk encryption is '+stateWord(v.state).toLowerCase();
      case'security.sip':return zh?'系统完整性保护'+(v.state==='ENABLED'?'已开启':'未开启'):'System Integrity Protection is '+stateWord(v.state).toLowerCase();
      case'storage.capacity':return zh?'总容量 '+formatBytes(v.totalBytes)+'，可用 '+formatBytes(v.freeBytes):formatBytes(v.totalBytes)+' total · '+formatBytes(v.freeBytes)+' free';
      case'storage.health':return check.status==='PASS'?(zh?'存储设备自检正常':'Storage self-check passed'):(zh?'存储自检状态：'+(v.smartStatus||'无法读取'):'Storage self-check: '+(v.smartStatus||'unavailable'));
      case'network.wifi':return zh?'Wi-Fi '+(v.power==='ON'?'已开启':'已关闭')+(v.connected===true?'，当前已连接':''):'Wi-Fi '+stateWord(v.power).toLowerCase()+(v.connected===true?' and connected':'');
      case'network.bluetooth':return zh?'蓝牙'+(v.power==='ON'?'已开启':'已关闭'):'Bluetooth '+stateWord(v.power).toLowerCase();
      case'peripherals.inventory':return zh?'已读取当前接口与外设；每个物理接口仍需在下方逐个实测':'Current devices were read; test each physical port below';
      default:return check.displayValue||t('value.unknown');
    }
  }
  function hardwareSummary(id,x){
    var d=x.details||{};
    if(x.status==='NOT_STARTED')return t('hardware.summary.notStarted');
    if(x.status==='UNSUPPORTED')return t('hardware.summary.unsupported');
    if(x.status==='SKIPPED')return t('hardware.summary.skipped');
    if(x.status==='UNKNOWN')return t('hardware.summary.unknown');
    if(x.status==='WARNING')return d.issueLabels&&d.issueLabels.length?d.issueLabels.join(D.session.locale==='zh-CN'?'、':', '):t('hardware.summary.issue');
    if(id==='keyboard')return t('hardware.summary.keyboard',{standard:(d.seen||[]).length,functions:(d.functions||[]).length,media:(d.media||[]).length});
    if(id==='display')return t('hardware.summary.display',{count:(d.reviewed||[]).length});
    if(id==='ports')return t('hardware.summary.ports',{count:Object.keys(d).filter(function(key){return key.indexOf('__')!==0&&['PASS','WARNING','SKIPPED','UNKNOWN'].indexOf(d[key])>=0;}).length});
    return t('hardware.summary.done');
  }
  function factValue(key,v){
    if(v===null||v==='')return t('value.unknown');
    if(/Bytes$/.test(key)&&typeof v==='number')return formatBytes(v);
    if(typeof v==='boolean')return yesNo(v);
    if(['ENABLED','DISABLED','ON','OFF','UNKNOWN'].indexOf(v)>=0)return stateWord(v);
    if(key==='capacityRatio'&&typeof v==='number')return Math.round(v*100)+'%';
    if(v==='MATCH')return t('value.match');if(v==='MISMATCH')return t('value.mismatch');if(v==='SINGLE_SOURCE')return t('value.singleSource');
    if(v==='APPLE_SILICON')return 'Apple Silicon';if(v==='INTEL')return 'Intel';
    if(typeof v==='object')return JSON.stringify(v);
    return String(v);
  }

  function resultList(checks,clickable){
    if(!checks.length)return h('div',{class:'notice good',text:t('overview.noAttention')});
    return h('div',{class:'list'},checks.map(function(x){
      var route=x.group,attrs={class:'result-row'+(clickable?' clickable':''),'data-status':x.status};
      if(clickable){attrs.tabindex='0';attrs.role='button';attrs.on={click:function(){go(route);},keydown:function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go(route);}}};}
      return h('div',attrs,[icon(route),h('div',{class:'row-main'},[h('div',{class:'row-title',text:t(x.titleKey)}),h('div',{class:'row-value',text:x.evidence==='GUIDED_INTERACTION'?hardwareSummary(x.group,state.hardware[x.group]):friendly(x)})]),statusBadge(x.status),h('span',{class:'chevron',text:clickable?'›':''})]);
    }));
  }
  function exportButtons(){return h('div',{class:'export-actions'},[button('action.downloadMd',downloadMarkdown),button('action.downloadPdf',downloadPDF,'primary'),button('action.downloadPng',downloadPNG,'primary')]);}
  function renderOverview(){
    var rows=combined(),plan=applicable(),done=plan.filter(function(p){return completedStatus(state.hardware[p.id].status);}).length,systemRows=D.system.checks.filter(function(x){return x.status!=='UNSUPPORTED';}),overallDone=systemRows.filter(function(x){return completedStatus(x.status);}).length+done,overallTotal=systemRows.length+plan.length;
    var urgent=rows.filter(function(x){return ['BLOCKER','WARNING','UNKNOWN'].indexOf(x.status)>=0;});
    var deviceTitle=deviceName();
    return h('section',{class:'page overview-page'},[
      h('div',{class:'overview-toolbar'},[h('div',{},[h('h2',{text:t('overview.title')}),h('p',{class:'lede',text:t('overview.intro')})]),exportButtons()]),
      h('div',{class:'device-hero'},[h('div',{class:'device-art'},[h('span',{text:'▰'})]),h('div',{class:'device-copy'},[h('h1',{text:deviceTitle||t('value.unknown')}),h('p',{text:[D.facts.device.chip,D.facts.device.memoryDisplay,osLabel()].filter(Boolean).join(' · ')}),h('div',{class:'device-pills'},[h('span',{text:t('report.serial')+' '+serial()}),h('span',{text:D.capabilities.modelYearLabel?t('device.modelYear',{year:D.capabilities.modelYearLabel}):t('device.modelYearUnknown')})])]),h('div',{class:'hero-status'},[statusBadge(worst(rows.map(function(x){return x.status;}))),h('strong',{text:overallDone+' / '+overallTotal}),h('small',{text:t('overview.overallDone')})])]),
      urgent.length?h('div',{class:'attention-block'},[h('h3',{class:'attention-title',text:t('overview.attention')}),resultList(urgent,true)]):h('div',{class:'notice good',text:t('overview.noAttention')}),
      h('div',{class:'section-heading'},[h('h3',{text:t('overview.system')}),h('span',{text:t('overview.systemDone',{count:systemRows.length})})]),
      resultList(D.system.checks,true),
      h('div',{class:'section-heading'},[h('h3',{text:t('overview.hardware')}),h('span',{text:done+' / '+plan.length})]),
      resultList(D.checks.hardwareOrder.map(function(id){var x=state.hardware[id];return{id:'hardware.'+id,group:id,titleKey:'nav.'+id,status:x.status,evidence:'GUIDED_INTERACTION'};}),true),
      h('p',{class:'privacy',text:t('report.disclaimer')+' · '+t('app.private')+' · '+D.session.sessionId})
    ]);
  }

  function factsCard(id){
    var data=D.facts[id]||{},skip=['status','limitations','serialMasked'],keys=Object.keys(data).filter(function(k){return skip.indexOf(k)<0;});
    return h('div',{class:'detail-grid'},keys.map(function(k){var label='fact.'+id+'.'+k;return h('div',{class:'fact-card'},[h('span',{text:D.strings[label]||k}),h('strong',{text:factValue(k,data[k])})]);}));
  }
  function verificationItem(titleKey,bodyKey,kind,link,vars){var children=[h('div',{class:'verify-icon '+(kind||''),text:kind==='auto'?'✓':'i'}),h('div',{class:'verify-copy'},[h('strong',{text:t(titleKey)}),h('p',{text:t(bodyKey,vars)})])];if(link)children.push(h('a',{class:'button compact',href:link,target:'_blank',rel:'noreferrer',text:t('device.coverage.open')}));return h('div',{class:'verify-row'},children);}
  function purchaseGuide(){
    var lock=D.facts.security.activationLock,year=D.capabilities.modelYearLabel,age=D.capabilities.introducedYear===null||D.capabilities.introducedYear===undefined?null:Math.max(0,new Date().getFullYear()-D.capabilities.introducedYear);
    return h('div',{class:'guide-section'},[
      h('div',{class:'section-heading'},[h('h3',{text:t('device.purchase.title')}),h('span',{text:t('device.purchase.subtitle')})]),
      h('div',{class:'verify-list'},[
        verificationItem('device.model.title',year?'device.model.known':'device.model.unknown',year?'auto':'guide',null,{year:year,age:age}),
        verificationItem('device.production.title','device.production.body','guide'),
        verificationItem('device.coverage.title','device.coverage.body','guide','https://checkcoverage.apple.com/'),
        verificationItem('device.appleid.title','device.appleid.body','guide'),
        verificationItem('device.activation.title',lock==='ENABLED'?'device.activation.enabled':(lock==='DISABLED'?'device.activation.disabled':'device.activation.unknown'),lock==='DISABLED'?'auto':'guide')
      ])
    ]);
  }
  function renderBase(id){var checks=D.system.checks.filter(function(x){return x.group===id;});return h('section',{class:'page'},[pageHead(t('nav.'+id),t('base.help.'+id),statusBadge(navStatus(id))),checks.length?resultList(checks,false):h('div',{class:'notice',text:t('base.empty')}),factsCard(id),id==='device'?purchaseGuide():h('span'),h('div',{class:'actions'},[button('action.back',function(){go('overview');})])]);}

  var issueOptions={
    keyboard:['unresponsive','stuck','function','media','backlight'],display:['brightPixel','darkPixel','color','bleed','flicker','retention'],audio:['silent','channel','distortion','volume','headphone'],microphone:['noInput','low','noise','distortion'],camera:['noImage','blur','color','flicker'],touchid:['unavailable','repeated','slow','button'],trackpad:['move','click','context','drag','scroll','pinch','force'],ports:['unrecognized','intermittent','loose','speed','charging','output']
  };
  function openIssueDialog(id,baseDetails,onConfirm){
    var selected=[],options=issueOptions[id]||['other'],confirmButton;
    var optionNodes=options.map(function(code){var label=t('issue.'+id+'.'+code);return h('button',{class:'issue-option',type:'button',on:{click:function(e){var at=selected.indexOf(code);if(at>=0)selected.splice(at,1);else selected.push(code);e.currentTarget.classList.toggle('selected',at<0);confirmButton.disabled=!selected.length;}}},[h('span',{class:'issue-check',text:'✓'}),h('span',{text:label})]);});
    var dialog=h('dialog',{class:'issue-dialog'},[h('div',{class:'dialog-body'},[h('div',{class:'dialog-icon',text:'!'}),h('h2',{text:t('issue.title.'+id)}),h('p',{text:t('issue.help')}),h('div',{class:'issue-options'},optionNodes),h('div',{class:'dialog-actions'},[button('action.cancel',function(){dialog.close();}),confirmButton=h('button',{class:'button danger',type:'button',disabled:true,text:t('issue.confirm'),on:{click:function(){var details=Object.assign({},baseDetails||{}),labels=selected.map(function(code){return t('issue.'+id+'.'+code);});details.issueCodes=selected.slice();details.issueLabels=labels;if(onConfirm)onConfirm(details);else setResult(id,'WARNING',details);dialog.close();}}})])])]);
    dialog.addEventListener('close',function(){dialog.remove();});document.body.appendChild(dialog);dialog.showModal();
  }

  function verdictActions(id,details){var cur=state.hardware[id].status;return h('div',{class:'verdict-bar'},[h('span',{class:'verdict-label',text:t('action.recordResult')}),h('div',{class:'actions'},[button('action.pass',function(){setResult(id,'PASS',details());},'primary'),button('action.issue',function(){openIssueDialog(id,details());},'danger'),button('action.unknown',function(){setResult(id,'UNKNOWN',details());}),button('action.skip',function(){if(confirm(t('dialog.skip')))setResult(id,'SKIPPED',details());}),completedStatus(cur)?button('action.retest',function(){if(confirm(t('dialog.reset'))){state.hardware[id]={status:'NOT_STARTED',details:{},updatedAt:null};save();renderPage();}}):null])]);}
  function hardwarePage(id,title,help,body,details){var st=state.hardware[id].status,list=D.checks.hardwareOrder,idx=list.indexOf(id);return h('section',{class:'page hardware-page'},[pageHead(t(title),t(help),statusBadge(st)),body,verdictActions(id,details),h('div',{class:'step-nav'},[idx>0?button('action.previous',function(){go(list[idx-1]);}):h('span'),button(idx>=list.length-1?'action.back':'action.next',function(){go(idx>=list.length-1?'overview':list[idx+1]);},'primary')])]);}

  function renderKeyboard(){
    var saved=state.hardware.keyboard.details||{},layoutName=saved.layoutName||D.keyboardLayout.name||'ANSI',layouts=D.keyboardLayouts||{},layout={rows:layouts[layoutName]||D.keyboardLayout.rows,labels:layouts.labels||D.keyboardLayout.labels};
    var seen=(saved.seen||[]).slice(),functions=(saved.functions||[]).slice(),media=(saved.media||[]).slice(),mediaManual=(saved.mediaManual||[]).slice(),lastEvent=saved.lastEvent||'';
    var expected=[].concat.apply([],layout.rows),functionSymbols=['☀︎−','☀︎+','▦','⌕','◌','☾','◀','▶▮','▶','◼','⌁−','⌁+'];
    var mediaMap={BrightnessDown:'F1',BrightnessUp:'F2',MissionControl:'F3',LaunchApplication1:'F4',LaunchApplication2:'F4',Spotlight:'F4',Dictation:'F5',DoNotDisturb:'F6',MediaTrackPrevious:'F7',MediaPreviousTrack:'F7',MediaPlayPause:'F8',MediaTrackNext:'F9',MediaNextTrack:'F9',AudioVolumeMute:'F10',VolumeMute:'F10',AudioVolumeDown:'F11',VolumeDown:'F11',AudioVolumeUp:'F12',VolumeUp:'F12'};
    var legacyFunctions={112:'F1',113:'F2',114:'F3',115:'F4',116:'F5',117:'F6',118:'F7',119:'F8',120:'F9',121:'F10',122:'F11',123:'F12'};
    function uniquePush(list,value){if(list.indexOf(value)<0)list.push(value);}
    function details(){return{layoutName:layoutName,seen:seen,functions:functions,media:media,mediaManual:mediaManual,lastEvent:lastEvent,issueCodes:saved.issueCodes||[],issueLabels:saved.issueLabels||[]};}
    function maybeComplete(){state.hardware.keyboard.details=details();var allStandard=expected.every(function(code){return seen.indexOf(code)>=0;}),allFunctions=functions.length===12,allMedia=media.length===12;if(allStandard&&allFunctions&&allMedia)setResult('keyboard','PASS',details());else{save();updateProgress();}}
    function topKey(i){var code='F'+(i+1),hit=functions.indexOf(code)>=0||media.indexOf(code)>=0;return h('div',{class:'key function-key '+(hit?'hit':''),'data-function':code},[h('span',{text:functionSymbols[i]}),h('small',{text:code})]);}
    var top=h('div',{class:'key-row top-row'},[h('div',{class:'key key-escape '+(seen.indexOf('Escape')>=0?'hit':''),'data-code':'Escape',text:'esc'})].concat(functionSymbols.map(function(_,i){return topKey(i);})).concat([h('div',{class:'key touch-key'},[h('span',{text:'◎'}),h('small',{text:'Touch ID'})])]));
    var keyboard=h('div',{class:'keyboard keyboard-shell'},[top]);
    layout.rows.forEach(function(source,index){var row=index===0?source.filter(function(code){return code!=='Escape';}):source;keyboard.appendChild(h('div',{class:'key-row'},row.map(function(code){var wide=/^(Tab|CapsLock|Enter|ShiftLeft|ShiftRight|Backspace)$/.test(code),space=code==='Space',iso=code==='IntlBackslash',jis=/^(IntlYen|IntlRo|Lang1|Lang2)$/.test(code);return h('div',{class:'key '+(wide?'key-wide ':'')+(space?'key-space ':'')+(iso?'key-iso ':'')+(jis?'key-jis ':'')+(seen.indexOf(code)>=0?'hit':''),'data-code':code,text:layout.labels[code]!==undefined?layout.labels[code]:code.replace(/^(Key|Digit)/,'')});})));});
    var standardText=h('span'),functionText=h('span'),mediaText=h('span'),eventText=h('span',{class:'event-readout'});
    var mediaButtons=functionSymbols.map(function(symbol,i){var code='F'+(i+1),manual=mediaManual.indexOf(code)>=0;return h('button',{class:'media-key '+(media.indexOf(code)>=0?'hit ':'')+(manual?'manual':''),type:'button','data-media':code,on:{click:function(e){uniquePush(media,code);uniquePush(mediaManual,code);lastEvent=t('hardware.keyboard.manualRecorded',{key:code});e.currentTarget.classList.add('hit','manual');maybeComplete();}}},[h('span',{text:symbol}),h('small',{text:code})]);});
    function updateProgress(){standardText.textContent=seen.filter(function(x){return expected.indexOf(x)>=0;}).length+' / '+expected.length;functionText.textContent=functions.length+' / 12';mediaText.textContent=media.length+' / 12';eventText.textContent=lastEvent||t('hardware.keyboard.waitingEvent');keyboard.querySelectorAll('[data-function]').forEach(function(el){var code=el.getAttribute('data-function');el.classList.toggle('hit',functions.indexOf(code)>=0||media.indexOf(code)>=0);});document.querySelectorAll('[data-media]').forEach(function(el){el.classList.toggle('hit',media.indexOf(el.getAttribute('data-media'))>=0);});}
    function changeLayout(name){layoutName=name;var required=layouts[name]?[].concat.apply([],layouts[name]):expected;seen=seen.filter(function(code){return required.indexOf(code)>=0;});state.hardware.keyboard.details=details();save();renderPage();}
    var keyHandler=function(e){
      if(e.repeat)return;var changed=false,fn=mediaMap[e.key]||mediaMap[e.code],functionCode=(/^F([1-9]|1[0-2])$/.test(e.code)?e.code:(/^F([1-9]|1[0-2])$/.test(e.key)?e.key:legacyFunctions[e.keyCode]));
      lastEvent=(e.key||'Unidentified')+' · '+(e.code||'no-code');
      if(fn){uniquePush(media,fn);changed=true;}
      if(functionCode){uniquePush(functions,functionCode);changed=true;e.preventDefault();e.stopPropagation();}
      if(expected.indexOf(e.code)>=0){uniquePush(seen,e.code);var key=keyboard.querySelector('[data-code="'+CSS.escape(e.code)+'"]');if(key)key.classList.add('hit');changed=true;}
      if(changed){e.preventDefault();maybeComplete();}else updateProgress();
    };
    window.addEventListener('keydown',keyHandler,true);
    cleanup=function(){window.removeEventListener('keydown',keyHandler,true);};
    var layoutSwitch=h('div',{class:'layout-switch'},[h('span',{text:t('hardware.keyboard.layout')}),h('div',{class:'segmented'},['ANSI','ISO','JIS'].map(function(name){return button('hardware.keyboard.layout.'+name,function(){changeLayout(name);},layoutName===name?'selected':'');}))]);
    var progress=h('div',{class:'keyboard-progress'},[h('div',{},[h('strong',{text:t('hardware.keyboard.standard')}),standardText]),h('div',{},[h('strong',{text:t('hardware.keyboard.function')}),functionText]),h('div',{},[h('strong',{text:t('hardware.keyboard.media')}),mediaText])]);
    updateProgress();
    return hardwarePage('keyboard','hardware.keyboard.title','hardware.keyboard.help',h('div',{class:'card test-panel'},[layoutSwitch,h('div',{class:'instruction'},[h('b',{text:'1'}),h('p',{text:t('hardware.keyboard.step1')})]),keyboard,progress,h('div',{class:'event-line'},[h('strong',{text:t('hardware.keyboard.lastEvent',{event:''})}),eventText]),h('div',{class:'media-panel'},[h('div',{},[h('strong',{text:t('hardware.keyboard.mediaTitle')}),h('p',{text:t('hardware.keyboard.fnhelp')})]),h('div',{class:'media-grid'},mediaButtons)]),h('div',{class:'notice subtle'},[h('strong',{text:t('hardware.keyboard.touchTitle')}),h('p',{text:t('hardware.keyboard.touchHelp')})])]),details);
  }

  function renderDisplay(){
    var reviewed=(state.hardware.display.details.reviewed||[]).slice(),issues=(state.hardware.display.details.issues||[]).slice();
    var patterns=['white','black','red','green','blue','gray','grayscale','gradient-h','gradient-v','checker','lines','text','corners'];
    function start(){
      var index=0,finished=false,stage=h('div',{class:'display-stage pattern-'+patterns[0]},[h('div',{class:'display-hud'}),h('div',{class:'display-sample',text:'MacCheck Aa 123 · 细节与清晰度'})]);
      document.body.appendChild(stage);
      function update(){stage.className='display-stage pattern-'+patterns[index];stage.firstChild.textContent=t('hardware.display.pattern',{current:index+1,total:patterns.length})+' · '+t('hardware.display.keys')+(issues.indexOf(index)>=0?' · '+t('hardware.display.mark'):'');if(reviewed.indexOf(index)<0)reviewed.push(index);}
      function finish(){if(finished)return;finished=true;window.removeEventListener('keydown',key);document.removeEventListener('fullscreenchange',fullChange);if(stage.parentNode)stage.remove();state.hardware.display.details={reviewed:reviewed,issues:issues};save();if(reviewed.length===patterns.length)setResult('display',issues.length?'WARNING':'PASS',{reviewed:reviewed,issues:issues});else renderPage();}
      function key(e){if(['ArrowRight','ArrowDown'].indexOf(e.key)>=0){e.preventDefault();index=(index+1)%patterns.length;update();}else if(['ArrowLeft','ArrowUp'].indexOf(e.key)>=0){e.preventDefault();index=(index+patterns.length-1)%patterns.length;update();}else if(e.key.toLowerCase()==='m'){e.preventDefault();var at=issues.indexOf(index);if(at>=0)issues.splice(at,1);else issues.push(index);update();}else if(e.key==='Escape'){finish();}}
      function fullChange(){if(!document.fullscreenElement)finish();}
      window.addEventListener('keydown',key);document.addEventListener('fullscreenchange',fullChange);
      stage.addEventListener('mousemove',function(){stage.classList.remove('idle');clearTimeout(stage._idle);stage._idle=setTimeout(function(){stage.classList.add('idle');},1000);});
      stage.requestFullscreen&&stage.requestFullscreen().catch(function(){});update();
      cleanup=function(){finish();};
    }
    var labels=patterns.map(function(name,i){return h('span',{class:'pattern-chip '+(reviewed.indexOf(i)>=0?'hit ':'')+(issues.indexOf(i)>=0?'issue':''),text:(i+1)+' · '+t('display.pattern.'+name)});});
    return hardwarePage('display','hardware.display.title','hardware.display.help',h('div',{class:'card test-panel'},[h('div',{class:'display-intro'},[h('div',{class:'display-mini'},[h('span'),h('span'),h('span')]),h('div',{},[h('strong',{text:t('hardware.display.manualTitle')}),h('p',{text:t('hardware.display.keys')})])]),h('div',{class:'actions'},[button('action.fullscreen',start,'primary')]),h('div',{class:'pattern-list'},labels)]),function(){return{reviewed:reviewed,issues:issues};});
  }

  function renderAudio(){var details=state.hardware.audio.details||{},hasHeadphone=D.capabilities.hasHeadphoneJack!==false,required=hasHeadphone?['speaker','headphone']:['speaker'];function play(){try{var C=window.AudioContext||window.webkitAudioContext,ctx=new C(),at=ctx.currentTime;ctx.resume();[[440,-1,0],[660,1,.62],[160,0,1.24]].forEach(function(spec){var o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner?ctx.createStereoPanner():null;o.frequency.value=spec[0];g.gain.setValueAtTime(.0001,at+spec[2]);g.gain.exponentialRampToValueAtTime(.2,at+spec[2]+.03);g.gain.exponentialRampToValueAtTime(.0001,at+spec[2]+.5);if(p){p.pan.value=spec[1];o.connect(g).connect(p).connect(ctx.destination);}else o.connect(g).connect(ctx.destination);o.start(at+spec[2]);o.stop(at+spec[2]+.54);});toast('message.audioPlaying');}catch(_){toast('message.audio');}}function choose(name,value){details[name]=value;if(required.every(function(x){return !!details[x];}))setResult('audio',required.some(function(x){return details[x]==='WARNING';})?'WARNING':'PASS',details);else{save();renderPage();}}function output(name){return h('div',{class:'port'},[h('strong',{text:t('hardware.audio.'+name)}),h('p',{text:t('hardware.audio.'+name+'Help')}),h('div',{class:'segmented'},[button('hardware.audio.heard',function(){choose(name,'PASS');},details[name]==='PASS'?'selected':''),button('hardware.audio.problem',function(){choose(name,'WARNING');},details[name]==='WARNING'?'selected':'')])]);}var list=[output('speaker')];if(hasHeadphone)list.push(output('headphone'));return hardwarePage('audio','hardware.audio.title','hardware.audio.help',h('div',{class:'card test-panel'},[h('div',{class:'tone-visual'},[h('i'),h('i'),h('i'),h('i'),h('i')]),button('action.play',play,'primary'),h('div',{class:'ports'},list),h('p',{class:'report-meta',text:t('message.audio')})]),function(){return details;});}
  function renderMicrophone(){var stream=null,recorder=null,chunks=[],url=null,audioContext=null,meter=h('progress',{class:'meter',max:'100',value:'0'}),audio=h('audio',{controls:'controls'});function stop(){if(recorder&&recorder.state!=='inactive')recorder.stop();if(stream)stream.getTracks().forEach(function(x){x.stop();});}async function record(){try{chunks=[];stream=await navigator.mediaDevices.getUserMedia({audio:true});audioContext=new(window.AudioContext||window.webkitAudioContext)();var source=audioContext.createMediaStreamSource(stream),an=audioContext.createAnalyser(),data=new Uint8Array(an.frequencyBinCount);source.connect(an);function tick(){an.getByteFrequencyData(data);meter.value=Math.round(Math.max.apply(null,data)/255*100);if(stream)requestAnimationFrame(tick);}tick();recorder=new MediaRecorder(stream);recorder.ondataavailable=function(e){chunks.push(e.data);};recorder.onstop=function(){url=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));audio.src=url;state.hardware.microphone.details={recorded:true};save();stream=null;toast('hardware.microphone.ready');};recorder.start();setTimeout(stop,3000);}catch(_){toast('hardware.microphone.denied');setResult('microphone','UNKNOWN',{permissionDenied:true});}}cleanup=function(){stop();if(audioContext)audioContext.close();if(url)URL.revokeObjectURL(url);};return hardwarePage('microphone','hardware.microphone.title','hardware.microphone.help',h('div',{class:'card test-panel'},[h('label',{text:t('hardware.microphone.level')}),meter,h('div',{class:'actions'},[button('action.record',record,'primary')]),audio]),function(){return state.hardware.microphone.details||{};});}
  function renderCamera(){var stream=null,video=h('video',{class:'preview',autoplay:'autoplay',playsinline:'playsinline',muted:'muted'});async function open(){try{stream=await navigator.mediaDevices.getUserMedia({video:true});video.srcObject=stream;}catch(_){toast('hardware.camera.denied');setResult('camera','UNKNOWN',{permissionDenied:true});}}function close(){if(stream)stream.getTracks().forEach(function(x){x.stop();});stream=null;video.srcObject=null;}cleanup=close;return hardwarePage('camera','hardware.camera.title','hardware.camera.help',h('div',{class:'card test-panel'},[h('div',{class:'actions'},[button('action.preview',open,'primary'),button('action.close',close)]),video]),function(){return{previewed:!!stream};});}
  function renderTouch(){return hardwarePage('touchid','hardware.touchid.title','hardware.touchid.help',h('div',{class:'card test-panel touch-guide'},[h('div',{class:'touch-visual',text:'◎'}),h('div',{class:'step-list'},[h('div',{},[h('b',{text:'1'}),h('p',{text:t('hardware.touchid.step1')})]),h('div',{},[h('b',{text:'2'}),h('p',{text:t('hardware.touchid.step2')})]),h('div',{},[h('b',{text:'3'}),h('p',{text:t('hardware.touchid.step3')})])]),h('div',{class:'notice subtle',text:t('hardware.touchid.boundary')})]),function(){return{guided:true,browserDetectable:false};});}

  function renderTrackpad(){
    var saved=state.hardware.trackpad.details||{},d={move:!!saved.move,corners:Array.isArray(saved.corners)?saved.corners.slice():[],single:!!saved.single,double:!!saved.double,context:!!saved.context,drag:!!saved.drag,scroll:!!saved.scroll,pinch:!!saved.pinch,force:saved.force||null,issueCodes:saved.issueCodes||[],issueLabels:saved.issueLabels||[]},down=false,dragActive=false,start=null,puck={x:saved.drag?690:65,y:275},target={x:690,y:275};
    var canvas=h('canvas',{class:'track-canvas',width:'760',height:'340'}),area=h('div',{class:'trackpad'},[canvas,h('span',{class:'trackpad-label',text:t('hardware.trackpad.area')})]),ctx=canvas.getContext('2d');
    ['tl','tr','bl','br'].forEach(function(c){area.appendChild(h('span',{class:'corner '+c+(d.corners.indexOf(c)>=0?' hit':''),'data-corner':c}));});
    function draw(){ctx.clearRect(0,0,760,340);ctx.strokeStyle='rgba(0,122,255,.45)';ctx.setLineDash([8,7]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(target.x,target.y,38,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=d.drag?'#20a651':'#007aff';ctx.beginPath();ctx.arc(puck.x,puck.y,29,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='600 12px -apple-system, sans-serif';ctx.textAlign='center';ctx.fillText(d.drag?'✓':t('hardware.trackpad.dragBall'),puck.x,puck.y+4);ctx.fillStyle='rgba(110,110,115,.9)';ctx.font='11px -apple-system, sans-serif';ctx.fillText(t('hardware.trackpad.dragTarget'),target.x,target.y+57);}
    function point(e){var r=area.getBoundingClientRect();return{x:(e.clientX-r.left)*760/r.width,y:(e.clientY-r.top)*340/r.height};}
    function detail(){return d;}
    function allCore(){return d.move&&d.corners.length===4&&d.single&&d.double&&d.context&&d.drag&&d.scroll&&d.pinch;}
    function mark(){state.hardware.trackpad.details=d;save();renderChips();if(allCore()&&state.hardware.trackpad.status==='NOT_STARTED')setResult('trackpad','PASS',d);}
    function renderChips(){chips.textContent='';[['move',d.move],['corners',d.corners.length===4],['single',d.single],['double',d.double],['context',d.context],['drag',d.drag],['scroll',d.scroll],['pinch',d.pinch],['force',d.force==='PASS']].forEach(function(x){chips.appendChild(h('span',{class:'chip '+(x[1]?'hit':''),text:t('hardware.trackpad.'+x[0])}));});}
    area.addEventListener('pointermove',function(e){var p=point(e);if(!d.move){d.move=true;mark();}if(down&&dragActive){puck.x=Math.max(30,Math.min(730,p.x));puck.y=Math.max(30,Math.min(310,p.y));draw();}});
    area.addEventListener('pointerdown',function(e){var p=point(e);down=true;start=p;dragActive=!d.drag&&Math.hypot(p.x-puck.x,p.y-puck.y)<48;if(area.setPointerCapture)area.setPointerCapture(e.pointerId);var x=p.x/760,y=p.y/340,c=x<.22?(y<.25?'tl':(y>.75?'bl':null)):(x>.78?(y<.25?'tr':(y>.75?'br':null)):null);if(c&&d.corners.indexOf(c)<0){d.corners.push(c);area.querySelector('[data-corner="'+c+'"]').classList.add('hit');mark();}});
    area.addEventListener('pointerup',function(e){var p=point(e),wasDrag=dragActive;if(wasDrag){if(Math.hypot(p.x-target.x,p.y-target.y)<70){d.drag=true;puck.x=target.x;puck.y=target.y;draw();mark();}else{puck.x=65;puck.y=275;draw();}}else if(start&&Math.hypot(p.x-start.x,p.y-start.y)<10&&!d.single){d.single=true;mark();}down=false;dragActive=false;start=null;});
    area.addEventListener('dblclick',function(){if(!d.double){d.double=true;mark();}});
    area.addEventListener('contextmenu',function(e){e.preventDefault();if(!d.context){d.context=true;mark();}});area.addEventListener('wheel',function(e){e.preventDefault();if(e.ctrlKey){if(!d.pinch){d.pinch=true;mark();}}else if(!d.scroll){d.scroll=true;mark();}},{passive:false});
    var gesture=function(e){e.preventDefault();if(!d.pinch){d.pinch=true;mark();}};area.addEventListener('gesturechange',gesture,{passive:false});
    cleanup=function(){area.removeEventListener('gesturechange',gesture);};
    var chips=h('div',{class:'chips track-chips'});renderChips();
    var forceActions=h('div',{class:'force-row'},[h('div',{},[h('strong',{text:t('hardware.trackpad.force')}),h('p',{text:t('hardware.trackpad.forceHelp')})]),h('div',{class:'segmented'},[button('action.feedback',function(){d.force='PASS';mark();},d.force==='PASS'?'selected':''),button('action.unavailable',function(){d.force='UNKNOWN';mark();},d.force==='UNKNOWN'?'selected':'')])]);
    draw();
    return hardwarePage('trackpad','hardware.trackpad.title','hardware.trackpad.help',h('div',{class:'card test-panel'},[area,chips,h('p',{class:'report-meta',text:t('hardware.trackpad.pinchHelp')}),forceActions]),detail);
  }

  function renderPorts(){
    var d=state.hardware.ports.details||{},ports=[],profile=D.capabilities.portLayout,audioBaseline=null,batteryManager=null,alive=true;
    var methods={usbc:'usb',usba:'usb',thunderbolt:'usb',headphone:'audio',magsafe:'power',hdmi:'display',sd:'storage',ethernet:'manual',generic:'manual'};
    function add(type,count){if(typeof count!=='number'||count<1)return;for(var i=1;i<=count;i++)ports.push({id:type+(count>1?i:''),type:type,method:methods[type]||'manual',key:'hardware.ports.'+type,vars:{index:i},help:'hardware.ports.'+type+'Help'});}
    if(Array.isArray(profile)&&profile.length)profile.forEach(function(p){ports.push({id:p.id,type:p.type,method:methods[p.type]||'manual',key:'hardware.ports.'+p.type,vars:{index:p.index||1},help:'hardware.ports.'+p.type+'Help',side:p.side,position:p.position});});
    else{
      add('usbc',D.capabilities.usbCPortCount);add('usba',D.capabilities.usbAPortCount);add('thunderbolt',D.capabilities.thunderboltPortCount);add('hdmi',D.capabilities.hdmiPortCount||(D.capabilities.hasHDMI===true?1:0));add('sd',D.capabilities.sdCardSlotCount||(D.capabilities.hasSDCard===true?1:0));add('headphone',D.capabilities.headphonePortCount||(D.capabilities.hasHeadphoneJack===true?1:0));add('magsafe',D.capabilities.magSafePortCount||(D.capabilities.hasMagSafe===true?1:0));add('ethernet',D.capabilities.ethernetPortCount);
    }
    if(!D.capabilities.portProfileComplete)ports.push({id:'generic',type:'generic',method:'manual',key:'hardware.ports.generic',help:'hardware.ports.genericHelp'});
    if(!ports.length)ports.push({id:'generic',type:'generic',method:'manual',key:'hardware.ports.generic',help:'hardware.ports.genericHelp'});
    d.__evidence=d.__evidence||{};d.__issues=d.__issues||{};
    function active(){return ports.filter(function(p){return p.id===d.__testing;})[0]||null;}
    function finish(id,value,evidence){if(!alive)return;d[id]=value;delete d.__testing;if(evidence)d.__evidence[id]=evidence;var values=ports.map(function(p){return d[p.id];});if(values.every(Boolean)){var overall=values.some(function(x){return x==='WARNING';})?'WARNING':(values.every(function(x){return x==='SKIPPED';})?'SKIPPED':(values.some(function(x){return x==='SKIPPED';})?'NOTICE':'PASS'));var issueLabels=[];Object.keys(d.__issues).forEach(function(key){issueLabels=issueLabels.concat(d.__issues[key]);});if(issueLabels.length)d.issueLabels=issueLabels;setResult('ports',overall,d);}else{state.hardware.ports.details=d;save();renderPage();}if(evidence==='AUTO')toast('hardware.ports.autoFound');}
    function begin(p){d.__testing=p.id;state.hardware.ports.details=d;save();renderPage();}
    function runAuto(p){
      if(p.method==='usb'&&navigator.usb&&navigator.usb.requestDevice)navigator.usb.requestDevice({filters:[]}).then(function(){finish(p.id,'PASS','AUTO');}).catch(function(){toast('hardware.ports.autoUnavailable');});
      else if(p.method==='display'&&window.getScreenDetails)window.getScreenDetails().then(function(details){if(details.screens&&details.screens.length>1)finish(p.id,'PASS','AUTO');else toast('hardware.ports.notFound');}).catch(function(){toast('hardware.ports.autoUnavailable');});
      else if(p.method==='storage'&&window.showOpenFilePicker)window.showOpenFilePicker({multiple:false}).then(function(handles){if(handles&&handles.length)finish(p.id,'PASS','GUIDED');}).catch(function(){toast('hardware.ports.autoUnavailable');});
      else toast('hardware.ports.autoUnavailable');
    }
    function charging(){var p=active();if(p&&p.method==='power'&&batteryManager&&batteryManager.charging)finish(p.id,'PASS','AUTO');}
    function usbConnect(){var p=active();if(p&&p.method==='usb')finish(p.id,'PASS','AUTO');}
    function mediaChange(){var p=active();if(!p||p.method!=='audio'||!navigator.mediaDevices||!navigator.mediaDevices.enumerateDevices)return;navigator.mediaDevices.enumerateDevices().then(function(devices){var countNow=devices.filter(function(x){return x.kind==='audiooutput';}).length;if(audioBaseline!==null&&countNow!==audioBaseline)finish(p.id,'PASS','AUTO');audioBaseline=countNow;}).catch(function(){});}
    if(navigator.usb&&navigator.usb.addEventListener)navigator.usb.addEventListener('connect',usbConnect);if(navigator.mediaDevices&&navigator.mediaDevices.addEventListener)navigator.mediaDevices.addEventListener('devicechange',mediaChange);
    var current=active();if(current&&current.method==='audio'&&navigator.mediaDevices&&navigator.mediaDevices.enumerateDevices)navigator.mediaDevices.enumerateDevices().then(function(devices){audioBaseline=devices.filter(function(x){return x.kind==='audiooutput';}).length;}).catch(function(){});if(current&&current.method==='power'&&navigator.getBattery)navigator.getBattery().then(function(battery){batteryManager=battery;if(battery.charging)finish(current.id,'PASS','AUTO');else battery.addEventListener('chargingchange',charging);}).catch(function(){});
    cleanup=function(){alive=false;if(navigator.usb&&navigator.usb.removeEventListener)navigator.usb.removeEventListener('connect',usbConnect);if(navigator.mediaDevices&&navigator.mediaDevices.removeEventListener)navigator.mediaDevices.removeEventListener('devicechange',mediaChange);if(batteryManager)batteryManager.removeEventListener('chargingchange',charging);};
    function markIssue(p){openIssueDialog('ports',d,function(details){d=details;d.__issues=d.__issues||{};d.__issues[p.id]=details.issueLabels||[];finish(p.id,'WARNING','MANUAL');});}
    function controls(p){var testing=d.__testing===p.id;if(!testing)return h('div',{class:'port-actions'},[button(d[p.id]?'action.retest':'hardware.ports.start',function(){begin(p);},d[p.id]?'':'primary')]);var items=[];if(['usb','display','storage'].indexOf(p.method)>=0)items.push(button('hardware.ports.tryAuto',function(){runAuto(p);},'primary'));items.push(button('action.pass',function(){finish(p.id,'PASS','MANUAL');}));items.push(button('action.issue',function(){markIssue(p);},'danger'));items.push(button('action.skip',function(){finish(p.id,'SKIPPED','MANUAL');}));return h('div',{class:'port-actions'},items);}
    function card(p){var placement=p.side?t('hardware.ports.placement',{side:t('hardware.ports.side.'+p.side),position:t('hardware.ports.position.'+p.position)}):'',testing=d.__testing===p.id,evidence=d.__evidence[p.id],status=d[p.id]||'NOT_STARTED';return h('div',{class:'port '+(testing?'testing':'')},[h('div',{class:'port-head'},[icon('ports'),h('div',{},[h('strong',{text:t(p.key,p.vars)}),placement?h('span',{class:'port-placement',text:placement}):null,h('p',{text:testing?t('hardware.ports.waiting.'+p.method):t(p.help)})])]),h('div',{class:'port-result'},[statusBadge(status),evidence?h('small',{text:t('hardware.ports.evidence.'+evidence)}):null]),controls(p)]);}
    var positioned=ports.some(function(p){return !!p.side;}),left=ports.filter(function(p){return p.side==='left';}),right=ports.filter(function(p){return p.side==='right';});
    var profileView=positioned?h('div',{class:'port-map'},[h('div',{class:'map-side'},[h('small',{text:t('hardware.ports.side.left')})].concat(left.map(function(p){return h('span',{text:t(p.key,p.vars)});}))),h('div',{class:'map-device'},[h('strong',{text:deviceName()}),h('span',{text:t('hardware.ports.modelMatched',{model:D.facts.device.modelIdentifier||deviceName()})}),h('i')]),h('div',{class:'map-side right'},[h('small',{text:t('hardware.ports.side.right')})].concat(right.map(function(p){return h('span',{text:t(p.key,p.vars)});}))) ]):h('div',{class:'notice',text:t(D.capabilities.portProfileComplete?'hardware.ports.modelCounted':'hardware.ports.modelGeneric',{model:D.facts.device.modelIdentifier||deviceName()})});
    return hardwarePage('ports','hardware.ports.title','hardware.ports.help',h('div',{},[profileView,h('div',{class:'ports'},ports.map(card)),h('div',{class:'notice subtle',text:t('hardware.ports.boundary')})]),function(){return d;});
  }
  function renderHardware(id){if(state.hardware[id]&&state.hardware[id].status==='UNSUPPORTED')return h('section',{class:'page'},[pageHead(t('nav.'+id),t('hardware.summary.unsupported'),statusBadge('UNSUPPORTED')),h('div',{class:'actions'},[button('action.back',function(){go('overview');})])]);var map={keyboard:renderKeyboard,display:renderDisplay,audio:renderAudio,microphone:renderMicrophone,camera:renderCamera,touchid:renderTouch,trackpad:renderTrackpad,ports:renderPorts};return map[id]();}

  function reportModel(){var rows=combined(),c=counts();return{title:t('report.title'),generated:new Date().toLocaleString(D.session.locale),device:deviceName(),spec:[D.facts.device.chip,D.facts.device.memoryDisplay,osLabel()].filter(Boolean).join(' · '),serial:serial(),overall:worst(rows.map(function(x){return x.status;})),counts:c,attention:rows.filter(function(x){return ['BLOCKER','WARNING','UNKNOWN'].indexOf(x.status)>=0;}),system:D.system.checks.map(function(x){return{title:t(x.titleKey),status:x.status,value:friendly(x)};}),hardware:D.checks.hardwareOrder.map(function(id){return{title:t('nav.'+id),status:state.hardware[id].status,value:hardwareSummary(id,state.hardware[id])};})};}
  function escapeMd(v){return String(v).replace(/\|/g,'\\|').replace(/\n/g,' ');}
  function markdown(){var m=reportModel(),c=m.counts,lines=['# '+m.title,'',m.device,'',m.spec,'','**'+t('report.serial')+'**：'+m.serial+'  ','**'+t('report.generated')+'**：'+m.generated+'  ','**'+t('report.overall')+'**：'+t('status.'+m.overall),'','## '+t('report.summary'),'','| '+t('status.PASS')+' | '+t('status.NOTICE')+' | '+t('status.WARNING')+' | '+t('status.BLOCKER')+' | '+t('status.UNKNOWN')+' |','|---:|---:|---:|---:|---:|','| '+c.PASS+' | '+c.NOTICE+' | '+c.WARNING+' | '+c.BLOCKER+' | '+c.UNKNOWN+' |'];if(m.attention.length){lines.push('','## '+t('report.attention'),'');m.attention.forEach(function(x){lines.push('- **'+t('status.'+x.status)+' · '+escapeMd(t(x.titleKey))+'**：'+escapeMd(x.evidence==='GUIDED_INTERACTION'?hardwareSummary(x.group,state.hardware[x.group]):friendly(x)));});}lines.push('','## '+t('report.system'),'','| '+t('report.item')+' | '+t('report.status')+' | '+t('report.result')+' |','|---|---|---|');m.system.forEach(function(x){lines.push('| '+escapeMd(x.title)+' | '+t('status.'+x.status)+' | '+escapeMd(x.value)+' |');});lines.push('','## '+t('report.hardware'),'','| '+t('report.item')+' | '+t('report.status')+' | '+t('report.result')+' |','|---|---|---|');m.hardware.forEach(function(x){lines.push('| '+escapeMd(x.title)+' | '+t('status.'+x.status)+' | '+escapeMd(x.value)+' |');});lines.push('','## '+t('device.purchase.title'),'','- '+t('device.production.body'),'- '+t('device.coverage.body'),'- '+t('device.appleid.body'),'- '+t(D.facts.security.activationLock==='ENABLED'?'device.activation.enabled':(D.facts.security.activationLock==='DISABLED'?'device.activation.disabled':'device.activation.unknown')),'','---','',t('report.disclaimer'),'','Session: `'+D.session.sessionId+'`');return lines.join('\n');}
  function filename(ext){var now=new Date(),pad=function(n){return String(n).padStart(2,'0');},stamp=now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+'-'+pad(now.getHours())+pad(now.getMinutes());return(D.session.locale==='zh-CN'?'Mac验机报告-':'Mac-Inspection-Report-')+stamp+'.'+ext;}
  function saveBlob(blob,name){var url=URL.createObjectURL(blob),a=h('a',{href:url,download:name});document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  function downloadMarkdown(){saveBlob(new Blob([markdown()],{type:'text/markdown;charset=utf-8'}),filename('md'));}

  function wrapCanvas(ctx,text,maxWidth){var words=String(text||'—').split(D.session.locale==='zh-CN'?'':/\s+/),lines=[],line='';if(D.session.locale==='zh-CN')words=Array.from(String(text||'—'));words.forEach(function(word){var trial=line+(D.session.locale==='zh-CN'?'':' ')+word;if(ctx.measureText(trial).width>maxWidth&&line){lines.push(line);line=word;}else line=trial.trim();});if(line)lines.push(line);return lines;}
  function reportCanvases(){
    var m=reportModel(),pages=[],canvas,ctx,y,statusColors={PASS:'#16a34a',NOTICE:'#d97706',WARNING:'#ea580c',BLOCKER:'#ef4444',UNKNOWN:'#7c7c84',UNSUPPORTED:'#7c7c84',SKIPPED:'#7c7c84',NOT_STARTED:'#9ca3af'};
    function page(){canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1240,1754);ctx.textBaseline='top';pages.push(canvas);y=82;if(pages.length>1){ctx.fillStyle='#111827';ctx.font='700 28px -apple-system, BlinkMacSystemFont, sans-serif';ctx.fillText(t('report.title')+' · '+t('report.continued'),80,35);ctx.fillStyle='#9ca3af';ctx.font='22px -apple-system, BlinkMacSystemFont, sans-serif';ctx.fillText(String(pages.length),1120,40);}}
    function ensure(height){if(y+height>1650){canvas._usedHeight=1754;page();}}
    function text(value,x,yy,font,color){ctx.font=font;ctx.fillStyle=color;ctx.fillText(String(value),x,yy);}
    function section(title){ensure(80);y+=18;text(title,80,y,'700 30px -apple-system, BlinkMacSystemFont, sans-serif','#111827');y+=50;}
    function row(item){ctx.font='25px -apple-system, BlinkMacSystemFont, sans-serif';var lines=wrapCanvas(ctx,item.value,650),height=Math.max(70,lines.length*34+28);ensure(height);ctx.strokeStyle='#e5e7eb';ctx.beginPath();ctx.moveTo(80,y+height);ctx.lineTo(1160,y+height);ctx.stroke();ctx.fillStyle=statusColors[item.status]||'#7c7c84';ctx.beginPath();ctx.arc(96,y+28,11,0,Math.PI*2);ctx.fill();text(item.title,125,y+10,'600 25px -apple-system, BlinkMacSystemFont, sans-serif','#111827');text(t('status.'+item.status),420,y+11,'600 22px -apple-system, BlinkMacSystemFont, sans-serif',statusColors[item.status]||'#7c7c84');lines.forEach(function(line,i){text(line,535,y+10+i*34,'23px -apple-system, BlinkMacSystemFont, sans-serif','#6b7280');});y+=height;}
    page();
    text(m.title,80,92,'800 55px -apple-system, BlinkMacSystemFont, sans-serif','#111827');text(m.device,80,166,'700 35px -apple-system, BlinkMacSystemFont, sans-serif','#111827');text(m.spec,80,218,'26px -apple-system, BlinkMacSystemFont, sans-serif','#6b7280');text(t('report.serial')+'  '+m.serial,80,262,'24px ui-monospace, SFMono-Regular, monospace','#6b7280');
    ctx.fillStyle=statusColors[m.overall]||'#7c7c84';ctx.fillRect(930,92,230,132);text(t('status.'+m.overall),955,116,'800 38px -apple-system, BlinkMacSystemFont, sans-serif','#ffffff');text(t('report.overall'),955,169,'22px -apple-system, BlinkMacSystemFont, sans-serif','#ffffff');
    y=345;var summary=[[t('status.PASS'),m.counts.PASS,'#16a34a'],[t('overview.attention'),m.counts.BLOCKER+m.counts.WARNING,'#ef4444'],[t('status.UNKNOWN'),m.counts.UNKNOWN,'#7c7c84']];summary.forEach(function(s,i){var x=80+i*360;ctx.fillStyle='#f5f5f7';ctx.fillRect(x,y,330,112);text(s[1],x+24,y+18,'800 40px -apple-system, BlinkMacSystemFont, sans-serif',s[2]);text(s[0],x+24,y+70,'21px -apple-system, BlinkMacSystemFont, sans-serif','#6b7280');});y+=150;
    if(m.attention.length){section(t('report.attention'));m.attention.forEach(function(x){row({title:t(x.titleKey),status:x.status,value:x.evidence==='GUIDED_INTERACTION'?hardwareSummary(x.group,state.hardware[x.group]):friendly(x)});});}
    section(t('report.system'));m.system.forEach(row);section(t('report.hardware'));m.hardware.forEach(row);
    ensure(180);y+=30;text(t('report.generated')+' · '+m.generated,80,y,'22px -apple-system, BlinkMacSystemFont, sans-serif','#6b7280');y+=38;wrapCanvas(ctx,t('report.disclaimer'),1040).forEach(function(line){text(line,80,y,'20px -apple-system, BlinkMacSystemFont, sans-serif','#9ca3af');y+=29;});canvas._usedHeight=Math.min(1754,y+80);return pages;
  }
  function canvasBlob(canvas,type,quality){return new Promise(function(resolve){canvas.toBlob(resolve,type,quality);});}
  async function downloadPNG(){toast('message.generating');var pages=reportCanvases(),out=document.createElement('canvas'),offset=0;out.width=1240;out.height=pages.reduce(function(sum,page){return sum+(page._usedHeight||1754);},0);var ctx=out.getContext('2d');pages.forEach(function(page){var height=page._usedHeight||1754;ctx.drawImage(page,0,0,1240,height,0,offset,1240,height);offset+=height;});var blob=await canvasBlob(out,'image/png');saveBlob(blob,filename('png'));}
  function dataBytes(url){var raw=atob(url.split(',')[1]),bytes=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes;}
  function pdfBlob(canvases){
    var encoder=new TextEncoder(),objects={},kids=[];
    canvases.forEach(function(canvas,i){var page=3+i*3,content=page+1,image=page+2,jpeg=dataBytes(canvas.toDataURL('image/jpeg',0.9)),commands='q\n595 0 0 842 0 0 cm\n/Im'+i+' Do\nQ\n';kids.push(page+' 0 R');objects[page]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im'+i+' '+image+' 0 R >> >> /Contents '+content+' 0 R >>';objects[content]='<< /Length '+encoder.encode(commands).length+' >>\nstream\n'+commands+'endstream';objects[image]={head:'<< /Type /XObject /Subtype /Image /Width '+canvas.width+' /Height '+canvas.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n',data:jpeg,tail:'\nendstream'};});
    objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[2]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+canvases.length+' >>';
    var max=2+canvases.length*3,parts=[encoder.encode('%PDF-1.4\n')],offsets=[0],length=parts[0].length;
    for(var n=1;n<=max;n++){offsets[n]=length;var head=encoder.encode(n+' 0 obj\n');parts.push(head);length+=head.length;var obj=objects[n];if(typeof obj==='string'){var body=encoder.encode(obj+'\nendobj\n');parts.push(body);length+=body.length;}else{var a=encoder.encode(obj.head);parts.push(a,obj.data);length+=a.length+obj.data.length;var z=encoder.encode(obj.tail+'\nendobj\n');parts.push(z);length+=z.length;}}
    var xref=length,table='xref\n0 '+(max+1)+'\n0000000000 65535 f \n';for(var j=1;j<=max;j++)table+=String(offsets[j]).padStart(10,'0')+' 00000 n \n';table+='trailer\n<< /Size '+(max+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';parts.push(encoder.encode(table));return new Blob(parts,{type:'application/pdf'});
  }
  function downloadPDF(){toast('message.generating');saveBlob(pdfBlob(reportCanvases()),filename('pdf'));}

  function renderPage(){if(cleanup){cleanup();cleanup=null;}var content=document.getElementById('content');content.textContent='';var page;if(state.route==='overview')page=renderOverview();else if(['device','battery','security','storage','network','peripherals'].indexOf(state.route)>=0)page=renderBase(state.route);else page=renderHardware(state.route);content.appendChild(page);renderNav();}
  function render(){shell();renderPage();}
  window.addEventListener('beforeunload',function(e){if(state.dirty&&applicable().some(function(p){return !completedStatus(state.hardware[p.id].status);})){e.preventDefault();e.returnValue='';}});
  window.MacCheckApp={getState:function(){return JSON.parse(JSON.stringify(state));},getReportMarkdown:markdown,getReportModel:reportModel,downloadReportPDF:downloadPDF,downloadReportPNG:downloadPNG,go:go};
  render();
})();
