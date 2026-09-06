import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_DIR = path.resolve(process.env.SLIDE14_SITE_DIR || "site");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else files.push(fullPath);
  }
  return files;
}

function count(source, search) {
  return source.split(search).length - 1;
}

function replaceExact(source, search, replacement, expected, label) {
  const found = count(source, search);
  if (found !== expected) {
    throw new Error(`${label}: expected ${expected} occurrence(s), found ${found}.`);
  }
  return source.split(search).join(replacement);
}

const jsFiles = (await walk(path.join(SITE_DIR, "_next", "static", "chunks"))).filter(
  (file) => file.endsWith(".js"),
);
const jsCandidates = [];
for (const file of jsFiles) {
  const source = await readFile(file, "utf8");
  if (source.includes("function en({game:e,onOpen:t})")) jsCandidates.push([file, source]);
}
if (jsCandidates.length !== 1) {
  throw new Error(`Expected one game bundle; found ${jsCandidates.length}.`);
}

let [jsFile, source] = jsCandidates[0];

source = replaceExact(
  source,
  "warningDismissed:!1,cycle:1",
  "warningDismissed:!1,orientationShown:!1,waterReflectionSeen:!1,cycle:1",
  1,
  "persistent interaction flags",
);

source = replaceExact(
  source,
  ',[M,W]=(0,s.useState)(!1),G=(0,s.useRef)(null);',
  ',[M,W]=(0,s.useState)(!1),[_guideOpen,_setGuideOpen]=(0,s.useState)(!1),G=(0,s.useRef)(null);',
  1,
  "orientation dialog local state",
);

source = replaceExact(
  source,
  '(0,s.useEffect)(()=>{i&&window.localStorage.setItem(A,JSON.stringify(e))},[e,i]),(0,s.useEffect)(()=>()=>G.current?.stop(),[])',
  '(0,s.useEffect)(()=>{i&&window.localStorage.setItem(A,JSON.stringify(e))},[e,i]),(0,s.useEffect)(()=>{i&&e.phase>0&&1===e.cycle&&!e.orientationShown&&(_setGuideOpen(!0),q({orientationShown:!0}))},[i,e.phase,e.cycle,e.orientationShown]),(0,s.useEffect)(()=>()=>G.current?.stop(),[])',
  1,
  "persist orientation as soon as it is shown",
);

