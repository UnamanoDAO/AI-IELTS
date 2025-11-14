接口说明
更新时间：2025-07-30 17:51:07
产品详情
我的收藏
长文本语音合成功能提供了将超长文本（如千字或者万字）合成为语音二进制数据的功能。

←返回语音合成产品详情页

计费和并发限制
异步长文本语音合成仅提供商用版，不支持试用，详情请参见试用版和商用版。要使用该功能，请开通商用版，详情请参见试用版升级为商用版。

计费方式详情请参见计费方式。

并发限制请参见并发和QPS说明。

新推出超高清合成声音
持续新增多个超高清合成声音，可提供超高音质合成效果，采样率高达48 kHz，无损声音，纤毫毕现。

超高清样音试听：

知琪（zhiqi）

知厨（zhichu）

更多合成效果可至语音合成产品详情页进行体验。

功能介绍
支持输出PCM、WAV和MP3编码格式数据。

支持设置语速、语调和音量。

支持设置男声、女声。

仅支持异步方式获取合成结果。

RESTful API支持句级别时间戳。详情请参见时间戳功能介绍。

长文本语音合成服务相比语音合成服务有其独特优势：

支持更长文字输入：一次性合成最高10万字符，其中1个汉字、1个英文字母、1个标点或1个句子中间空格均算作1个字符。

合成速度快：每合成5万字符最快仅需10分钟。

循环使用：合成文件支持应用端缓存，可循环使用。

专属声音：按场景打造专属精品声音，完美贴合阅读小说、新闻、视频配音等场景。

提交长文本语音合成请求后，合成结果在3小时内完成，音频文件在服务端可保存7天。

支持多情感声音支持调用，具体请参见标记语言介绍中的<emotion>标签。标签不算作字符。

重要
使用长文本语音合成功能，需要将SDK更新至最新版本。

音色列表









名称

voice参数值

类型

适用场景

支持语言

支持采样率（Hz）

支持字/句级别时间戳

支持儿化音

声音品质

阿斌

abin

广东普通话

对话数字人

支持中文及中英文混合场景

8K/16K/24K/48K

否

否

标准版

知小白

zhixiaobai

普通话女声

对话数字人

支持中文及中英文混合场景

8K/16K/24K/48K

否

是

标准版

知小夏

zhixiaoxia

普通话女声

对话数字人

支持中文及中英文混合场景

8K/16K/24K/48K

否

是

标准版

知小妹

zhixiaomei

普通话女声

直播数字人

支持中文及中英文混合场景

8K/16K/24K

是

是

标准版

知柜

zhigui

普通话女声

直播数字人

支持中文及中英文混合场景

8K/16K

是

是

标准版

知硕

zhishuo

普通话男声

客服数字人

支持中文及中英文混合场景

8K/16K

是

是

标准版

艾夏

aixia

普通话女声

客服数字人

支持中文及中英文混合场景

8K/16K

是

是

标准版

Cally

cally

美式英文女声

英语口语对话数字人

仅支持纯英文场景

8K/16K

是

是

标准版

知锋_多情感

zhifeng_emo

多种情感男声

通用场景

中文及中英文混合场景

8K/16K/24K

是

是

标准版

知冰_多情感

zhibing_emo

多种情感男声

通用场景

纯中文场景

8K/16K/24K

是

是

标准版

知妙_多情感

zhimiao_emo

多种情感女声

中英场景

中文及英文场景

8K/16K

是

是

标准版

知米_多情感

zhimi_emo

多种情感女声

通用场景

中文及中英文混合场景

8K/16K

是

否

标准版

知燕_多情感

zhiyan_emo

多种情感女声

通用场景

中文及中英文混合场景

8K/16K

是

否

标准版

知贝_多情感

zhibei_emo

多种情感童声

通用场景

中文及中英文混合场景

8K/16K

是

否

标准版

知甜_多情感

zhitian_emo

多种情感女声

通用场景

中文及中英文混合场景

8K/16K

是

否

标准版

小云

xiaoyun

标准女声

通用场景

中文及中英文混合场景

8K/16K

否

否

lite版

小刚

xiaogang

标准男声

通用场景

中文及中英文混合场景

8K/16K

否

否

lite版

若兮

ruoxi

温柔女声

通用场景

中文及中英文混合场景

8K/16K/24K

否

否

标准版

思琪

siqi

温柔女声

通用场景

中文及中英文混合场景

8K/16K/24K

是

否

标准版

思佳

sijia

标准女声

通用场景

中文及中英文混合场景

8K/16K/24K

否

否

标准版

思诚

sicheng

标准男声

通用场景

中文及中英文混合场景

8K/16K/24K

是

否

标准版

艾琪

aiqi

温柔女声

通用场景

中文及中英文混合场景

8K/16K

是

否

标准版

艾佳

aijia

标准女声

通用场景

中文及中英文混合场景

8K/16K

是

否

标准版

艾诚

aicheng

标准男声

通用场景

中文及中英文混合场景

8K/16K

是

否

标准版

艾达

aida

标准男声

通用场景

中文及中英文混合场景

8K/16K

是

否

标准版

宁儿

ninger

标准女声

通用场景

纯中文场景

8K/16K/24K

否

否

标准版

瑞琳

ruilin

标准女声

通用场景

纯中文场景

8K/16K/24K

否

否

标准版

思悦

siyue

温柔女声

客服场景

中文及中英文混合场景

8K/16K/24K

是

否

标准版

艾雅

aiya

严厉女声

客服场景

中文及中英文混合场景

8K/16K

是

否

标准版

艾美

aimei

甜美女声

客服场景

中文及中英文混合场景

8K/16K

是

否

标准版

艾雨

aiyu

自然女声

客服场景

中文及中英文混合场景

8K/16K

是

否

标准版

艾悦

aiyue

温柔女声

客服场景

中文及中英文混合场景

8K/16K

是

否

标准版

艾婧

aijing

严厉女声

客服场景

中文及中英文混合场景

8K/16K

是

否

标准版

小美

xiaomei

甜美女声

客服场景

中文及中英文混合场景

8K/16K/24K

否

否

标准版

艾娜

aina

浙普女声

客服场景

纯中文场景

8K/16K

是

否

标准版

伊娜

yina

浙普女声

客服场景

纯中文场景

8K/16K/24K

否

否

标准版

思婧

sijing

严厉女声

客服场景

纯中文场景

8K/16K/24K

是

否

标准版

思彤

sitong

儿童音

童声场景

纯中文场景

8K/16K/24K

否

否

标准版

小北

xiaobei

萝莉女声

童声场景

纯中文场景

8K/16K/24K

是

否

标准版

艾彤

aitong

儿童音

童声场景

纯中文场景

8K/16K

是

否

标准版

艾薇

aiwei

萝莉女声

童声场景

纯中文场景

8K/16K

是

否

标准版

艾宝

aibao

萝莉女声

童声场景

纯中文场景

