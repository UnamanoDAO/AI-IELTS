Node.js SDK

本文介绍如何使用智能语音交互一句话识别的Node.js SDK，包括SDK的安装方法及SDK代码示例等。

前提条件
在使用SDK前，请先阅读接口说明，详情请参见接口说明。

请确认已经安装nodejs&npm环境，并完成基本配置。

SDK支持nodev14及以上版本。

下载安装
下载并安装SDK。

通过以下命令完成SDK下载和安装。

 
npm install alibabacloud-nls
导入SDK。

在代码中使用require或者import导入SDK。

 
const Nls = require('alibabacloud-nls')
//Nls内部含SpeechRecognition, SpeechTranscription, SpeechSynthesizer
//以下为使用import导入SDK
//import { SpeechRecognition } from "alibabacloud-nls"
//import { SpeechTranscription } from "alibabacloud-nls"
//import { SpeechSynthesizer } from "alibabacloud-nls"
一句话识别
Class: SpeechRecognition
SpeechRecognition类用于进行一句话识别。

构造函数参数说明：




参数

类型

参数说明

config

Object

连接配置对象。

config object说明：




参数

类型

参数说明

url

String

服务URL地址。

token

String

访问Token，详情可参见获取Token概述。

appkey

String

对应项目Appkey。获取Appkey请前往控制台。

defaultStartParams()
返回一个默认的推荐参数，其中Format为PCM，采样率为16000 Hz，中间结果、标点预测和ITN均为打开状态。您在拿到默认对象后可以根据自身需求，结合接口说明中的参数列表来添加和修改参数。

参数说明：无。

返回值：

object类型对象，字段如下：

 
{
    "format": "pcm",
    "sample_rate": 16000,
    "enable_intermediate_result": true,
    "enable_punctuation_predition": true,
    "enable_inverse_text_normalization": true
}
on(which, handler)
设置事件回调。

参数说明：




参数

类型

参数说明

which

String

事件名称。

handler

Function

回调函数。

支持的回调事件如下：





事件名称

事件说明

回调函数参数个数

回调函数参数说明

started

一句话识别开始。

1

String类型，开始信息。

changed

一句话识别中间结果。

1

String类型，中间结果信息。

completed

一句话识别完成。

1

String类型，完成信息。

closed

连接关闭。

0

无。

failed

错误。

1

String类型，错误信息。

返回值：无。

async start(param, enablePing, pingInterval)
根据param发起一次一句话识别，param可以参考defaultStartParams方法的返回，具体参数见接口说明。

参数说明：




参数

类型

参数说明

param

Object

一句话识别参数。

enablePing

Boolean

是否自动向云端发送ping请求，默认false。

true：发送。

false：不发送。

pingInterval

Number

发ping请求间隔时间，默认6000，单位为毫秒。

返回值： Promise对象，当started事件发生后触发resolve，并携带started信息；当任何错误发生后触发reject，并携带异常信息。

async close(param)
停止一句话识别。

参数说明：




参数

类型

参数说明

param

Object

一句话识别结束参数。

返回值：

Promise对象，当completed事件发生后触发resolve，并携带completed信息；当任何错误发生后触发reject，并携带异常信息。

shutdown()
强制断开连接。

参数说明：无。

返回值：无。

sendAudio(data)
发送音频，音频格式必须和参数中一致。

参数说明：




参数

类型

参数说明

data

Buffer

二进制音频数据。

返回值：无。

代码示例
 
"use strict"

const Nls = require("alibabacloud-nls")
const fs = require("fs")
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))

const URL = "wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1"
const APPKEY = "Your Appkey"      //获取Appkey请前往控制台：https://nls-portal.console.aliyun.com/applist
const TOKEN = "Your Token"      //获取Token具体操作，请参见：https://help.aliyun.com/document_detail/450514.html

let audioStream = fs.createReadStream("test1.pcm", {
  encoding: "binary",
  highWaterMark: 1024
})
let b1 = []

audioStream.on("data", (chunk) => {
  let b = Buffer.from(chunk, "binary")
  b1.push(b)
})

audioStream.on("close", async ()=>{
  while (true) {
    let sr = new Nls.SpeechRecognition({
      url: URL,
      appkey:APPKEY,
      token:TOKEN
    })

    sr.on("started", (msg)=>{
      console.log("Client recv started:", msg)
    })

    sr.on("changed", (msg)=>{
      console.log("Client recv changed:", msg)
    })

    sr.on("completed", (msg)=>{
      console.log("Client recv completed:", msg)
    })

    sr.on("closed", () => {
      console.log("Client recv closed")
    })

    sr.on("failed", (msg)=>{
      console.log("Client recv failed:", msg)
    })

    try {
      await sr.start(sr.defaultStartParams(), true, 6000)
    } catch(error) {
      console.log("error on start:", error)
      continue
    }

    try {
      for (let b of b1) {
        if (!sr.sendAudio(b)) {
          throw new Error("send audio failed")
        }
        await sleep(20)
      }
    } catch(error) {
      console.log("sendAudio failed:", error)
      continue
    }

    try {
      console.log("close...")
      await sr.close()
    } catch(error) {
      console.log("error on close:", error)
    }
    await sleep(2000)
  }
})