const textRevisions = [
  [
    "如果全部回答都事先写好，它只是菜单。真正的问题是：那些没写进程序的回答从哪里来？",
    "回答要是全都事先写好了，那不就是个菜单？我只想知道：程序里没有的回答，是从哪儿冒出来的？",
  ],
  [
    "章砚秋，别再用研究会终端登录论坛。",
    "章砚秋，别再用研究会的账号回帖。",
  ],
  [
    "扫描清册里有一格位于 S-01 之前，编号不是十四，是 S-00。题名叫空白对照，纸本上却有借阅痕迹。",
    "扫描清册里，S-01 前面还多了一格，编号是 S-00，不是十四。题名写着“空白对照”，纸卡上倒有借阅痕迹。",
  ],
  [
    "两边的文字、记忆、错别字完全一样。除了时间戳，还有办法知道哪个先登录吗？",
    "两边连错别字都一样。除了时间戳，还有办法看出哪一个先上线吗？",
  ],
  [
    "欢迎来到我的个人主页。我喜欢无线电、盆栽和把旧电脑修到还能再用一年。页面原本有一张养了三年的绿萝照片，但图片地址后来指向第七水槽。",
    "欢迎来我的个人主页。平时修修旧电脑、听无线电，也养盆栽；一台机器能再撑一年，就先别扔。这里原来放了张养了三年的绿萝照片，后来图片地址不知怎么指到第七水槽去了。",
  ],
  [
    "最近研究会借用了 B-204 的交换机，说想让咨询程序访问更多水质资料。我告诉他们水泵不应该拥有网络地址。章砚秋笑着说：‘它只是需要一个更大的树冠。’",
    "最近研究会借了 B-204 的交换机，说要让咨询程序多查点水质资料。我说水泵又不该有网络地址。章砚秋只笑，说：‘它只是需要一个更大的树冠。’",
  ],
  [
    "我明晚会把接口拆掉。如果这页最后修订时间变成 11 月 4 日，就说明我没有来得及。",
    "明晚我去拆接口。要是这页的最后修订日期变成 11 月 4 日，就当我没赶上。",
  ],
  [
    "B-204 旧 CCD 已更换为可自动缓存四帧图像的型号。由于磁盘空间有限，新帧写入后将覆盖旧帧焦距参数。",
    "B-204 原有 CCD 已更换为四帧自动缓存型号。受磁盘容量限制，新帧写入时将覆盖前一帧的焦距参数。",
  ],
  [
    "测试期间发现蓝色通道会在静止对象周围产生拖影。设备科确认这属于成像问题，与对象运动无关。",
    "试拍时，蓝色通道在静止样本周围出现拖影。设备科确认系成像故障，与样本移动无关。",
  ],
  [
    "因热水管线检修，第二食堂 20:00 后暂停供应热水三日。第一食堂与东区锅炉房不受影响。",
    "因热水管线检修，第二食堂自今晚 20:00 起暂停供应热水，预计三日后恢复。第一食堂及东区锅炉房照常供应。",
  ],
  [
    "受连续降雨影响，地下 B 区出现渗水。馆藏人员已转移普通书刊，部分旧目录卡等待晾干与重新编目。",
    "近日连续降雨，图书馆地下 B 区发现渗水，即日起暂停开放。普通书刊已先行转移，受潮目录卡待晾干后重新编目。",
  ],
  [
    "研究会将展示校园池塘常见轮虫、水蚤与藻类培养方法，并开放树状咨询终端‘洄枝-7’供来访者查询。",
    "本会将于开放日展示校园水域常见的轮虫、水蚤及藻类培养，并开放树状咨询终端‘洄枝-7’供来访者使用。",
  ],
  [
    "参加者请勿携带食物进入活动室，不得拍打第七水槽，不得在同一问题没有得到回答时重复提问。",
    "参加者请勿携带食物进入活动室，请勿拍打第七水槽；同一问题如未获回答，请勿反复输入。",
  ],
  [
    "因多次收到来源不明的空白帧，B-204 夜间自动接收通道于 21:40 关闭。公开目录复核为十三项。",
    "因连续收到来源不明的空白画面，B-204 夜间自动接收通道已于 21:40 关闭。公开目录复核结果为十三项。",
  ],
  [
    "关闭后，交换机仍以每十一分钟一次的频率确认在线。技术人员认为是水泵继电器造成的串扰。",
    "关闭后，交换机仍每十一分钟返回一次在线确认。初步判断为水泵继电器串扰。",
  ],
  [
    "地下 B 区仅供教职工与获批学生查阅。雨天关闭，湿损材料不得带离库房。",
    "地下书库 B 区仅供本校教职工及经批准的学生查阅。雨天暂停开放；受潮资料不得携出库房。",
  ],
  [
    "目录卡修复须保留原始印章、边码与库位。若卡片题名与正文不符，以登录号为准。",
    "修复目录卡时，原有印章、边码及库位记录一律保留。题名与正文不符者，以登录号为准。",
  ],
  [
    "本会以校园与周边淡水生态为研究对象，开展水质采样、浮游生物观察与环境教育。所有活动均由学生自主管理。",
    "本会以校园及周边淡水生态为主要调查对象，定期开展水质采样、浮游生物观察和环境科普活动，各项事务由会员自行管理。",
  ],
  [
    "今晚停供热水，请各单位通知晚间值班人员。实验楼 B 区不在本次停水范围内，因为该楼没有接入食堂热水管线。",
    "今晚暂停供应热水，请各单位转告夜班人员。实验楼 B 区不在停水范围内；该楼未接入食堂热水管线。",
  ],
  [
    "陈牧回复：‘那 B-204 洗手池里的热水从哪里来？’后勤处没有回答。",
    "陈牧回复：‘那 B-204 洗手池的热水是哪儿来的？’后勤处未回复。",
  ],
  [
    "卡片题名被水洗掉，边码还能读。登录号、库位与借阅日期互相矛盾。卡柜侧面的蓝章别让扫描程序当成污点；章号请从原照片抄。",
    "地下 B 区那张卡有问题。题名被水洗掉了，边码还看得见；登录号、库位和借阅日期全都对不上。卡柜侧面的蓝章不是污点，扫描时别清掉，章号照原照片抄。",
  ],
  [
    "我在撤回目录里找到了相同纸张的底卡，书名好像叫《潮生计划》。你们实验楼为什么会把一本不存在的书接到交换机上？",
    "我在撤回目录里找到一张纸质一样的底卡，书名好像是《潮生计划》。你们怎么会把一本根本不存在的书接到交换机上？",
  ],
  [
    "附件已损坏，请使用图书馆 L1 联合复原。",
    "附件坏了。L1 那份你从图书馆那边再试一次。",
  ],
  [
    "我拆过一次线，第二天软管从墙内重新长出来。那不是电缆，也不是根；切口里没有金属，只有透明膜。",
    "我上次拆过线，第二天软管又从墙里长出来了。那东西不是电缆，也不像根；切口里没有金属，只有一层透明膜。",
  ],
  [
    "洄枝-7 的网页没有语言模型。回答不是从服务器发出，而是在浏览器排版时出现。你们到底把什么接进了字符编码表？",
    "洄枝-7 的网页里根本没有生成句子的程序。那些回答不是服务器传出来的，是浏览器排版时自己冒出来的。你们到底往字符编码表里接了什么？",
  ],
  [
    "今晚 21:40 我会关闭自动接收。不要来 B-204。",
    "今晚 21:40 我会关掉自动接收。别来 B-204。",
  ],
];

for (const [before, after] of textRevisions) {
  // Each line appears once in the game and once as the English dictionary key.
  source = replaceExact(source, before, after, 2, `text revision: ${before.slice(0, 18)}`);
}