8K/16K

是

否

标准版

Harry

harry

英音男声

英文场景

英文场景

8K/16K

否

否

标准版

Abby

abby

美音女声

英文场景

英文场景

8K/16K

是

否

标准版

Andy

andy

美音男声

英文场景

英文场景

8K/16K

是

否

标准版

Eric

eric

英音男声

英文场景

英文场景

8K/16K

是

否

标准版

Emily

emily

英音女声

英文场景

英文场景

8K/16K

是

否

标准版

Luna

luna

英音女声

英文场景

英文场景

8K/16K

是

否

标准版

Luca

luca

英音男声

英文场景

英文场景

8K/16K

是

否

标准版

Wendy

wendy

英音女声

英文场景

英文场景

8K/16K/24K

否

否

标准版

William

william

英音男声

英文场景

英文场景

8K/16K/24K

否

否

标准版

Olivia

olivia

英音女声

英文场景

英文场景

8K/16K/24K

否

否

标准版

姗姗

shanshan

粤语女声

方言场景

标准粤文（简体）及粤英文混合场景

8K/16K/24K

否

否

标准版

艾媛

aiyuan

知心姐姐

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾颖

aiying

软萌童声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾祥

aixiang

磁性男声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾墨

aimo

情感男声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾晔

aiye

青年男声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾婷

aiting

电台女声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾凡

aifan

情感女声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

Lydia

lydia

英中双语女声

英文场景

英文及英中文混合场景

8K/16K

是

否

标准版

小玥

chuangirl

四川话女声

方言场景

中文及中英文混合场景

8K/16K

否

否

标准版

艾硕

aishuo

自然男声

客服场景

中文及中英文混合场景

8K/16K

是

否

标准版

青青

qingqing

中国台湾话女声

方言场景

纯中文场景

8K/16K

否

否

标准版

翠姐

cuijie

东北话女声

方言场景

纯中文场景

8K/16K

是

是

标准版

小泽

xiaoze

湖南重口音男声

方言场景

纯中文场景

8K/16K

否

否

标准版

艾楠

ainan

广告男声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾浩

aihao

资讯男声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾茗

aiming

诙谐男声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾笑

aixiao

资讯女声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾厨

aichu

舌尖男声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾倩

aiqian

资讯女声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

智香

tomoka

日语女声

多语种场景

纯日文场景

8K/16K

是

否

标准版

智也

tomoya

日语男声

多语种场景

纯日文场景

8K/16K

是

否

标准版

Annie

annie

美语女声

英文场景

纯英文场景

8K/16K

是

否

标准版

艾树

aishu

资讯男声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

艾茹

airu

新闻女声

文学场景

中文及中英文混合场景

8K/16K

是

是

精品版

佳佳

jiajia

粤语女声

方言场景

标准粤文（简体）及粤英文混合场景

8K/16K

是

否

标准版

Indah

indah

印尼语女声

多语种场景

纯印尼语场景

8K/16K

否

否

标准版

桃子

taozi

粤语女声

方言场景

支持标准粤文（简体）及粤英文混合场景

8K/16K

是

否

标准版

柜姐

guijie

亲切女声

通用场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

Stella

stella

知性女声

通用场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

Stanley

stanley

沉稳男声

通用场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

Kenny

kenny

沉稳男声

通用场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

Rosa

rosa

自然女声

通用场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

Farah

farah

马来语女声

多语种场景

仅支持纯马来语场景

8K/16K

否

否

标准版

马树

mashu

儿童剧男声

通用场景

通用场景

8K/16K

是

否

标准版

知琪

zhiqi

温柔女声

超高清场景

支持中文及中英文混合场景

8K/16K/24K/48K

是

否

精品版

知厨

zhichu

舌尖男声

超高清场景

支持中文及中英文混合场景

8K/16K/24K/48K

是

是

精品版

小仙

xiaoxian

亲切女声

直播场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

悦儿

yuer

儿童剧女声

通用场景

仅支持纯中文场景

8K/16K

是

否

标准版

猫小美

maoxiaomei

活力女声

直播场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

知祥

zhixiang

磁性男声

超高清场景

支持中文及中英文混合场景

8K/16K/24K/48K

是

否

精品版

知佳

zhijia

标准女声

超高清场景

支持中文及中英文混合场景

8K/16K/24K/48K

是

否

精品版

知楠

zhinan

广告男声

超高清场景

支持中文及中英文混合场景

8K/16K/24K/48K

是

否

精品版

知倩

zhiqian

资讯女声

超高清场景

支持中文及中英文混合场景

8K/16K/24K/48K

是

否

精品版

知茹

zhiru

新闻女声

超高清场景

支持中文及中英文混合场景

8K/16K/24K/48K

是

否

精品版

知德

zhide

新闻男声

超高清场景

支持中文及中英文混合场景

8K/16K/24K/48K

是

否

精品版

知飞

zhifei

激昂解说

超高清场景

支持中文及中英文混合场景

8K/16K

是

否

精品版

艾飞

aifei

激昂解说

直播场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

亚群

yaqun

卖场广播

直播场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

巧薇

qiaowei

卖场广播

直播场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

大虎

dahu

东北话男声

方言场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

ava

ava

美语女生

英文场景

仅支持纯英文场景

8K/16K

是

否

标准版

知伦

zhilun

悬疑解说

超高清场景

支持中文及中英文混合场景

8K/16K

是

否

精品版

艾伦

ailun

悬疑解说

直播场景

支持中文及中英文混合场景

8K/16K

是

是

标准版

杰力豆

jielidou

治愈童声

童声场景

仅支持纯中文场景

8K/16K

是

是

标准版

知薇

zhiwei

萝莉女声

超高清场景

仅支持纯中文场景

8K/16K/24K/48K

是

否

精品版

老铁

laotie

东北老铁

直播场景

仅支持纯中文场景

8K/16K

是

是

标准版

老妹

laomei

吆喝女声

直播场景

仅支持纯中文场景

8K/16K

是

是

标准版

艾侃

aikan

天津话男声

方言场景

仅支持纯中文场景

8K/16K

是

是

标准版

Tala

tala

菲律宾语女声

多语种场景

仅支持菲律宾语场景

8K/16K

否

否

标准版

知甜

zhitian

甜美女声

通用场景

支持中文及中英文混合场景

8K/16K

是

否

精品版

知青

zhiqing

中国台湾话女生

方言场景

仅支持纯中文场景

8K/16K

是

否

精品版

Tien

tien

越南语女声

多语种场景

仅支持越南语场景

8K/16K

否

否

标准版

Becca

becca

美语客服女声

美式英文

仅支持纯英语场景

8K/16K

否

否

标准版

Kyong

Kyong

韩语女声

韩语场景

韩语

8K/16K

否

否

标准版

masha

masha

俄语女声

俄语场景

俄语

8K/16K

否

否

标准版

camila

camila

西班牙语女声

西班牙语场景

西班牙语