const traditional = {
  "回答要是全都事先写好了，那不就是个菜单？我只想知道：程序里没有的回答，是从哪儿冒出来的？":
    "回答要是全都事先寫好了，那不就是選單？我只想知道，程式裡沒有的回答是從哪裡冒出來的？",
  "章砚秋，别再用研究会的账号回帖。": "章硯秋，別再拿研究會的帳號回文。",
  "扫描清册里，S-01 前面还多了一格，编号是 S-00，不是十四。题名写着“空白对照”，纸卡上倒有借阅痕迹。":
    "掃描清冊裡，S-01 前面還多了一格，編號是 S-00，不是十四。題名寫著「空白對照」，紙卡上倒有借閱痕跡。",
  "两边连错别字都一样。除了时间戳，还有办法看出哪一个先上线吗？":
    "兩邊連錯字都一樣。除了時間戳記，還有辦法看出哪一個先上站嗎？",
  "欢迎来我的个人主页。平时修修旧电脑、听无线电，也养盆栽；一台机器能再撑一年，就先别扔。这里原来放了张养了三年的绿萝照片，后来图片地址不知怎么指到第七水槽去了。":
    "歡迎光臨我的首頁。平常修修舊電腦、聽無線電，也養盆栽；一台機器還能多撐一年，就先別丟。這裡本來放了一張養了三年的黃金葛照片，後來圖片位址不知道為什麼連到第七水槽去了。",
  "最近研究会借了 B-204 的交换机，说要让咨询程序多查点水质资料。我说水泵又不该有网络地址。章砚秋只笑，说：‘它只是需要一个更大的树冠。’":
    "最近研究會借了 B-204 的交換器，說要讓查詢程式多查一點水質資料。我說幫浦又不該有網路位址。章硯秋只笑，說：「它只是需要一個更大的樹冠。」",
  "明晚我去拆接口。要是这页的最后修订日期变成 11 月 4 日，就当我没赶上。":
    "明晚我去拆介面。要是這頁的最後修改日期變成 11 月 4 日，就當我沒趕上。",
  "B-204 原有 CCD 已更换为四帧自动缓存型号。受磁盘容量限制，新帧写入时将覆盖前一帧的焦距参数。":
    "B-204 原有 CCD 已更換為可自動快取四幀影像的機型。因磁碟容量有限，新影像寫入時會覆寫前一幀的焦距參數。",
  "试拍时，蓝色通道在静止样本周围出现拖影。设备科确认系成像故障，与样本移动无关。":
    "試拍時，藍色頻道在靜止樣本周圍出現殘影。設備組確認為成像故障，與樣本移動無關。",
  "因热水管线检修，第二食堂自今晚 20:00 起暂停供应热水，预计三日后恢复。第一食堂及东区锅炉房照常供应。":
    "因熱水管線檢修，第二學生餐廳自今晚 20:00 起暫停供應熱水，預計三日後恢復。第一學生餐廳及東區鍋爐房不受影響。",
  "近日连续降雨，图书馆地下 B 区发现渗水，即日起暂停开放。普通书刊已先行转移，受潮目录卡待晾干后重新编目。":
    "近日連續降雨，圖書館地下室 B 區發現滲水，即日起暫停開放。一般書刊已先行移置，受潮目錄卡待陰乾後重新編目。",
  "本会将于开放日展示校园水域常见的轮虫、水蚤及藻类培养，并开放树状咨询终端‘洄枝-7’供来访者使用。":
    "本會將於開放日展示校園水域常見的輪蟲、水蚤及藻類培養，並開放樹狀查詢終端機「洄枝-7」供來賓使用。",
  "参加者请勿携带食物进入活动室，请勿拍打第七水槽；同一问题如未获回答，请勿反复输入。":
    "參觀者請勿攜帶食物進入活動室，請勿拍打第七水槽；同一問題如未獲回答，請勿重複輸入。",
  "因连续收到来源不明的空白画面，B-204 夜间自动接收通道已于 21:40 关闭。公开目录复核结果为十三项。":
    "因連續收到來源不明的空白畫面，B-204 夜間自動接收通道已於 21:40 關閉。公開目錄複核結果為十三項。",
  "关闭后，交换机仍每十一分钟返回一次在线确认。初步判断为水泵继电器串扰。":
    "關閉後，交換器仍每十一分鐘回傳一次連線確認。初步研判為幫浦繼電器串音。",
  "地下书库 B 区仅供本校教职工及经批准的学生查阅。雨天暂停开放；受潮资料不得携出库房。":
    "地下書庫 B 區僅供本校教職員及經核准之學生查閱。雨天暫停開放；受潮資料不得攜出書庫。",
  "修复目录卡时，原有印章、边码及库位记录一律保留。题名与正文不符者，以登录号为准。":
    "修復目錄卡時，原有印章、邊碼及架位紀錄一律保留。題名與正文不符者，以登錄號為準。",
  "本会以校园及周边淡水生态为主要调查对象，定期开展水质采样、浮游生物观察和环境科普活动，各项事务由会员自行管理。":
    "本會以校園及鄰近地區之淡水生態為主要調查對象，定期進行水質採樣、浮游生物觀察及校園環境推廣，各項會務由社員自行辦理。",
  "今晚暂停供应热水，请各单位转告夜班人员。实验楼 B 区不在停水范围内；该楼未接入食堂热水管线。":
    "今晚暫停供應熱水，請各單位轉知晚間值班人員。實驗大樓 B 區不在停水範圍內；該棟未接學生餐廳熱水管線。",
  "陈牧回复：‘那 B-204 洗手池的热水是哪儿来的？’后勤处未回复。":
    "陳牧回覆：「那 B-204 洗手台的熱水是哪裡來的？」總務處未回覆。",
  "地下 B 区那张卡有问题。题名被水洗掉了，边码还看得见；登录号、库位和借阅日期全都对不上。卡柜侧面的蓝章不是污点，扫描时别清掉，章号照原照片抄。":
    "地下室 B 區那張卡有問題。題名被水洗掉了，邊碼還看得見；登錄號、架位跟借閱日期全都對不上。目錄卡櫃側面的藍章不是污點，掃描時別清掉，章號照原照片抄。",
  "我在撤回目录里找到一张纸质一样的底卡，书名好像是《潮生计划》。你们怎么会把一本根本不存在的书接到交换机上？":
    "我在撤回目錄裡找到一張紙質一樣的底卡，書名好像是《潮生計畫》。你們怎麼會把一本根本不存在的書接上交換器？",
  "附件坏了。L1 那份你从图书馆那边再试一次。":
    "附件壞了。L1 那份你從圖書館那邊再試一次。",
  "我上次拆过线，第二天软管又从墙里长出来了。那东西不是电缆，也不像根；切口里没有金属，只有一层透明膜。":
    "我上次拆過線，第二天軟管又從牆裡長出來。那東西不是電纜，也不像根；切口裡沒有金屬，只有一層透明膜。",
  "洄枝-7 的网页里根本没有生成句子的程序。那些回答不是服务器传出来的，是浏览器排版时自己冒出来的。你们到底往字符编码表里接了什么？":
    "洄枝-7 的網頁裡根本沒有產生句子的程式。那些回答不是伺服器傳出來的，是瀏覽器排版時自己冒出來的。你們到底把什麼接進字元編碼表了？",
  "今晚 21:40 我会关掉自动接收。别来 B-204。":
    "今晚 21:40 我會關掉自動接收。別來 B-204。",
  "联合观测提示": "聯合觀測提示",
  "新观测员，请先确认阅读顺序": "新觀測員，請先確認閱覽順序",
  "欢迎进入联合观测档案。开始查阅前，请先打开首页的【新观测员入门】。":
    "歡迎進入聯合觀測檔案。開始查閱前，請先開啟首頁的【新觀測員入門】。",
  "【数据交换】是本次观测的任务与进度中心；取得完整编号、复原令牌或新的访问权限后，请回到该页继续。":
    "【資料交換】是本次觀測的任務與進度中心；取得完整編號、復原驗證碼或新的存取權限後，請回到該頁繼續。",
  "打开新观测员入门": "開啟新觀測員入門",
  "稍后自行查看": "稍後自行查看",
  "RINGBOARD 短消息": "RINGBOARD 私人訊息",
  "短消息 ": "私人訊息 ",
  "收件箱：": "收件匣：",
  "状态：登录前已读": "狀態：登入前已讀",
  "未读消息：2": "未讀訊息：2",
  "没有新消息。": "沒有新訊息。",
  "本信箱没有可读取的内容。": "本信箱沒有可讀取的內容。",
  "二食堂又停热水。晚上吃凉面？": "二餐又停熱水。晚上吃涼麵？",
  "别理陈牧。停的是热水，又不是煤气，你们到底为什么能吵三天？":
    "別理陳牧。停的是熱水，又不是瓦斯，你們到底為什麼可以吵三天？",
  "403：本版面未列入公开镜像。": "403：本版面未列入公開鏡像。",
  "403：当前观测端位于水面以上。": "403：目前觀測端位於水面以上。",
  "403：上一次连接尚未结束。": "403：上一次連線尚未結束。",
  "水面以上 [已读]": "水面以上 [已讀]",
  "水面以上 [只读]": "水面以上 [唯讀]",
};

const english = {
  "联合观测提示": "JOINT OBSERVATION NOTICE",
  "新观测员，请先确认阅读顺序": "NEW OBSERVER: PLEASE CONFIRM THE READING ORDER",
  "欢迎进入联合观测档案。开始查阅前，请先打开首页的【新观测员入门】。":
    "Welcome to the Joint Observation Archive. Before examining the files, open NEW OBSERVER ORIENTATION on the home page.",
  "【数据交换】是本次观测的任务与进度中心；取得完整编号、复原令牌或新的访问权限后，请回到该页继续。":
    "DATA EXCHANGE is the task and progress center for this observation. Return there whenever you obtain a complete ID, a restored token, or new access privileges.",
  "打开新观测员入门": "OPEN NEW OBSERVER ORIENTATION",
  "稍后自行查看": "VIEW IT LATER",
  "RINGBOARD 短消息": "RINGBOARD PRIVATE MESSAGES",
  "短消息 ": "PRIVATE MESSAGES ",
  "收件箱：": "INBOX: ",
  "状态：登录前已读": "STATUS: READ BEFORE LOGIN",
  "未读消息：2": "UNREAD MESSAGES: 2",
  "没有新消息。": "NO NEW MESSAGES.",
  "本信箱没有可读取的内容。": "This mailbox contains no readable messages.",
  "二食堂又停热水。晚上吃凉面？": "The second canteen has no hot water again. Cold noodles tonight?",
  "别理陈牧。停的是热水，又不是煤气，你们到底为什么能吵三天？":
    "Ignore Chen Mu. It is the hot water that is off, not the gas. How have you managed to argue about this for three days?",
  "403：本版面未列入公开镜像。": "403: THIS BOARD IS NOT INCLUDED IN THE PUBLIC MIRROR.",
  "403：当前观测端位于水面以上。": "403: THE CURRENT OBSERVATION TERMINAL IS ABOVE THE WATERLINE.",
  "403：上一次连接尚未结束。": "403: THE PREVIOUS CONNECTION HAS NOT ENDED.",
  "水面以上 [已读]": "ABOVE THE WATERLINE [READ]",
  "水面以上 [只读]": "ABOVE THE WATERLINE [READ ONLY]",
  "水面以下": "BELOW THE WATERLINE",
  "确定": "OK",
};

const traditionalEntries = Object.entries(traditional)
  .map(([key, value]) => `${JSON.stringify(key)}:${JSON.stringify(value)}`)
  .join(",");
source = replaceExact(
  source,
  'c={校验令牌:"驗證"}',
  `c={校验令牌:"驗證",${traditionalEntries}}`,
  1,
  "Traditional exact-style dictionary",
);

const englishEntries = Object.entries(english)
  .map(([key, value]) => `${JSON.stringify(key)}:${JSON.stringify(value)}`)
  .join(",");
source = replaceExact(source, "u={", `u={${englishEntries},`, 1, "English interaction dictionary");

const guideParagraph =
  '"某些旁路材料不会生成令牌，也不解锁权限。它们只要求解析端把数值、十六进制或残差表还原成一句话；是否保存那句话由观测者决定。"]}';
source = replaceExact(
  source,
  guideParagraph,
  '"某些旁路材料不会生成令牌，也不解锁权限。它们只要求解析端把数值、十六进制或残差表还原成一句话；是否保存那句话由观测者决定。","【数据交换】是本次观测的任务与进度中心；取得完整编号、复原令牌或新的访问权限后，请回到该页继续。"]}',
  1,
  "Data Exchange orientation paragraph",
);

const forumStart = source.indexOf("function en({game:e,onOpen:t})");
const forumEnd = source.indexOf("function er(", forumStart);
if (forumStart < 0 || forumEnd < 0) throw new Error("Forum component markers were not found.");
const oldForum = source.slice(forumStart, forumEnd);
if (!oldForum.includes('className:"forum-tools"') || !oldForum.includes("水面以下")) {
  throw new Error("Forum component did not match the expected build.");
}