8k/16k

否

否

标准版

perla

perla

意大利语女声

意大利语场景

意大利语

8k/16k

否

否

标准版

知猫

zhimao

普通话女声

直播

中文

8k/16k

是

否

标准版

知媛

zhiyuan

普通话女声

通用场景

中文

8k/16k

是

否

标准版

知雅

zhiya

普通话女声

客服

中文

8k/16k

是

否

标准版

知悦

zhiyue

普通话女声

通用场景

中文

8k/16k

是

否

标准版

知达

zhida

普通话男声

通用场景

中文及中英文混合场景

8k/16k

是

否

标准版

知莎

zhistella

普通话女声

通用场景

中文

8k/16k

是

否

标准版

Kelly

kelly

香港粤语女声

方言场景

香港粤语

8k/16k

是

否

标准版

clara

clara

法语女声

通用场景

法语

8k/16k

否

否

标准版

hanna

hanna

德语女声

通用场景

德语

8k/16k

否

否

标准版

waan

waan

泰语女声

通用场景

泰语

8k/16k

否

否

标准版

betty

betty

美式英文女声

通用场景

美式英文

8k/16k

是

否

标准版

beth

beth

美式英文女声

通用场景

美式英文

8k/16k

是

否

标准版

cindy

cindy

美式英文女声

通用场景

美式英文

8k/16k

是

否

标准版

donna

donna

美式英文女声

通用场景

美式英文

8k/16k

是

否

标准版

eva

eva

美式英文女声

通用场景

美式英文

8k/16k

是

否

标准版

brian

brian

美式英文男声

通用场景

美式英文

8k/16k

是

否

标准版

david

david

美式英文男声

通用场景

美式英文

8k/16k/24k

是

否

标准版

abby_ecmix

abby_ecmix

美式英文女声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

annie_ecmix

annie_ecmix

美式英文女声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

andy_ecmix

andy_ecmix

美式英文男声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

ava_ecmix

ava_ecmix

美式英文女声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

betty_ecmix

betty_ecmix

美式英文女声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

beth_ecmix

beth_ecmix

美式英文女声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

brian_ecmix

brian_ecmix

美式英文男声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

cindy_ecmix

cindy_ecmix

美式英文女声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

cally_ecmix

cally_ecmix

美式英文女声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

donna_ecmix

donna_ecmix

美式英文女声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

david_ecmix

david_ecmix

美式英文男声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

eva_ecmix

eva_ecmix

美式英文女声

通用场景

英文及英中文混合场景

8k/16k/24k

是

否

标准版

多情感声音支持说明
只有多情感发音人模型才可以支持多情感选择。多情感声音支持的情感如下表所示，每个音色支持的情感分类不完全相同，主要包括：neutral（中性）、happy（开心）、angry（生气）、sad（悲伤）、fear（害怕）、hate（憎恨）、surprise（惊讶）、arousal（激动）、serious（严肃）、disgust（厌恶）、jealousy（嫉妒）、embarrassed（尴尬）、frustrated（沮丧）、affectionate（深情）、gentle（温柔）、newscast（播报）、customer-service（客服）、story（小说）、living（直播）。




音色名

voice参数值

情感分类（emotion category）

知锋_多情感

zhifeng_emo

angry，fear，happy，neutral，sad，surprise

知冰_多情感

zhibing_emo

angry，fear，happy，neutral，sad，surprise

知妙_多情感

zhimiao_emo

serious，sad，disgust，jealousy，embarrassed，happy，fear，surprise，neutral，frustrated，affectionate，gentle，angry，newscast，customer-service，story，living

知米_多情感

zhimi_emo

angry，fear，happy，hate，neutral，sad，surprise

知燕_多情感

zhiyan_emo

neutral，happy，angry，sad，fear，hate，surprise，arousal

知贝_多情感

zhibei_emo

neutral，happy，angry，sad，fear，hate，surprise

知甜_多情感

zhitian_emo

neutral，happy，angry，sad，fear，hate，surprise

调用说明
传入文本必须采用UTF-8编码。

长文本语音合成和语音合成在很多地方都是相似的，可进行对比。

服务地址




访问类型

说明

URL

Host

外网访问

所有服务器均可使用外网访问URL（SDK中默认设置了外网访问URL，不需您设置）

https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async

nls-gateway-cn-shanghai.aliyuncs.com

阿里云上海ECS内网访问

使用阿里云上海ECS（ECS地域为华东2（上海）），可使用内网访问URL。 ECS的经典网络不能访问AnyTunnel，即不能在内网访问语音服务；如果希望使用AnyTunnel，需要创建专有网络在其内部访问。

说明
使用内网访问方式，将不产生ECS实例的公网流量费用。

关于ECS的网络类型请参见网络类型。

http://nls-gateway-cn-shanghai-internal.aliyuncs.com/rest/v1/tts/async

nls-gateway-cn-shanghai-internal.aliyuncs.com

交互流程
客户端向服务端发送携带文本内容的HTTPS POST方法的请求，服务端返回对应的处理。此后客户端有两种处理方式：

主动轮询合成状态，直至合成完成。

等待服务端全部完成语音合成后主动回调用户设置的回调地址，此时用户端程序可以继续进行后续处理。

说明
不同于语音合成的RESTful接口，长文本语音合成RESTful接口并不会把实际的合成数据直接返回给客户端，而是返回一个HTTP地址，您可以通过该HTTP地址下载录音文件或者播放。

服务端的响应除了音频流之外，都会在返回信息的header包含本次识别任务的task_id参数，是本次请求的唯一标识。

image
请求参数
异步长文本语音合成的请求参数如下表所示。

发送HTTP/HTTPS请求时需要将这些参数设置到请求体（Body）中。





名称

类型

是否必选

描述

appkey

String

是

应用Appkey。更多信息，请参见管理项目。

token

String

否

服务鉴权Token。

text

String

是

待合成的文本，需要为UTF-8编码。

说明
调用某音色的多情感内容，需要在text中加上ssml-emotion标签，详情请参见<emotion>。

只有支持多情感的音色，才能使用<emotion>标签，否则会报错：Illegal ssml text。

format

String

是

音频编码格式，支持pcm/wav/mp3格式。默认值：pcm。

sample_rate

Integer

是

音频采样率，支持16000 Hz和8000 Hz，默认是16000 Hz。

voice

String

否

发音人，默认是xiaoyun。更多发音人请参见音色列表。

volume

Integer

否

音量，范围是0~100，默认50。

speech_rate

Integer

否

语速，范围是-500~500，默认是0。

pitch_rate

Integer

否

语调，范围是-500~500，默认是0。

enable_subtitle

Boolean

否

是否启用句级时间戳功能，默认值为false。

enable_notify

Boolean

是

是否启用回调功能，默认值为false。

notify_url

String

否

回调服务的地址。当enable_notify取值为true时，本字段必填。

URL支持HTTP/HTTPS协议，Host不能使用IP地址。