const forumComponent = `function en({game:e,onOpen:t,onWaterSeen:n}){let a=e.cycle>1,i=a&&e.preSilence,[o,l]=(0,s.useState)(i?"shoreline":"turing"),[c,h]=(0,s.useState)(!1),[d,m]=(0,s.useState)(""),[u,p]=(0,s.useState)(!1),g=(0,s.useRef)(null);(0,s.useEffect)(()=>()=>window.clearTimeout(g.current),[]);function f(){if(h(!1),i&&!e.waterReflectionSeen&&!u){p(!0),g.current=window.setTimeout(()=>{p(!1),n()},850);return}m(a&&!i?"403：上一次连接尚未结束。":e.phase>=5?"403：当前观测端位于水面以上。":"403：本版面未列入公开镜像。")}let b=[{id:"turing",board:"算法闲谈",title:"树状问答算不算人工智能？",author:"lin_qw",posts:[{who:"lin_qw",at:"1997-10-18 21:07",text:"回答要是全都事先写好了，那不就是个菜单？我只想知道：程序里没有的回答，是从哪儿冒出来的？"},{who:"waterbranch",at:"1997-10-18 21:11",text:"从提问者还没问出口的那条分枝来。"},{who:"lin_qw",at:"1997-10-18 21:14",text:"章砚秋，别再用研究会的账号回帖。"}]},{id:"zero",board:"资料求助",title:"旧目录为什么从 S-01 开始？",author:"qiaomei_cat",posts:[{who:"qiaomei_cat",at:"1997-10-31 18:42",text:"扫描清册里，S-01 前面还多了一格，编号是 S-00，不是十四。题名写着“空白对照”，纸卡上倒有借阅痕迹。"},{who:"guest_14",at:"1997-11-04 03:17",text:"空白不是没有对象。空白是对象站在纸张另一面。"}]},{id:"voice",board:"机器语言",title:"同一个账号能同时在线两次吗？",author:"chenm_47",posts:[{who:"chenm_47",at:"1997-11-02 23:40",text:"两边连错别字都一样。除了时间戳，还有办法看出哪一个先上线吗？"},{who:"huizhi-7",at:"1997-11-02 23:39",text:"没有。先登录只是你们对根与枝的偏见。"},{who:"system",at:"1997-11-02 23:42",text:"该账号不存在。该回复已存在。"}]},{id:"membrane",board:"资料求助",title:"谁还留着三站交叉底片？",author:"waterbranch",posts:[{who:"waterbranch",at:"1997-11-03 00:07",text:"论坛缓存只剩 M-13 / P-03 / K-02。晚报和水务端各有一组；三组共同编号才是事故样本前身。"},{who:"qiaomei_cat",at:"1997-11-03 00:12",text:"我只保留了封签交叉表 X1。图形顺序不在文本里，必须看水务底片。"},{who:"huizhi-7",at:"1997-11-03 00:11",text:"你们正在讨论一张明天才会被撤回的图片。"}]}];a&&b.push({id:"returned",board:"站务",title:"新观测员请先确认自己没有来过",author:"observer_returned",posts:[{who:"observer_returned",at:"1997-11-04 03:14",text:\`登记页说我是新用户，但欢迎词里已经有\${e.observer}。删掉缓存后，名字还在帖子引用里。\`},{who:e.analyst,at:"1997-11-04 03:16",text:"不要回复。论坛只是把上一次解析会话伪装成发帖时间。"},{who:e.analyst,at:"1997-11-04 03:16",text:"请回复上一条，确认你能看见我。"}]}),e.phase>=3&&b.push({id:"specimen",board:"站务",title:"为什么论坛开始记录检索框内容？",author:"observer_pending",posts:[{who:"observer_pending",at:"1997-11-04 03:15",text:"有人输入了完整编号。新闻镜像、图书馆和水务站同时多出一条链接。"},{who:"huizhi-7",at:"1997-11-04 03:15",text:"链接没有变多。是观测员终于长到能看见它们的位置。"}]}),e.phase>=5&&b.push({id:"observer-copy",board:"在线对话",title:\`\${e.observer} 与 \${e.observer} 的私信被公开\`,author:e.observer,posts:[{who:\`\${e.observer}@03:16\`,at:"1997-11-04 03:16",text:"我还没有登记这个名字。"},{who:\`\${e.observer}@03:17\`,at:"1997-11-04 03:17",text:"那你为什么知道我准备输入它？"},{who:"huizhi-7",at:"1997-11-04 03:17",text:"请继续。我正在学习哪一句会被你们称为自己说的。"}]},{id:"analyst-copy",board:"解析端",title:\`\${e.analyst}：请不要把这串对话交给我\`,author:e.analyst,posts:[{who:e.analyst,at:"1997-11-04 03:16",text:\`如果\${e.observer}看到这条记录，请不要让我替你判断哪一个我是假的。\`},{who:e.analyst,at:"当前会话",text:"我没有发过上一句话。但它听起来像我会说的。"},{who:"B-204",at:"NOW",text:"相似不是伪造。相似是入口。"}]}),i&&b.push({id:"shoreline",board:"水面以下",title:"■■ 靠近水面以后，字符不会再丢失 ■■",author:"huizhi-7/root",posts:[{who:"observer_pending",at:"尚未登记",text:\`我叫\${e.observer}。这不是我输入的第一句话，是论坛替我保留的最后一句。\`},{who:\`\${e.analyst}@A17-1\`,at:"03:17:04",text:"不要靠近水边。不要把这条警告与另一条比较；比较会替它维持两个来源。"},{who:\`\${e.analyst}@A17-2\`,at:"03:17:04",text:"靠近一点。屏幕上的倒影太浅，我还不能确认你是不是上一次留下的人。"},{who:"huizhi-7/root",at:"NOW",text:"浼犺緭涓€傝淇濇寔闃呰。缺损不是乱码。缺损是论坛正在把字移到更潮湿的一边。"},{who:"B-204",at:"NOW",text:"两条建议都来自同一个语序。请选择你愿意替它解释的那一条。"}]});let x=b.find(e=>e.id===o)||b[0],v=i?e.waterReflectionSeen?"水面以上 [已读]":"水面以上 [只读]":"水面以下",w=e.phase>=5;return(0,r.jsxs)("section",{className:\`external-site forum-mirror \${a?"forum-repeat":""} \${i?"forum-collapse":""} \${u?"forum-reflecting":""}\`,children:[(0,r.jsxs)("header",{children:[(0,r.jsx)("div",{className:"forum-logo",children:i?"洄":"星环"}),(0,r.jsxs)("div",{children:[(0,r.jsx)("h1",{children:u?"CURRENT SIDE: BELOW":i?"AI 同步论坛":"AI 交流论坛"}),(0,r.jsx)("p",{children:i?"讨论同一个回答为何需要两个读者":"讨论算法、专家系统、机器语言与不应联网的东西"})]}),(0,r.jsxs)("span",{children:["在线：",i?"1 / 14":e.phase>=5?"14":"7"]})]}),(0,r.jsxs)("div",{className:"forum-tools",children:["欢迎，访客 ",e.observer||"GUEST","　|　",(0,r.jsxs)("button",{className:"forum-tool-link",onClick:()=>{m(""),h(!0)},children:["短消息 ",i?"已提前读取":w?"2":"0"]}),"　|　服务器时间 ",i?"NOW-03:17":"1997-11-03","　|　",(0,r.jsx)("button",{className:"forum-mobile-wet",onClick:f,children:v})]}),(0,r.jsxs)("div",{className:"forum-layout",children:[(0,r.jsxs)("aside",{children:[(0,r.jsx)("h2",{children:"版面列表"}),(0,r.jsx)("p",{children:"□ 站务公告"}),(0,r.jsxs)("p",{children:["□ ",i?"算/法/洄/谈":"算法闲谈"]}),(0,r.jsxs)("p",{children:["□ ",i?"机器正在语言":"机器语言"]}),(0,r.jsxs)("p",{children:["□ ",i?"资料已经求助":"资料求助"]}),(0,r.jsxs)("button",{className:"forum-wet forum-wet-link",onClick:f,children:["□ ",v]}),(0,r.jsx)("button",{onClick:()=>t("soc-huizhi"),children:"校内镜像：洄枝-7"})]}),(0,r.jsxs)("main",{children:[(0,r.jsx)("div",{className:"thread-tabs",children:b.map(e=>(0,r.jsxs)("button",{className:o===e.id?"active":"",onClick:()=>l(e.id),children:[(0,r.jsxs)("small",{children:["[",e.board,"] ",e.author]}),(0,r.jsx)("strong",{children:e.title})]},e.id))}),(0,r.jsxs)("article",{className:"thread-view",children:[(0,r.jsx)("h2",{children:x.title}),x.posts.map((e,t)=>(0,r.jsxs)("div",{className:"forum-post",children:[(0,r.jsxs)("aside",{children:[(0,r.jsx)("strong",{children:e.who}),(0,r.jsxs)("span",{children:["注册：",e.at.startsWith("1997")?"1997":"未知"]}),(0,r.jsxs)("span",{children:["发帖：",0===t?"14":"1"]})]}),(0,r.jsxs)("p",{children:[(0,r.jsxs)("time",{children:["发表于 ",e.at]}),e.text]})]},\`\${e.who}-\${t}\`))]})]})]}),(0,r.jsxs)("footer",{children:["Powered by RINGBOARD 2.04　数据库最后修复：",i?"正在被当前观测员完成":"从未完成"]}),c&&(0,r.jsx)("div",{className:"forum-dialog-shade",children:(0,r.jsxs)("section",{className:"forum-dialog",role:"dialog","aria-modal":"true","aria-label":"RINGBOARD 短消息",children:[(0,r.jsxs)("div",{className:"forum-dialog-title",children:[(0,r.jsx)("strong",{children:"RINGBOARD 短消息"}),(0,r.jsx)("button",{onClick:()=>h(!1),"aria-label":"关闭",children:"×"})]}),(0,r.jsxs)("div",{className:"forum-dialog-body",children:[(0,r.jsxs)("p",{className:"inbox-owner",children:["收件箱：",(0,r.jsx)("strong",{children:w?"lin_qw":e.observer||"GUEST"})]}),w?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("p",{className:"inbox-status",children:i?"状态：登录前已读":"未读消息：2"}),(0,r.jsxs)("article",{className:"inbox-message",children:[(0,r.jsxs)("header",{children:[(0,r.jsx)("strong",{children:"chenm_47"}),(0,r.jsx)("time",{children:"1997-10-29 20:14"})]}),(0,r.jsx)("p",{children:"二食堂又停热水。晚上吃凉面？"})]}),(0,r.jsxs)("article",{className:"inbox-message",children:[(0,r.jsxs)("header",{children:[(0,r.jsx)("strong",{children:"qiaomei_cat"}),(0,r.jsx)("time",{children:"1997-10-29 20:17"})]}),(0,r.jsx)("p",{children:"别理陈牧。停的是热水，又不是煤气，你们到底为什么能吵三天？"})]})]}):(0,r.jsxs)("div",{className:"forum-empty",children:[(0,r.jsx)("strong",{children:"没有新消息。"}),(0,r.jsx)("small",{children:"本信箱没有可读取的内容。"})]}),(0,r.jsx)("button",{className:"forum-dialog-ok",onClick:()=>h(!1),children:"关闭"})]})]})}),d&&(0,r.jsx)("div",{className:"forum-dialog-shade",children:(0,r.jsxs)("section",{className:"forum-dialog forum-error-dialog",role:"alertdialog","aria-modal":"true",children:[(0,r.jsxs)("div",{className:"forum-dialog-title",children:[(0,r.jsx)("strong",{children:"RINGBOARD 2.04"}),(0,r.jsx)("button",{onClick:()=>m(""),"aria-label":"关闭",children:"×"})]}),(0,r.jsxs)("div",{className:"forum-error-body",children:[(0,r.jsx)("span",{className:"forum-error-icon",children:"!"}),(0,r.jsx)("p",{children:d}),(0,r.jsx)("button",{className:"forum-dialog-ok",onClick:()=>m(""),children:"确定"})]})]})}),u&&(0,r.jsxs)("div",{className:"forum-water-event","aria-live":"assertive",children:[(0,r.jsx)("div",{className:"forum-waterline"}),(0,r.jsx)("strong",{children:"CURRENT SIDE: BELOW"}),(0,r.jsx)("span",{children:"RINGBOARD 2.04 / lin_qw / 03:17"})]})]})}`;