服务状态码
在服务的每一次响应中，都包含status字段，即服务状态码，状态码各种取值含义如下。

通用错误码




状态码

状态消息

原因

解决方案

40000000

默认的客户端错误码，对应了多个错误消息。

用户使用了不合理的参数或者调用逻辑。

请参考官网文档示例代码进行对比测试验证。

40000001

The token 'xxx' has expired；

The token 'xxx' is invalid

用户使用了不合理的参数或者调用逻辑。通用客户端错误码，通常是涉及Token相关的不正确使用，例如Token过期或者非法。

请参考官网文档示例代码进行对比测试验证。

40000002

Gateway:MESSAGE_INVALID:Can't process message in state'FAILED'!

无效或者错误的报文消息。

请参考官网文档示例代码进行对比测试验证。

40000003

PARAMETER_INVALID;

Failed to decode url params

用户传递的参数有误，一般常见于RESTful接口调用。

请参考官网文档示例代码进行对比测试验证。

40000005

Gateway:TOO_MANY_REQUESTS:Too many requests!

并发请求过多。

如果是试用版调用，建议您升级为商用版本以增大并发。

如果已是商用版，可购买并发资源包，扩充您的并发额度。

40000009

Invalid wav header!

错误的消息头。

如果您发送的是WAV语音文件，且设置format为wav，请注意检查该语音文件的WAV头是否正确，否则可能会被服务端拒绝。

40000009

Too large wav header!

传输的语音WAV头不合法。

建议使用PCM、OPUS等格式发送音频流，如果是WAV，建议关注语音文件的WAV头信息是否为正确的数据长度大小。

40000010

Gateway:FREE_TRIAL_EXPIRED:The free trial has expired!

试用期已结束，并且未开通商用版、或账号欠费。

请登录控制台确认服务开通状态以及账户余额。

40010001

Gateway:NAMESPACE_NOT_FOUND:RESTful url path illegal

不支持的接口或参数。

请检查调用时传递的参数内容是否和官网文档要求的一致，并结合错误信息对比排查，设置为正确的参数。

比如您是否通过curl命令执行RESTful接口请求， 拼接的URL是否合法。

40010003

Gateway:DIRECTIVE_INVALID:[xxx]

客户端侧通用错误码。

表示客户端传递了不正确的参数或指令，在不同的接口上有对应的详细报错信息，请参考对应文档进行正确设置。

40010004

Gateway:CLIENT_DISCONNECT:Client disconnected before task finished!

在请求处理完成前客户端主动结束。

无，或者请在服务端响应完成后再关闭链接。

40010005

Gateway:TASK_STATE_ERROR:Got stop directive while task is stopping!

客户端发送了当前不支持的消息指令。

请参考官网文档示例代码进行对比测试验证。

40020105

Meta:APPKEY_NOT_EXIST:Appkey not exist!

使用了不存在的Appkey。

请确认是否使用了不存在的Appkey，Appkey可以通过登录控制台后查看项目配置。

40020106

Meta:APPKEY_UID_MISMATCH:Appkey and user mismatch!

调用时传递的Appkey和Token并非同一个账号UID所创建，导致不匹配。

请检查是否存在两个账号混用的情况，避免使用账号A名下的Appkey和账号B名下生成的Token搭配使用。

403

Forbidden

使用的Token无效，例如Token不存在或者已过期。

请设置正确的Token。Token存在有效期限制，请及时在过期前获取新的Token。

41000003

MetaInfo doesn't have end point info

无法获取该Appkey的路由信息。

请检查是否存在两个账号混用的情况，避免使用账号A名下的Appkey和账号B名下生成的Token搭配使用。

41010101

UNSUPPORTED_SAMPLE_RATE

不支持的采样率格式。

当前实时语音识别只支持8000 Hz和16000 Hz两种采样率格式的音频。

41040201

Realtime:GET_CLIENT_DATA_TIMEOUT:Client data does not send continuously!

获取客户端发送的数据超时失败。

客户端在调用实时语音识别时请保持实时速率发送，发送完成后及时关闭链接。

50000000

GRPC_ERROR:Grpc error!

受机器负载、网络等因素导致的异常，通常为偶发出现。

一般重试调用即可恢复。

50000001

GRPC_ERROR:Grpc error!

受机器负载、网络等因素导致的异常，通常为偶发出现。

一般重试调用即可恢复。

52010001

GRPC_ERROR:Grpc error!

受机器负载、网络等因素导致的异常，通常为偶发出现。

一般重试调用即可恢复。

语音合成/长文本语音合成错误码




状态码

状态消息

原因

解决方案

21050000

SUCCESS

成功。

无。

21050001

RUNNING

异步长文本语音合成任务运行中。

请稍后再发送GET方式的识别结果查询请求。

21050002

QUEUEING

异步长文本语音合成任务排队中。

请稍后再发送GET方式的识别结果查询请求。

40000001

Gateway:ACCESS_DENIED:No privilege to this voice!

设置了错误的发音人名称。

请参考官网文档，设置正确的发音人。

40000004

Gateway:IDLE_TIMEOUT:Websocket session is idle for too long time,the last directive is 'StartSynthesis'!

请求建立链接后，长时间没有发送任何数据，超过10s后服务端会返回此错误信息。

请求处理完成后请及时关闭链接，此外，当服务端瞬时压力过大不能及时返回数据时也可能出现此错误，此时可以重试恢复。

40010003

Gateway:DIRECTIVE_INVALID:No text specified!

没有设置有效的待合成文本文字。

请参考官网文档示例代码设置待合成的文本。

41020001

语音合成调用客户端错误

可能有多个错误消息，需根据对应的错误消息调整。

如果提示Engine return error code: 424.表示传递的背景音乐或拼接录音不符合格式，请参考文档说明设置正确的背景音。

如果提示Engine return error code:418表示传递了不支持的发音人名称。

如果提示Engine return error code: 413表示使用的SSML格式错误。

如果提示Request json illegal,failed to parse request.表示传递的JSON格式非法。

如果提示SSML text length should be less than 300.表示传递的合成文本过长，建议使用长文本语音合成接口。

51020001

TTS:TtsServerError

受机器负载或网络等因素导致的异常，通常为偶发出现。

一般重试调用即可恢复。

RESTful API
更新时间：2025-01-16 16:54:25
产品详情
我的收藏
长文本语音合成RESTful API支持HTTPS POST方式请求，将待合成的文本通过HTTPS POST上传到服务端，服务端返回文本的语音合成结果。

功能介绍
支持如下设置：

合成音频的格式：.pcm、.wav、.mp3。

合成音频的采样率：8000 Hz、16000 Hz。

多种发音人。

可设置语速、语调、音量。

数据获取方式：轮询方式、回调方式。

重要
建议使用流式合成机制：随着TTS合成效果不断提升，算法的复杂度也越来越高，对您而言，可能会遇到合成耗时变长的情况，使用流式合成可以提供更快的响应速度。本文档及SDK示例中有相关流式处理示例代码可供参考。

不支持纯JavaScript直接调用RESTful接口：使用纯JavaScript直接访问RESTful接口可能会遇到跨域问题（Cross-Origin Resource Sharing, CORS），并且存在泄露App Key的风险。

前提条件
已获取项目Appkey，详情请参见创建项目。

已获取Access Token，详情请参见获取Token概述。

服务地址




访问类型

说明

URL

Host

外网访问

所有服务器均可使用外网访问URL。

https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async

nls-gateway-cn-shanghai.aliyuncs.com

内网访问

使用阿里云上海ECS（即ECS地域为华东2（上海）），可使用内网访问URL。

http://nls-gateway-cn-shanghai-internal.aliyuncs.com/rest/v1/tts/async

nls-gateway-cn-shanghai-internal.aliyuncs.com

重要
支持的协议类型：

外网访问：支持HTTP和HTTPS协议。

ECS内网访问：只支持HTTP协议。

本文的示例使用的是外网访问的方式。在实际业务场景中，请根据实际情况适配URL。

POST方法上传文本
一个完整的语音合成RESTful API POST请求包含以下要素：

URL




协议

URL

方法

HTTPS

https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async

POST

HTTPS POST请求体

请求体是请求参数组成的JSON格式字符串，因此在POST请求头部中的Content-Type必须设置为”application/json”，示例如下。

 
{
    "payload":{
        "tts_request":{
            "voice":"xiaoyun",
            "sample_rate":16000,
            "format":"wav",
            "text":"今天天气好晴朗",
            "enable_subtitle": true
        },
        "enable_notify":false
    },
    "context":{
        "device_id":"my_device_id"
    },
    "header":{
        "appkey":"yourAppkey",
        "token":"yourToken"
    }
}
请求响应
发送请求后，不论是调用成功还是失败，服务端的响应消息都会通过HTTP的消息体返回给客户端。使用HTTPS GET方法和使用HTTPS POST方法请求的响应是相同的，响应的结果都包含在HTTPS的Body中。响应结果的成功或失败通过HTTPS Header的Content-Type字段来区分：

成功响应

Body以JSON格式字符串表示，status字段为200，表示请求成功。

Body的data字段包含task_id。

失败响应

HTTPS Header没有Content-Type字段，或者Content-Type字段内容为application/json，表示合成失败，错误信息在Body中。

HTTPS Header的X-NLS-RequestId字段内容为请求任务的task_id。

Body内容为错误信息，以JSON格式的字符串表示。

错误信息字段如下表所示。




名称

类型

描述

task_id

String

32位请求任务ID，请记录该值，用于排查错误。

error_code

Integer

服务状态码。

error_message

String

服务状态描述。

发起请求后的成功响应

 
{
  "status":200,
  "error_code":20000000,
  "error_message":"SUCCESS",
  "request_id":"f0a9e2c49e9049e78730a3bf0b32****",
  "data":{
      "task_id":"35d9f813e00b11e9a2ce9ba0d6a2****"
  }
}
发起请求后的失败响应

 
{
  "error_message":"Meta:ACCESS_DENIED:The token 'fdf' is invalid!",
  "error_code":40000001,
  "request_id":"0d8c0eea55824aada9a374aec650****",
  "url":"/rest/v1/tts/async",
  "status":400
}
获取合成结果
根据上一步请求成功响应后返回的task_id，再次发送GET请求或者轮询获取，获取合成文件并下载。



参数

示例

URL

https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async

appkey

您的Appkey。

token

您的Token。

task_id

上一步请求成功响应后返回的task_id。

获取合成结果GET请求示例如下：

 
https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async?appkey={Appkey}&task_id={task_id}&token={Token}
命令执行成功或者轮询服务端合成状态的成功响应返回示例如下，其中audio_address为合成后语音的下载链接。

说明
audio_address字段对应的HTTP下载地址有期限最多只有7天。

 
/// 轮询时服务端返回的中间状态。
{
    "status":200,
    "error_code":20000000,
    "error_message":"RUNNING",
    "request_id":"a3370c49a29148e78b39978f98ba****",
    "data":{
        "task_id":"35d9f813e00b11e9a2ce9ba0d6a2****",
        "audio_address":null,
        "notify_custom":null
    }
}
/// 获取到最终合成结果。
{
    "status":200,
    "error_code":20000000,
    "error_message":"SUCCESS",
    "request_id":"c541eae489af48d69dae2d2e203a****",
    "data":{
        "sentences":[
            {
                "text":"长文本语音合成接口",
                "begin_time":"0",
                "end_time":"2239"
            },
            {
                "text":"一次返回所有文本对应的音频.现在需要增加句级别的时间戳信息",
                "begin_time":"2239",
                "end_time":"8499"
            },
            {
                "text":"客户可利用该信息，实现播放控制功能",
                "begin_time":"8499",
                "end_time":"12058"
            }
        ],
        "task_id":"f4e9bf53cb1611eab327b15f61b4****",
        "audio_address":"此处为生成的URL地址",
        "notify_custom":""
    }
}
如果开启enable_notify/notify_url，回调识别结果为：

 
 {
"data": {
"audio_address": "http://nls-cloud-cn-shanghai.oss-cn-shanghai.aliyuncs.com/******.wav",
"task_id": "e3a06366d**************e1257693b"
},
"request_id": "edc6b5ab4***********223c8ace71",
"status": 20000000,
"error_code": 20000000,
"error_message": "SUCCESS"
} 
服务状态码



服务状态码

服务状态描述

解决办法

20000000

请求成功

无。

40000000

默认的客户端错误码

检查对应的错误消息。

40000001

身份认证失败

检查使用的令牌是否正确，是否过期。

40000002

无效的消息

检查发送的消息是否符合要求。

40000003

无效的参数

检查参数值设置是否合理。

40000004

空闲超时

确认是否长时间没有发送数据到服务端。

40000005

请求数量过多

检查是否超过了并发连接数或者每秒钟请求数。

40000010

试用期已结束，并且未开通商用版、或账号欠费。

请登录控制台确认服务开通状态以及账户余额。

50000000

默认的服务端错误

内部服务错误，需要客户端进行重试。

50000001

内部GRPC调用错误

内部服务错误，需要客户端进行重试。

Java示例
说明
更多的Java示例可以下载nls-restful-java-demo查看。

依赖文件内容如下：

 
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>3.9.1</version>
</dependency>
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.83</version>
</dependency>
示例代码如下：

 
package com.alibaba.nls.client;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 此示例演示了长文本语音合成的使用方式。
 */