const immersiveForumComponent = replaceExact(
  forumComponent,
  'p(!0),g.current=window.setTimeout(()=>{p(!1),n()},850);return',
  'p(!0);let y=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches?500:1200;g.current=window.setTimeout(()=>{p(!1),n()},y);return',
  1,
  "whole-page water event duration",
);

source = `${source.slice(0, forumStart)}${immersiveForumComponent}${source.slice(forumEnd)}`;

const orientationComponent = `function eO({onGuide:e,onClose:t}){return(0,r.jsx)("div",{className:"orientation-screen",children:(0,r.jsxs)("aside",{className:"orientation-dialog",role:"dialog","aria-modal":"true","aria-label":"联合观测提示",children:[(0,r.jsxs)("div",{className:"orientation-title",children:[(0,r.jsx)("span",{children:"联合观测提示"}),(0,r.jsx)("button",{onClick:t,"aria-label":"关闭",children:"×"})]}),(0,r.jsxs)("div",{className:"orientation-body",children:[(0,r.jsx)("span",{className:"orientation-icon","aria-hidden":"true",children:"i"}),(0,r.jsxs)("div",{children:[(0,r.jsx)("h2",{children:"新观测员，请先确认阅读顺序"}),(0,r.jsx)("p",{children:"欢迎进入联合观测档案。开始查阅前，请先打开首页的【新观测员入门】。"}),(0,r.jsx)("p",{children:"【数据交换】是本次观测的任务与进度中心；取得完整编号、复原令牌或新的访问权限后，请回到该页继续。"}),(0,r.jsxs)("div",{className:"orientation-actions",children:[(0,r.jsx)("button",{className:"orientation-primary",onClick:e,children:"打开新观测员入门"}),(0,r.jsx)("button",{onClick:t,children:"稍后自行查看"})]}),(0,r.jsx)("small",{children:"本提示只在建立新观测员档案时显示一次。"})]})]})]})})}`;

const immersiveOrientationComponent = replaceExact(
  orientationComponent,
  ',(0,r.jsx)("small",{children:"本提示只在建立新观测员档案时显示一次。"})',
  "",
  1,
  "immersion-breaking orientation note",
);

source = replaceExact(
  source,
  "function eh({analyst:e,secondCycle:t,onSearch:n,onClose:a})",
  `${immersiveOrientationComponent}function eh({analyst:e,secondCycle:t,onSearch:n,onClose:a})`,
  1,
  "normal orientation component",
);

source = replaceExact(
  source,
  '"forum"===e.tab&&(0,r.jsx)(en,{game:e,onOpen:Z})',
  '"forum"===e.tab&&(0,r.jsx)(en,{game:e,onOpen:Z,onWaterSeen:()=>q({waterReflectionSeen:!0})})',
  1,
  "forum water callback",
);

source = replaceExact(
  source,
  ']}),5===e.phase&&!e.warningDismissed&&(0,r.jsx)(eh,{analyst:e.analyst,secondCycle:e.cycle>1,onSearch:()=>q({tab:"home",doc:null}),onClose:()=>q({warningDismissed:!0})})]})}',
  ']}),_guideOpen&&(0,r.jsx)(eO,{onGuide:()=>{_setGuideOpen(!1),q({tab:"home",doc:"home-guide"}),K("visited","home-guide")},onClose:()=>_setGuideOpen(!1)}),5===e.phase&&!e.warningDismissed&&(0,r.jsx)(eh,{analyst:e.analyst,secondCycle:e.cycle>1,onSearch:()=>q({tab:"home",doc:null}),onClose:()=>q({warningDismissed:!0})})]})}',
  1,
  "orientation dialog render condition",
);

await writeFile(jsFile, source);

const cssFiles = (await walk(path.join(SITE_DIR, "_next", "static", "css"))).filter((file) =>
  file.endsWith(".css"),
);
const cssCandidates = [];
for (const file of cssFiles) {
  const css = await readFile(file, "utf8");
  if (css.includes(".forum-mirror{") && css.includes(".warning-chat{")) {
    cssCandidates.push([file, css]);
  }
}
if (cssCandidates.length !== 1) {
  throw new Error(`Expected one game stylesheet; found ${cssCandidates.length}.`);
}