public class SpeechLongSynthesizerRestfulDemo {
    private static Logger logger = LoggerFactory.getLogger(SpeechLongSynthesizerRestfulDemo.class);
    private String accessToken;
    private String appkey;
    public SpeechLongSynthesizerRestfulDemo(String appkey, String token) {
        this.appkey = appkey;
        this.accessToken = token;
    }
    public void processPOSTRequest(String text, String format, int sampleRate, String voice) {
        String url = "https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async";
        // 拼接HTTP Post请求的消息体内容。
        JSONObject context = new JSONObject();
        // device_id设置，可以设置为自定义字符串或者设备信息id。
        context.put("device_id", "my_device_id");
        JSONObject header = new JSONObject();
        // 设置你的appkey。获取Appkey请前往控制台：https://nls-portal.console.aliyun.com/applist
        header.put("appkey", appkey);
        // 设置你的Token。获取Token具体操作，请参见：https://help.aliyun.com/document_detail/450514.html
        header.put("token", accessToken);
        // voice 发音人，可选，默认是xiaoyun。
        // volume 音量，范围是0~100，可选，默认50。
        // speech_rate 语速，范围是-500~500，可选，默认是0。
        // pitch_rate 语调，范围是-500~500，可选，默认是0。
        JSONObject tts = new JSONObject();
        tts.put("text", text);
        // 设置发音人。
        tts.put("voice", voice);
        // 设置编码格式。
        tts.put("format", format);
        // 设置采样率。
        tts.put("sample_rate", sampleRate);
        // 设置声音大小，可选。
        //tts.put("volume", 100);
        // 设置语速，可选。
        //tts.put("speech_rate", 200);
        // 长文本tts restful接口支持句级时间戳，默认为false。
        tts.put("enable_subtitle", true);
        JSONObject payload = new JSONObject();
        // 可选，是否设置回调。如果设置，则服务端在完成长文本语音合成之后回调用户此处设置的回调接口，将请求状态推送给用户侧。
        payload.put("enable_notify", false);
        payload.put("notify_url", "http://123.com");
        payload.put("tts_request", tts);
        JSONObject json = new JSONObject();
        json.put("context", context);
        json.put("header", header);
        json.put("payload", payload);
        String bodyContent = json.toJSONString();
        logger.info("POST Body Content: " + bodyContent);
        // 发起请求
        RequestBody reqBody = RequestBody.create(MediaType.parse("application/json"), bodyContent);
        Request request = new Request.Builder()
            .url(url)
            .header("Content-Type", "application/json")
            .post(reqBody)
            .build();
        try {
            OkHttpClient client = new OkHttpClient();
            Response response = client.newCall(request).execute();
            String contentType = response.header("Content-Type");
            System.out.println("contentType = " + contentType);
            // 获取结果，并根据返回进一步进行处理。
            String result = response.body().string();
            response.close();
            System.out.println("result = " + result);
            JSONObject resultJson = JSON.parseObject(result);
            if(resultJson.containsKey("error_code") && resultJson.getIntValue("error_code") == 20000000) {
                logger.info("Request Success! task_id = " + resultJson.getJSONObject("data").getString("task_id"));
                String task_id = resultJson.getJSONObject("data").getString("task_id");
                String request_id = resultJson.getString("request_id");
                /// 可选：轮询检查服务端的合成状态，该轮询操作非必须，如果设置了回调url，则服务端会在合成完成后主动回调。
                waitLoop4Complete(url, appkey, accessToken, task_id, request_id);
            }else {
                logger.error("Request Error: status=" + resultJson.getIntValue("status")
                    + ", error_code=" + resultJson.getIntValue("error_code")
                    + ", error_message=" + resultJson.getString("error_message"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    /// 根据特定信息轮询检查某个请求在服务端的合成状态，轮询操作非必须，如果设置了回调url，则服务端会在合成完成后主动回调。
    private void waitLoop4Complete(String url, String appkey, String token, String task_id, String request_id) {
        String fullUrl = url + "?appkey=" + appkey + "&task_id=" + task_id + "&token=" + token + "&request_id=" + request_id;
        System.out.println("query url = " + fullUrl);
        while(true) {
            Request request = new Request.Builder().url(fullUrl).get().build();
            try {
                OkHttpClient client = new OkHttpClient();
                Response response = client.newCall(request).execute();
                String result = response.body().string();
                response.close();
                System.out.println("waitLoop4Complete = " + result);
                JSONObject resultJson = JSON.parseObject(result);
                if(resultJson.containsKey("error_code")
                    && resultJson.getIntValue("error_code") == 20000000
                    && resultJson.containsKey("data")
                    && resultJson.getJSONObject("data").getString("audio_address") != null) {
                    logger.info("Tts Finished! task_id = " + resultJson.getJSONObject("data").getString("task_id"));
                    logger.info("Tts Finished! audio_address = " + resultJson.getJSONObject("data").getString("audio_address"));
                    break;
                }else {
                    logger.info("Tts Queuing...");
                }
                // 每隔10秒钟轮询一次状态。
                Thread.sleep(10000);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("SpeechLongSynthesizerRestfulDemo need params: <token> <app-key>");
            System.exit(-1);
        }
        String token = args[0];
        String appkey = args[1];
        SpeechLongSynthesizerRestfulDemo demo = new SpeechLongSynthesizerRestfulDemo(appkey, token);
        String text = "我家的后面有一个很大的园，相传叫作百草园。现在是早已并屋子一起卖给朱文公的子孙了，连那最末次的相见也已经隔了七八年，其中似乎确凿只有一些野草；但那时却是我的乐园。";
        String format = "wav";
        int sampleRate = 16000;
        String voice = "siyue";
        demo.processPOSTRequest(text, format, sampleRate, voice);
    }
}
Python示例
说明
Python 2.x请使用httplib模块；Python 3.x请使用http.client模块。

创建HTTP/HTTPS连接时，Python 2.x使用httplib模块，Python 3.x使用http.client模块：

Python 2.xPython 3.x
创建HTTP连接创建HTTPS连接
 
import httplib

host = 'nls-gateway-cn-shanghai.aliyuncs.com'
conn = httplib.HTTPConnection(host)
采用RFC 3986规范进行urlencode编码，Python 2.x请使用urllib模块的urllib.quote，Python 3.x请使用urllib.parse模块的urllib.parse.quote_plus。

Python 3.x
Python 2.x
PHP示例
说明
PHP示例中使用了cURL函数，要求PHP的版本为4.0.2以上，并且确保已安装cURL扩展。

 
<?php
// 根据特定信息轮询检查某个请求在服务端的合成状态，每隔10秒钟轮询一次状态.轮询操作非必须，如果设置了回调url，则服务端会在合成完成后主动回调。
function waitLoop4Complete($url, $appkey, $token, $task_id, $request_id) {
    $fullUrl = $url . "?appkey=" . $appkey . "&task_id=" . $task_id . "&token=" . $token . "&request_id=" . $request_id;
    print "query url = " . $fullUrl . "\n";
    while(true) {
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($curl, CURLOPT_URL, $fullUrl);
        curl_setopt($curl, CURLOPT_HEADER, TRUE);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, FALSE);
        $response = curl_exec($curl);
        if ($response == FALSE) {
            print "curl_exec failed!\n";
            curl_close($curl);
            return ;
        }
        // 处理服务端返回的响应。
        $headerSize = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
        $headers = substr($response, 0, $headerSize);
        $bodyContent = substr($response, $headerSize);
        print $bodyContent."\n";
        $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        if($http_code != 200) {     // 如果请求失败，需要检查调用是否正确。
            print "tts request failure, error code = " . $http_code . "\n";
            curl_close($curl);
            return ;
        }
        curl_close($curl);
        $data = json_decode($bodyContent, true);

        //$data["data"]["audio_address"]== null时表示还在合成未完成的状态,需要等待。。。
        if(isset($data["error_code"]) && $data["error_code"] == 20000000
            && isset($data["data"]) && $data["data"]["audio_address"]== null){

            print "Tts Queuing...please wait..." . "\n";
            
        }
        else if(isset($data["error_code"]) && $data["error_code"] == 20000000
            && isset($data["data"]) && $data["data"]["audio_address"] != "")  {
            print "Tts Finished! task_id = " . $data["data"]["task_id"] . "\n";
            print "Tts Finished! audio_address = " . $data["data"]["audio_address"] . "\n";
            break;
        }

        // 每隔10秒钟轮询一次状态。
        sleep(10);
    }
}
// 长文本语音合成restful接口，支持post调用，不支持get请求。发出请求后，可以轮询状态或者等待服务端合成后自动回调（如果设置了回调参数）。
function requestLongTts4Post($appkey, $token, $text, $voice, $format, $sampleRate) {

    $url = "https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async";

    // 拼接HTTP Post请求的消息体内容。
    $header = array("appkey" => $appkey, "token" => $token);
    $context = array("device_id" => "my_device_id");
    $tts_request = array("text" => $text, "format" => $format, "voice" => $voice, "sample_rate" => $sampleRate, "enable_subtitle" => false);
    $payload = array("enable_notify" => true, "notify_url" => "http://123.com", "tts_request" => $tts_request);
    $tts_body = array("context" => $context, "header" => $header, "payload" => $payload);
    $body = json_encode($tts_body);
    print "The POST request body content: " . $body . "\n";
    $httpHeaders = array("Content-Type: application/json");
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_POST, TRUE);
    curl_setopt($curl, CURLOPT_HTTPHEADER, $httpHeaders);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    curl_setopt($curl, CURLOPT_HEADER, TRUE);
    $response = curl_exec($curl);
    if ($response == FALSE) {
        print "curl_exec failed!\n";
        curl_close($curl);
        return ;
    }
    $headerSize = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    $bodyContent = substr($response, $headerSize);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if($http_code != 200) {
        print "tts request failure, error code = " . $http_code . "\n";
        print "tts request failure, response = " . $bodyContent . "\n";
        return ;
    }
    curl_close($curl);
    print $bodyContent . "\n";
    $data = json_decode($bodyContent, true);
    if( isset($data["error_code"]) && $data["error_code"] == 20000000) {
        $task_id = $data["data"]["task_id"];
        $request_id = $data["request_id"];
        print "Request Success! task_id = " . $task_id . "\n";
        print "Request Success! request_id = " . $request_id . "\n";
        ///说明：轮询检查服务端的合成状态，轮询操作非必须，如果设置了回调url，则服务端会在合成完成后主动回调。
        waitLoop4Complete($url, $appkey, $token, $task_id, $request_id);
    } else {
        print "Request Error: status=" . $data["status"] . "; error_code=" . $data["error_code"] . "; error_message=" . $data["error_message"] . "\n";
    }
}

$appkey = "yourAppkey";
$token = "yourToken";

$text = "今天是周一，天气挺好的。";
$format = "wav";
$voice = "xiaogang";
$sampleRate = 16000;
requestLongTts4Post($appkey, $token, $text, $voice, $format, $sampleRate);

?>
Node.js示例
首先安装request依赖，请在您的示例文件所在目录执行如下命令：

 
npm install request --save
示例代码如下：

 
const request = require('request');
const fs = require('fs');
    // 长文本语音合成restful接口，支持post调用，不支持get请求。发出请求后，可以轮询状态或者等待服务端合成后自动回调（如果设置了回调参数）。
    function requestLongTts4Post(textValue, appkeyValue, tokenValue, voiceValue, formatValue, sampleRateValue) {
        
        var url = "https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async"
        console.log(url);
        // 请求参数，以JSON格式字符串填入HTTPS POST请求的Body中。
        var context = {
            device_id : "device_id",
        };
        var header = {
            appkey : appkeyValue,
            token : tokenValue,
        };
        var tts_request = {
            text : textValue,
            voice : voiceValue,
            format : formatValue,
            "sample_rate" : sampleRateValue,
            "enable_subtitle" : false
        };
        var payload = {
            "enable_notify" : false,
            "notify_url": "http://123.com",
            "tts_request" : tts_request,
        };
        var tts_body = {
            "context" : context,
            "header" : header,
            "payload" : payload
        };
        var bodyContent = JSON.stringify(tts_body);
        console.log('The POST request body content: ' + bodyContent);
        // 设置HTTPS POST请求头部。
        var httpHeaders = {'Content-type' : 'application/json'};
        // 设置HTTPS POST请求。
        // encoding必须设置为null，HTTPS响应的Body为二进制Buffer类型。
        var options = {
            url: url,
            method: 'POST',
            headers: httpHeaders,
            body: bodyContent,
            encoding: null
        };
        request(options, function (error, response, body) {
            // 处理服务端的响应。
            if (error != null) {
                console.log(error);
            } else {
                if(response.statusCode != 200) {
                    console.log("Http Request Fail: " + response.statusCode + "; " + body.toString());
                    return;
                }
                console.log("response result: " + body.toString());
                var code = 0;
                var task_id = "";
                var request_id = "";
                var json = JSON.parse(body.toString());
                console.info(json);
                for(var key in json){  
                    if(key=='error_code'){
                        code = json[key]
                    } else if(key=='request_id'){
                        request_id = json[key]
                    } else if(key == "data") {
                        task_id = json[key]["task_id"];
                    }
                }
                if(code == 20000000) {
                    console.info("Request Success! task_id = " + task_id);
                    console.info("Request Success! request_id = " + request_id);
                    /// 说明：轮询检查服务端的合成状态，轮询操作非必须，如果设置了回调url，则服务端会在合成完成后主动回调。
                    waitLoop4Complete(url, appkey, token, task_id, request_id);
                } else {
                    console.info("Request Error: status=" + $data["status"] + "; error_code=" + $data["error_code"] + "; error_message=" + $data["error_message"]);
                }
            }
        });
        
    }
    // 根据特定信息轮询检查某个请求在服务端的合成状态，每隔10秒钟轮询一次状态.轮询操作非必须，如果设置了回调url，则服务端会在合成完成后主动回调。
    function waitLoop4Complete(urlValue, appkeyValue, tokenValue, task_id_value, request_id_value) {
        var fullUrl = urlValue + "?appkey=" + appkeyValue + "&task_id=" + task_id_value + "&token=" + tokenValue + "&request_id=" + request_id_value;
        console.info("query url = " + fullUrl);
        //while(true) {
        var timer = setInterval(() => {
            var options = {
                url: fullUrl,
                method: 'GET'
            };
            console.info("query url = " + fullUrl);
            request(options, function (error, response, body) {
                // 处理服务端的响应。
                if (error != null) {
                    console.log(error);
                } else if(response.statusCode != 200) {
                    console.log("Http Request Fail: " + response.statusCode + "; " + body.toString());
                    return;
                } else {
                    console.log("query result: " + body.toString());
                    var code = 0;
                    var task_id = "";
                    var output_url = "";
                    var json = JSON.parse(body.toString());
                    console.info(json);
                    for(var key in json){  
                        if(key=='error_code'){
                            code = json[key]
                        } else if(key=='request_id'){
                            request_id = json[key]
                        } else if(key == "data" && json["data"] != null) {
                            task_id = json[key]["task_id"];
                            audio_address = json[key]["audio_address"];
                        }
                    }
                    if(code == 20000000 && audio_address == null) {

                        console.info("Tts Queuing...please wait...");
                    }
                    else if(code == 20000000 && audio_address != "") {
                        console.info("Tts Finished! task_id = " + task_id);
                        console.info("Tts Finished! audio_address = " + audio_address);
                        // 退出轮询。
                        clearInterval(timer);
                    } 
                }
            }
            );
        }
    , 10000);
    }

var appkey = 'yourAppkey';
var token = 'yourToken';

var text = '今天是周一，天气挺好的。';
var voice = "xiaogang";
var format = 'wav';
var sampleRate = 16000;
requestLongTts4Post(text, appkey, token, voice, format, sampleRate);
GO示例
 
package main

import (
 "bytes"
 "encoding/json"
 "fmt"
 "io/ioutil"
 "net/http"
 "strconv"
 "time"
)

// 长文本语音合成restful接口，支持post调用，不支持get请求。发出请求后，可以轮询状态或者等待服务端合成后自动回调（如果设置了回调参数）。
func requestLongTts4Post(text string, appkey string, token string) {

 var url string = "https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async"

 // 拼接HTTP Post请求的消息体内容。
 context := make(map[string]interface{})
 context["device_id"] = "test-device"
 header := make(map[string]interface{})
 header["appkey"] = appkey
 header["token"] = token
 tts_request := make(map[string]interface{})
 tts_request["text"] = text
 tts_request["format"] = "wav"
 tts_request["voice"] = "xiaogang"
 tts_request["sample_rate"] = 16000
 tts_request["enable_subtitle"] = false
 payload := make(map[string]interface{})
 payload["enable_notify"] = false
 payload["notify_url"] = "http://123.com"
 payload["tts_request"] = tts_request
 ttsBody := make(map[string]interface{})
 ttsBody["context"] = context
 ttsBody["header"] = header
 ttsBody["payload"] = payload
 ttsBodyJson, err := json.Marshal(ttsBody)
 if err != nil {
  panic(nil)
 }
 fmt.Println(string(ttsBodyJson))
 // 发送HTTPS POST请求，处理服务端的响应。
 response, err := http.Post(url, "application/json;charset=utf-8", bytes.NewBuffer([]byte(ttsBodyJson)))
 if err != nil {
  panic(err)
 }
 defer response.Body.Close()
 contentType := response.Header.Get("Content-Type")
 body, _ := ioutil.ReadAll(response.Body)
 fmt.Println(string(contentType))
 fmt.Println(string(body))
 statusCode := response.StatusCode
 if statusCode == 200 {
  fmt.Println("The POST request succeed!")
  var f interface{}
  err := json.Unmarshal(body, &f)
  if err != nil {
   fmt.Println(err)
  }
  // 从消息体中解析出来task_id（重要）和request_id。
  var taskId string = ""
  var requestId string = ""
  m := f.(map[string]interface{})
  for k, v := range m {
   if k == "error_code" {
    fmt.Println("error_code = ", v)
   } else if k == "request_id" {
    fmt.Println("request_id = ", v)
    requestId = v.(string)

   } else if k == "data" {
    fmt.Println("data = ", v)
    data := v.(map[string]interface{})
    fmt.Println(data)
    taskId = data["task_id"].(string)

   }
  }

  // 说明：轮询检查服务端的合成状态，轮询操作非必须，如果设置了回调url，则服务端会在合成完成后主动回调。
  waitLoop4Complete(url, appkey, token, taskId, requestId)

 } else {
  fmt.Println("The POST request failed: " + string(body))
  fmt.Println("The HTTP statusCode: " + strconv.Itoa(statusCode))
 }

}

// 根据特定信息轮询检查某个请求在服务端的合成状态，每隔10秒钟轮询一次状态.轮询操作非必须，如果设置了回调url，则服务端会在合成完成后主动回调。
func waitLoop4Complete(url string, appkey string, token string, task_id string, request_id string) {
 var fullUrl string = url + "?appkey=" + appkey + "&task_id=" + task_id + "&token=" + token + "&request_id=" + request_id
 fmt.Println("fullUrl=" + fullUrl)
 for {
  response, err := http.Get(fullUrl)
  if err != nil {
   fmt.Println("The GET request failed!")
   panic(err)
  }
  defer response.Body.Close()
  body, _ := ioutil.ReadAll(response.Body)
  fmt.Println("waitLoop4Complete = ", string(body))
  var f interface{}
  json.Unmarshal(body, &f)
  if err != nil {
   fmt.Println(err)
  }
  // 从消息体中解析出来task_id（重要）和request_id。
  var code float64 = 0
  var taskId string = ""
  var audioAddress string = ""
  m := f.(map[string]interface{})
  for k, v := range m {
   if k == "error_code" {
    code = v.(float64)
   } else if k == "request_id" {
   } else if k == "data" {
    if v != nil {
     data := v.(map[string]interface{})
     taskId = data["task_id"].(string)
     if data["audio_address"] == nil {
      fmt.Println("Tts Queuing...,please wait...")

     } else {
      audioAddress = data["audio_address"].(string)
     }
    }
   }
  }
  if code == 20000000 && audioAddress != "" {
   fmt.Println("Tts Finished! task_id = " + taskId)
   fmt.Println("Tts Finished! audio_address = " + audioAddress)
   break
  } else {
   // 每隔10秒钟轮询一次状态
   time.Sleep(time.Duration(10) * time.Second)
  }
 }
}
func main() {
 var appkey string = "yourAppkey"
 var token string = "yourToken"
 var text string = "今天是周一，天气挺好的。"
 requestLongTts4Post(text, appkey, token)

}

appkey:mccEYGPkIx0ew9Pe