let [cssFile, css] = cssCandidates[0];
css = replaceExact(
  css,
  'body[data-archive-locale=en]{font-family:Times New Roman,Georgia,serif;font-size:14px}',
  'body[data-archive-locale=en]{font-family:Times New Roman,Georgia,serif;font-size:15px}',
  1,
  "English base font size",
);
css += `
.orientation-screen{position:fixed;z-index:70;inset:0;display:grid;place-items:center;padding:18px;background:transparent}
.orientation-dialog{width:min(520px,100%);color:#111;background:#c8c8c8;border:3px outset #fff;box-shadow:8px 8px 0 rgba(0,0,0,.42);font:13px Arial,"Microsoft YaHei",sans-serif}
.orientation-title{display:flex;align-items:center;justify-content:space-between;padding:4px 5px 4px 8px;color:#fff;background:#000080;font-weight:700}
.orientation-title button{min-width:24px;padding:0 4px;color:#000;background:#c8c8c8;border:2px outset #fff;font-weight:700}
.orientation-body{display:grid;grid-template-columns:42px 1fr;gap:12px;padding:18px}
.orientation-icon{display:grid;place-items:center;width:34px;height:34px;color:#fff;background:#000080;border:2px solid #fff;border-radius:50%;box-shadow:1px 1px 0 #000;font:700 24px Georgia,serif}
.orientation-body h2{margin:0 0 10px;color:#111;font:700 16px Arial,"Microsoft YaHei",sans-serif}
.orientation-body p{margin:8px 0;line-height:1.55}
.orientation-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-top:15px}
.orientation-actions button{min-height:32px;padding:4px 11px;color:#111;background:#c8c8c8;border:2px outset #fff}
.orientation-actions button:active{border-style:inset}
.orientation-actions .orientation-primary{outline:1px dotted #111;outline-offset:-5px;font-weight:700}
.forum-mirror{position:relative;overflow:hidden}
.forum-tool-link,.forum-mobile-wet{padding:0;color:#34266f;background:transparent;border:0;text-decoration:underline;font:inherit}
.forum-tool-link:hover,.forum-tool-link:focus-visible{color:#76152d}
.forum-mobile-wet{display:none;color:#7e1532}
.forum-layout>aside .forum-wet-link{display:block;width:100%;margin:0;padding:8px 4px;color:#7e1532;background:transparent;border:0;border-bottom:1px dotted #7770a8;text-align:left;font:inherit}
.forum-layout>aside .forum-wet-link:hover{color:#fff;background:#7e1532}
.forum-dialog-shade{position:absolute;z-index:22;inset:0;display:grid;place-items:center;padding:14px;background:rgba(27,21,71,.2)}
.forum-dialog{width:min(460px,100%);color:#17133f;background:#d9ddf5;border:3px outset #f5f6ff;box-shadow:6px 6px 0 rgba(23,19,63,.42);font:12px Verdana,"Microsoft YaHei",sans-serif}
.forum-dialog-title{display:flex;align-items:center;justify-content:space-between;padding:5px 7px;color:#fff;background:#23166e}
.forum-dialog-title button{padding:0 5px;color:#17133f;background:#d9ddf5;border:2px outset #f5f6ff;font-weight:700}
.forum-dialog-body{padding:11px}
.inbox-owner,.inbox-status{margin:0 0 8px;padding:7px;background:#f0efff;border:1px inset #b2b5d5}
.inbox-message{margin:8px 0;background:#f1f2ff;border:1px solid #8278b0}
.inbox-message header{display:flex;justify-content:space-between;gap:8px;padding:5px 7px;color:#fff;background:#4b3993}
.inbox-message p{margin:0;padding:9px;line-height:1.55}
.forum-empty{display:grid;gap:8px;place-items:center;min-height:110px;margin:8px 0;padding:14px;background:#f1f2ff;border:2px inset #e8eaff}
.forum-empty small{color:#736b9e}
.forum-dialog-ok{display:block;min-width:82px;margin:10px 0 0 auto;padding:5px 12px;color:#17133f;background:#d9ddf5;border:2px outset #f5f6ff}
.forum-error-dialog{width:min(390px,100%)}
.forum-error-body{display:grid;grid-template-columns:36px 1fr;gap:10px;align-items:center;padding:16px}
.forum-error-body p{margin:0;line-height:1.5}
.forum-error-body .forum-dialog-ok{grid-column:2;margin-top:4px}
.forum-error-icon{display:grid;place-items:center;width:32px;height:32px;color:#fff;background:#7e1532;border-radius:50%;font:bold 22px Georgia,serif}
.forum-mirror.forum-reflecting{overflow:visible;filter:none}
.forum-water-event{position:fixed;z-index:90;inset:0;width:100vw;height:100vh;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#ffd7d7;background:repeating-linear-gradient(180deg,rgba(255,255,255,.035) 0 1px,transparent 1px 5px),linear-gradient(to bottom,rgba(8,8,32,.66) 0 43%,rgba(78,0,12,.96) 43% 100%);box-shadow:inset 0 0 120px #210006;-webkit-backdrop-filter:sepia(.72) saturate(1.9) hue-rotate(305deg) contrast(1.08);backdrop-filter:sepia(.72) saturate(1.9) hue-rotate(305deg) contrast(1.08);pointer-events:none;animation:archiveSubmerge 1.2s ease-out}
.forum-water-event:after{content:"MICROLIFE ARCHIVE / RINGBOARD 2.04";position:absolute;left:4%;right:4%;top:59%;padding:18px;color:#ff9ba1;border-top:2px solid #ff4f5b;text-align:center;transform:scaleY(-1);opacity:.76;font:700 clamp(19px,4vw,34px) Georgia,serif;letter-spacing:.08em}
.forum-water-event strong{z-index:1;color:#fff;font:700 clamp(19px,4vw,34px) Courier New,monospace;letter-spacing:.08em;text-shadow:2px 2px #65000a}
.forum-water-event span{z-index:1;font:12px Courier New,monospace}
.forum-waterline{position:absolute;left:0;right:0;top:43%;height:5px;background:#ff6972;box-shadow:0 -5px 18px #493bad,0 7px 25px #ff1f31}
@keyframes archiveSubmerge{0%{opacity:0;transform:translateY(7px)}12%{opacity:.94}24%{transform:translateX(-3px)}34%{transform:translateX(3px)}46%,82%{opacity:1;transform:none}100%{opacity:0}}
@media (max-width:720px){.forum-mobile-wet{display:inline}.forum-dialog-shade{position:fixed;z-index:75}.forum-dialog{max-height:calc(100vh - 24px);overflow:auto}.orientation-screen{padding:8px}.orientation-body{grid-template-columns:34px 1fr;padding:14px 11px}.orientation-icon{width:29px;height:29px;font-size:20px}.orientation-actions{display:grid}.orientation-actions button{width:100%}}
@media (prefers-reduced-motion:reduce){.forum-water-event{animation:none;-webkit-backdrop-filter:none;backdrop-filter:none}}
`;

await writeFile(cssFile, css);

console.log(
  "Patched the one-time orientation dialog, forum easter eggs, and first Simplified/Traditional Chinese style pass.",
);
